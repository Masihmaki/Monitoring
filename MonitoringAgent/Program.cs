using MonitoringAgent;

var builder = Host.CreateApplicationBuilder(args);

var apiBaseUrl = builder.Configuration["MonitoringApi:BaseUrl"]
    ?? throw new InvalidOperationException("MonitoringApi:BaseUrl is required in configuration.");
var timeoutSeconds = builder.Configuration.GetValue("MonitoringApi:TimeoutSeconds", 10);

builder.Services.AddHttpClient("MonitoringApi", client =>
{
    client.BaseAddress = new Uri(apiBaseUrl);
    client.Timeout = TimeSpan.FromSeconds(timeoutSeconds);
});

builder.Services.AddHostedService<Worker>();

builder.Build().Run();
