namespace MonitoringAgent.Collection;

using MonitoringAgent.Models;

public class DiskCollector
{
    public List<DiskMetric> Collect()
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
}
