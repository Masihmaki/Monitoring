namespace MonitoringAgent.Collection;

using MonitoringAgent.Models;

public class SystemMetricsCollector
{
    private readonly CpuCollector _cpuCollector;
    private readonly RamCollector _ramCollector;
    private readonly DiskCollector _diskCollector;
    private readonly string _machineName;

    public SystemMetricsCollector(
        CpuCollector cpuCollector,
        RamCollector ramCollector,
        DiskCollector diskCollector,
        IConfiguration configuration)
    {
        _cpuCollector = cpuCollector;
        _ramCollector = ramCollector;
        _diskCollector = diskCollector;
        _machineName = configuration["MonitoringApi:MachineName"]?.Trim() is { Length: > 0 } name
            ? name
            : Environment.MachineName;
    }

    public MetricPayload Collect()
    {
        var ram = _ramCollector.Collect();

        return new MetricPayload
        {
            MachineName = _machineName,
            Timestamp = DateTime.UtcNow,
            CpuUsagePercent = _cpuCollector.Collect(),
            RamTotalMb = ram.TotalMb,
            RamUsedMb = ram.UsedMb,
            RamUsagePercent = ram.UsagePercent,
            Disks = _diskCollector.Collect()
        };
    }
}
