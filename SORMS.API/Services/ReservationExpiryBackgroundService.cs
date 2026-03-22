using SORMS.API.Interfaces;

namespace SORMS.API.Services
{
    public class ReservationExpiryBackgroundService : BackgroundService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<ReservationExpiryBackgroundService> _logger;

        public ReservationExpiryBackgroundService(
            IServiceScopeFactory scopeFactory,
            ILogger<ReservationExpiryBackgroundService> logger)
        {
            _scopeFactory = scopeFactory;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    using var scope = _scopeFactory.CreateScope();
                    var reservationService = scope.ServiceProvider.GetRequiredService<IReservationService>();
                    var expiredCount = await reservationService.ExpireHeldReservationsAsync();
                    if (expiredCount > 0)
                    {
                        _logger.LogInformation("Expired {count} held reservations.", expiredCount);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error while expiring held reservations.");
                }

                await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);
            }
        }
    }
}
