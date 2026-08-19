namespace MonitoringAgent.Collection;

using System.Diagnostics;
using System.Runtime.InteropServices;

public class CpuCollector : IDisposable
{
    private readonly ILogger<CpuCollector> _logger;
    private PerformanceCounter? _cpuCounter;
    private long _prevIdleTime;
    private long _prevTotalTime;

    public CpuCollector(ILogger<CpuCollector> logger)
    {
        _logger = logger;
    }

    public void Initialize()
    {
        if (!RuntimeInformation.IsOSPlatform(OSPlatform.Windows))
        {
            return;
        }

        _cpuCounter = new PerformanceCounter("Processor", "% Processor Time", "_Total");
        _cpuCounter.NextValue();
    }

    public double Collect()
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

    public void Dispose()
    {
        _cpuCounter?.Dispose();
    }
}
