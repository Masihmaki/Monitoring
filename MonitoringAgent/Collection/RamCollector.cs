namespace MonitoringAgent.Collection;

using System.Runtime.InteropServices;

public class RamCollector
{
    public (double TotalMb, double UsedMb, double UsagePercent) Collect()
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
