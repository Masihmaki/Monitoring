namespace MonitoringAgent;

using MonitoringAgent.Collection;
using MonitoringAgent.Transport;

public class Worker : BackgroundService
{
    private readonly ILogger<Worker> _logger;
    private readonly SystemMetricsCollector _collector;
    private readonly MetricsApiClient _apiClient;
    private readonly CpuCollector _cpuCollector;
    private readonly int _pollingIntervalInSeconds;

    public Worker(
        ILogger<Worker> logger,
        SystemMetricsCollector collector,
        MetricsApiClient apiClient,
        CpuCollector cpuCollector,
        IConfiguration configuration)
    {
        _logger = logger;
        _collector = collector;
        _apiClient = apiClient;
        _cpuCollector = cpuCollector;
        _pollingIntervalInSeconds = configuration.GetValue("MonitoringApi:PollingIntervalSeconds", 30);
    }

    public override Task StartAsync(CancellationToken cancellationToken)
    {
        _cpuCollector.Initialize();
        return base.StartAsync(cancellationToken);
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                var metrics = _collector.Collect();
                await _apiClient.SendAsync(metrics, stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to collect or send metrics.");
            }

            await Task.Delay(TimeSpan.FromSeconds(_pollingIntervalInSeconds), stoppingToken);
        }
    }
}
