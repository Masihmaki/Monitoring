using MonitoringAgent;
using MonitoringAgent.Collection;
using MonitoringAgent.Transport;

var builder = Host.CreateApplicationBuilder(args);

var apiBaseUrl = builder.Configuration["MonitoringApi:BaseUrl"]
    ?? throw new InvalidOperationException("MonitoringApi:BaseUrl is required in configuration.");
var timeoutSeconds = builder.Configuration.GetValue("MonitoringApi:TimeoutSeconds", 10);
var apiKey = builder.Configuration["MonitoringApi:ApiKey"];

builder.Services.AddHttpClient("MonitoringApi", client =>
{
    client.BaseAddress = new Uri(apiBaseUrl);
    client.Timeout = TimeSpan.FromSeconds(timeoutSeconds);
    if (!string.IsNullOrWhiteSpace(apiKey))
    {
        client.DefaultRequestHeaders.TryAddWithoutValidation("X-Api-Key", apiKey);
    }
});

builder.Services.AddSingleton<CpuCollector>();
builder.Services.AddSingleton<RamCollector>();
builder.Services.AddSingleton<DiskCollector>();
builder.Services.AddSingleton<SystemMetricsCollector>();
builder.Services.AddSingleton<MetricsApiClient>();
builder.Services.AddHostedService<Worker>();

builder.Build().Run();
