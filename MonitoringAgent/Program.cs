using MonitoringAgent;

var builder = Host.CreateApplicationBuilder(args);

// ثبت HttpClient برای ارتباط با NestJS
builder.Services.AddHttpClient("MonitoringApi", client =>
{
    client.BaseAddress = new Uri("http://localhost:3000/");
    client.Timeout = TimeSpan.FromSeconds(10);
});

builder.Services.AddHostedService<Worker>();

var host = builder.Build();
host.Run();