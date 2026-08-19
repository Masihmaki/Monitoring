namespace MonitoringAgent.Transport;

using System.Net.Http.Json;
using MonitoringAgent.Models;

public class MetricsApiClient
{
    private const string PlaceholderKey = "PASTE_FROM_DASHBOARD";
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<MetricsApiClient> _logger;
    private readonly string? _apiKey;

    public MetricsApiClient(
        IHttpClientFactory httpClientFactory,
        ILogger<MetricsApiClient> logger,
        IConfiguration configuration)
    {
        _httpClientFactory = httpClientFactory;
        _logger = logger;
        _apiKey = configuration["MonitoringApi:ApiKey"];
    }

    public async Task SendAsync(MetricPayload payload, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(_apiKey) || _apiKey == PlaceholderKey)
        {
            _logger.LogError("MonitoringApi:ApiKey is missing. Copy the agent key from the dashboard into appsettings.json.");
            return;
        }

        try
        {
            var client = _httpClientFactory.CreateClient("MonitoringApi");
            var response = await client.PostAsJsonAsync("metrics", payload, cancellationToken);

            if (response.IsSuccessStatusCode)
            {
                _logger.LogInformation("Successfully sent metrics at {time}", DateTimeOffset.Now);
            }
            else
            {
                _logger.LogWarning("Failed to send metrics. Status Code: {statusCode}", response.StatusCode);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while sending metrics to the API.");
        }
    }
}
