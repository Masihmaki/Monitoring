namespace MonitoringAgent;
using System.Runtime.InteropServices;
using System.IO;
using System.Diagnostics;
using System.Net.Http; // برای IHttpClientFactory و HttpClient
using System.Net.Http.Json; // برای متد بهینه‌ی PostAsJsonAsync
public class Worker : BackgroundService
{
    private readonly ILogger<Worker> _logger;
    private const int PollingIntervalInSeconds = 30; 
    private readonly IHttpClientFactory _httpClientFactory;

    public Worker(ILogger<Worker> logger, IHttpClientFactory httpClientFactory)
    {
        _logger = logger;
        _httpClientFactory = httpClientFactory;
    }


    // protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    // {
    //     while (!stoppingToken.IsCancellationRequested)
    //     {
    //         _logger.LogInformation("Starting metrics collection at: {time}", DateTimeOffset.Now);

    //         try
    //         {
    //             CollectDiskMetrics();
    //             CollectRamMetrics();
    //             CollectCpuMetrics();
    //             // TODO: ۲. پایش RAM در گام بعدی
    //             // TODO: ۳. پایش CPU در گام بعدی
    //         }
    //         catch (Exception ex)
    //         {
    //             _logger.LogError(ex, "An error occurred while collecting metrics.");
    //         }

    //         await Task.Delay(TimeSpan.FromSeconds(PollingIntervalInSeconds), stoppingToken);
    //     }
    // }
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            // ۱. جمع‌آوری اطلاعات
            var metrics = CollectAllMetrics();

            // ۲. ارسال اطلاعات به Backend
            await SendMetricsToApiAsync(metrics, stoppingToken);

            // ۳. توقف ۳۰ ثانیه‌ای
            await Task.Delay(TimeSpan.FromSeconds(PollingIntervalInSeconds), stoppingToken);
        }
    }
    private List<DiskMetric> GetDiskMetrics()
    {
        DriveInfo[] allDrives = DriveInfo.GetDrives();
        List<DiskMetric> result = new List<DiskMetric>();
        foreach (var drive in allDrives)
        {
            if (drive.IsReady && drive.DriveType == DriveType.Fixed)
            {
                long totalSpace = drive.TotalSize;
                long freeSpace = drive.TotalFreeSpace;
                long usedSpace = totalSpace - freeSpace;
                
                double usedPercentage = ((double)usedSpace / totalSpace) * 100;

                // _logger.LogInformation(
                //     "Drive {DriveName} -> Total: {TotalGB} GB | Free: {FreeGB} GB | Used: {UsedPercent:F2}%", 
                //     drive.Name, 
                //     totalSpace / (1024 * 1024 * 1024), 
                //     freeSpace / (1024 * 1024 * 1024),
                //     usedPercentage
                // );
                result.Add(new DiskMetric
                {
                    DriveName = drive.Name,
                    FreeGb = Math.Round((double)freeSpace / (1024 * 1024 * 1024), 2),
                    TotalGb = Math.Round((double)totalSpace / (1024 * 1024 * 1024), 2),
                    UsedPercent = Math.Round(usedPercentage, 2)
                });
            }
        }
        return result;
    }
    // private double _currentRamTotalMb;
    // private double _currentRamUsagePercent;
    // private double _currentRamUsedMb;
    // private void CollectRamMetrics()
    // {
    //     double freeMemoryMb = 0;

    //     if (RuntimeInformation.IsOSPlatform(OSPlatform.Windows))
    //     {
    //         // در ویندوز استفاده از PerformanceCounter برای رم آزاد
    //         using var counter = new PerformanceCounter("Memory", "Available MBytes");
    //         freeMemoryMb = counter.NextValue();

    //         // برای کل رم سیستم در ویندوز می‌توان از GC یا WMI استفاده کرد
    //         // در اینجا به صورت تقریبی کل رم فیزیکی اختصاص یافته به سیستم را می‌گیریم
    //         _currentRamTotalMb = GC.GetGCMemoryInfo().TotalAvailableMemoryBytes / (1024.0 * 1024.0);
    //     }
    //     else if (RuntimeInformation.IsOSPlatform(OSPlatform.Linux))
    //     {
    //         // در لینوکس خواندن فایل proc/meminfo/ که متنی و بسیار ساده است
    //         string[] lines = File.ReadAllLines("/proc/meminfo");
    //         foreach (var line in lines)
    //         {
    //             if (line.StartsWith("MemTotal:"))
    //                 _currentRamTotalMb = ParseKbToMb(line);
    //             else if (line.StartsWith("MemAvailable:"))
    //                 freeMemoryMb = ParseKbToMb(line);
    //         }
    //     }

    //     _currentRamUsedMb = _currentRamTotalMb - freeMemoryMb;
    //     _currentRamUsagePercent = (_currentRamUsedMb / _currentRamTotalMb) * 100;

    //     // _logger.LogInformation(
    //     //     "RAM -> Total: {Total:F2} MB | Used: {Used:F2} MB | Usage: {Percent:F2}%",
    //     //     _currentRamTotalMb,
    //     //     _currentRamUsedMb,
    //     //     _currentRamUsagePercent
    //     // );
    // }
    private (double TotalMb, double UsedMb, double UsagePercent) GetRamMetrics()
    {
        double freeMemoryMb = 0;
        double totalMemoryMb = 0;

        if (RuntimeInformation.IsOSPlatform(OSPlatform.Windows))
        {
            using var counter = new PerformanceCounter("Memory", "Available MBytes");
            freeMemoryMb = counter.NextValue();
            totalMemoryMb = GC.GetGCMemoryInfo().TotalAvailableMemoryBytes / (1024.0 * 1024.0);
        }
        else if (RuntimeInformation.IsOSPlatform(OSPlatform.Linux))
        {
            string[] lines = File.ReadAllLines("/proc/meminfo");
            foreach (var line in lines)
            {
                if (line.StartsWith("MemTotal:"))
                    totalMemoryMb = ParseKbToMb(line);
                else if (line.StartsWith("MemAvailable:"))
                    freeMemoryMb = ParseKbToMb(line);
            }
        }

        double usedMemoryMb = totalMemoryMb - freeMemoryMb;
        double usagePercent = totalMemoryMb > 0 ? (usedMemoryMb / totalMemoryMb) * 100 : 0;

        return (totalMemoryMb, usedMemoryMb, usagePercent);
    }

    // متد کمکی برای خواندن مقادیر لینوکس
    private double ParseKbToMb(string line)
    {
        var parts = line.Split(':', StringSplitOptions.TrimEntries);
        var valueStr = parts[1].Replace("kB", "").Trim();
        if (double.TryParse(valueStr, out double kb))
        {
            return kb / 1024.0; // تبدیل کیلوبایت به مگابایت
        }
        return 0;
    }

    private PerformanceCounter? _cpuCounter;

    public override Task StartAsync(CancellationToken cancellationToken)
    {
        // در زمان استارت شدن سرویس، کانتر را بسازید تا اولین نمونه‌گیری انجام شود
        if (RuntimeInformation.IsOSPlatform(OSPlatform.Windows))
        {
            _cpuCounter = new PerformanceCounter("Processor", "% Processor Time", "_Total");
            _cpuCounter.NextValue(); // فراخوانی اول برای مقداردهی اولیه (مقدار آن مهم نیست)
        }

        return base.StartAsync(cancellationToken);
    }

    private long _prevIdleTime = 0;
    private long _prevTotalTime = 0;

    private double GetCpuUsage()
    {
        if (RuntimeInformation.IsOSPlatform(OSPlatform.Windows))
        {
            return _cpuCounter != null ? Math.Round(_cpuCounter.NextValue(), 2) : 0;
        }
        else if (RuntimeInformation.IsOSPlatform(OSPlatform.Linux))
        {
            return Math.Round(GetLinuxCpuUsage(), 2);
        }

        return 0;
    }

    private double GetLinuxCpuUsage()
    {
        try
        {
            // خواندن خط اول فایل proc/stat/
            string firstLine = File.ReadLines("/proc/stat").First();
            var parts = firstLine.Split(' ', StringSplitOptions.RemoveEmptyEntries);

            // اعداد مربوط به زمان‌های مختلف پردازنده
            long user = long.Parse(parts[1]);
            long nice = long.Parse(parts[2]);
            long system = long.Parse(parts[3]);
            long idle = long.Parse(parts[4]);
            long iowait = long.Parse(parts[5]);
            long irq = long.Parse(parts[6]);
            long softirq = long.Parse(parts[7]);

            long currentIdleTime = idle + iowait;
            long currentTotalTime = user + nice + system + idle + iowait + irq + softirq;

            long idleDelta = currentIdleTime - _prevIdleTime;
            long totalDelta = currentTotalTime - _prevTotalTime;

            // ذخیره مقادیر فعلی برای بازه بعدی (۳۰ ثانیه بعد)
            _prevIdleTime = currentIdleTime;
            _prevTotalTime = currentTotalTime;

            if (totalDelta == 0) return 0;

            double cpuUsage = (1.0 - ((double)idleDelta / totalDelta)) * 100.0;
            return cpuUsage;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to read Linux CPU metrics from /proc/stat");
            return 0;
        }
    }
    private MetricPayload CollectAllMetrics()
    {
        var ramInfo = GetRamMetrics();

        var payload = new MetricPayload
        {
            MachineName = Environment.MachineName,
            Timestamp = DateTime.UtcNow,
            CpuUsagePercent = GetCpuUsage(),
            RamTotalMb = ramInfo.TotalMb,
            RamUsedMb = ramInfo.UsedMb,
            RamUsagePercent = ramInfo.UsagePercent,
            Disks = GetDiskMetrics()
        };

        return payload;
    }
    private async Task SendMetricsToApiAsync(MetricPayload payload, CancellationToken cancellationToken)
    {
        try
        {
            var client = _httpClientFactory.CreateClient("MonitoringApi");

            // ارسال JSON به Endpoint
            var response = await client.PostAsJsonAsync("metrics", payload, cancellationToken);

            if (response.IsSuccessStatusCode)
            {
                _logger.LogInformation("Successfully sent metrics to NestJS Backend at: {time}", DateTimeOffset.Now);
            }
            else
            {
                _logger.LogWarning("Failed to send metrics. Status Code: {statusCode}", response.StatusCode);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while sending metrics to NestJS API.");
        }
    }
}