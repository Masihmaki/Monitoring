namespace MonitoringAgent;

public class MetricPayload
{
    public string MachineName { get; set; } = Environment.MachineName;
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    public double CpuUsagePercent { get; set; }
    public double RamUsagePercent { get; set; }
    public double RamTotalMb { get; set; }
    public double RamUsedMb { get; set; }
    public List<DiskMetric> Disks { get; set; } = new();
}

public class DiskMetric
{
    public string DriveName { get; set; } = string.Empty;
    public double TotalGb { get; set; }
    public double FreeGb { get; set; }
    public double UsedPercent { get; set; }
}