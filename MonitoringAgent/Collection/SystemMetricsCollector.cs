namespace MonitoringAgent.Collection;

using MonitoringAgent.Models;

public class SystemMetricsCollector
{
    private readonly CpuCollector _cpuCollector;
    private readonly RamCollector _ramCollector;
    private readonly DiskCollector _diskCollector;

    public SystemMetricsCollector(
        CpuCollector cpuCollector,
        RamCollector ramCollector,
        DiskCollector diskCollector)
    {
        _cpuCollector = cpuCollector;
        _ramCollector = ramCollector;
        _diskCollector = diskCollector;
    }

    public MetricPayload Collect()
    {
        var ram = _ramCollector.Collect();

        return new MetricPayload
        {
            MachineName = Environment.MachineName,
            Timestamp = DateTime.UtcNow,
            CpuUsagePercent = _cpuCollector.Collect(),
            RamTotalMb = ram.TotalMb,
            RamUsedMb = ram.UsedMb,
            RamUsagePercent = ram.UsagePercent,
            Disks = _diskCollector.Collect()
        };
    }
}
