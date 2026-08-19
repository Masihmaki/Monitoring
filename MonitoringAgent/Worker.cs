namespace MonitoringAgent;

using System.Diagnostics;
using System.Net.Http.Json;
using System.Runtime.InteropServices;

public class Worker : BackgroundService
{
    private readonly ILogger<Worker> _logger;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly int _pollingIntervalInSeconds;
    private readonly string? _apiKey;
    private PerformanceCounter? _cpuCounter;
    private long _prevIdleTime;
    private long _prevTotalTime;

    public Worker(
        ILogger<Worker> logger,
        IHttpClientFactory httpClientFactory,
        IConfiguration configuration)
    {
        _logger = logger;
        _httpClientFactory = httpClientFactory;
        _pollingIntervalInSeconds = configuration.GetValue("MonitoringApi:PollingIntervalSeconds", 30);
        _apiKey = configuration["MonitoringApi:ApiKey"];
    }

    public override Task StartAsync(CancellationToken cancellationToken)
    {
        if (RuntimeInformation.IsOSPlatform(OSPlatform.Windows))
        {
            _cpuCounter = new PerformanceCounter("Processor", "% Processor Time", "_Total");
            _cpuCounter.NextValue();
        }

        return base.StartAsync(cancellationToken);
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                var metrics = CollectAllMetrics();
                await SendMetricsToApiAsync(metrics, stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to collect or send metrics.");
            }

            await Task.Delay(TimeSpan.FromSeconds(_pollingIntervalInSeconds), stoppingToken);
        }
    }

    public override void Dispose()
    {
        _cpuCounter?.Dispose();
        base.Dispose();
    }

    private MetricPayload CollectAllMetrics()
    {
        var ramInfo = GetRamMetrics();

        return new MetricPayload
        {
            MachineName = Environment.MachineName,
            Timestamp = DateTime.UtcNow,
            CpuUsagePercent = GetCpuUsage(),
            RamTotalMb = ramInfo.TotalMb,
            RamUsedMb = ramInfo.UsedMb,
            RamUsagePercent = ramInfo.UsagePercent,
            Disks = GetDiskMetrics()
        };
    }

    private List<DiskMetric> GetDiskMetrics()
    {
        var result = new List<DiskMetric>();

        foreach (var drive in DriveInfo.GetDrives())
        {
            if (!drive.IsReady || drive.DriveType != DriveType.Fixed)
            {
                continue;
            }

            var totalSpace = drive.TotalSize;
            var freeSpace = drive.TotalFreeSpace;
            var usedPercentage = totalSpace == 0 ? 0 : ((double)(totalSpace - freeSpace) / totalSpace) * 100;

            result.Add(new DiskMetric
            {
                DriveName = drive.Name,
                FreeGb = Math.Round(freeSpace / (1024.0 * 1024.0 * 1024.0), 2),
                TotalGb = Math.Round(totalSpace / (1024.0 * 1024.0 * 1024.0), 2),
                UsedPercent = Math.Round(usedPercentage, 2)
            });
        }

        return result;
    }

    private (double TotalMb, double UsedMb, double UsagePercent) GetRamMetrics()
    {
        double freeMemoryMb;
        double totalMemoryMb;

        if (RuntimeInformation.IsOSPlatform(OSPlatform.Windows))
        {
            (totalMemoryMb, freeMemoryMb) = GetWindowsRamMegabytes();
        }
        else if (RuntimeInformation.IsOSPlatform(OSPlatform.Linux))
        {
            (totalMemoryMb, freeMemoryMb) = GetLinuxRamMegabytes();
        }
        else
        {
            return (0, 0, 0);
        }

        var usedMemoryMb = Math.Max(0, totalMemoryMb - freeMemoryMb);
        var usagePercent = totalMemoryMb > 0 ? (usedMemoryMb / totalMemoryMb) * 100 : 0;

        return (
            Math.Round(totalMemoryMb, 2),
            Math.Round(usedMemoryMb, 2),
            Math.Round(usagePercent, 2)
        );
    }

    private static (double TotalMb, double FreeMb) GetWindowsRamMegabytes()
    {
        var status = new MemoryStatusEx
        {
            Length = (uint)Marshal.SizeOf<MemoryStatusEx>()
        };
        if (!GlobalMemoryStatusEx(ref status))
        {
            throw new InvalidOperationException("GlobalMemoryStatusEx failed while reading physical memory.");
        }

        return (status.TotalPhys / (1024.0 * 1024.0), status.AvailPhys / (1024.0 * 1024.0));
    }

    private static (double TotalMb, double FreeMb) GetLinuxRamMegabytes()
    {
        double totalMemoryMb = 0;
        double freeMemoryMb = 0;

        foreach (var line in File.ReadAllLines("/proc/meminfo"))
        {
            if (line.StartsWith("MemTotal:"))
            {
                totalMemoryMb = ParseKbToMb(line);
            }
            else if (line.StartsWith("MemAvailable:"))
            {
                freeMemoryMb = ParseKbToMb(line);
            }
        }

        return (totalMemoryMb, freeMemoryMb);
    }

    private static double ParseKbToMb(string line)
    {
        var parts = line.Split(':', StringSplitOptions.TrimEntries);
        var valueStr = parts[1].Replace("kB", "", StringComparison.OrdinalIgnoreCase).Trim();
        return double.TryParse(valueStr, out var kb) ? kb / 1024.0 : 0;
    }

    private double GetCpuUsage()
    {
        if (RuntimeInformation.IsOSPlatform(OSPlatform.Windows))
        {
            return _cpuCounter != null ? Math.Round(_cpuCounter.NextValue(), 2) : 0;
        }

        if (RuntimeInformation.IsOSPlatform(OSPlatform.Linux))
        {
            return Math.Round(GetLinuxCpuUsage(), 2);
        }

        return 0;
    }

    private double GetLinuxCpuUsage()
    {
        try
        {
            var firstLine = File.ReadLines("/proc/stat").First();
            var parts = firstLine.Split(' ', StringSplitOptions.RemoveEmptyEntries);

            var user = long.Parse(parts[1]);
            var nice = long.Parse(parts[2]);
            var system = long.Parse(parts[3]);
            var idle = long.Parse(parts[4]);
            var iowait = long.Parse(parts[5]);
            var irq = long.Parse(parts[6]);
            var softirq = long.Parse(parts[7]);

            var currentIdleTime = idle + iowait;
            var currentTotalTime = user + nice + system + idle + iowait + irq + softirq;

            var idleDelta = currentIdleTime - _prevIdleTime;
            var totalDelta = currentTotalTime - _prevTotalTime;

            _prevIdleTime = currentIdleTime;
            _prevTotalTime = currentTotalTime;

            if (totalDelta == 0)
            {
                return 0;
            }

            return (1.0 - ((double)idleDelta / totalDelta)) * 100.0;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to read Linux CPU metrics from /proc/stat");
            return 0;
        }
    }

    private async Task SendMetricsToApiAsync(MetricPayload payload, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(_apiKey) || _apiKey == "PASTE_FROM_DASHBOARD")
        {
            _logger.LogError("MonitoringApi:ApiKey is missing. Copy the agent key from the dashboard into appsettings.json.");
            return;
        }

        try
        {
            var client = _httpClientFactory.CreateClient("MonitoringApi");
            var response = await client.PostAsJsonAsync("metrics", payload, cancellationToken);

            if (response.IsSuccessStatusCode)
            {
                _logger.LogInformation("Successfully sent metrics at {time}", DateTimeOffset.Now);
            }
            else
            {
                _logger.LogWarning("Failed to send metrics. Status Code: {statusCode}", response.StatusCode);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while sending metrics to the API.");
        }
    }

    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Auto)]
    private struct MemoryStatusEx
    {
        public uint Length;
        public uint MemoryLoad;
        public ulong TotalPhys;
        public ulong AvailPhys;
        public ulong TotalPageFile;
        public ulong AvailPageFile;
        public ulong TotalVirtual;
        public ulong AvailVirtual;
        public ulong AvailExtendedVirtual;
    }

    [DllImport("kernel32.dll", CharSet = CharSet.Auto, SetLastError = true)]
    [return: MarshalAs(UnmanagedType.Bool)]
    private static extern bool GlobalMemoryStatusEx(ref MemoryStatusEx buffer);
}
