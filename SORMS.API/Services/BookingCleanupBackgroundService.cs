using Microsoft.EntityFrameworkCore;
using SORMS.API.Data;

namespace SORMS.API.Services
{
    public class BookingCleanupBackgroundService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<BookingCleanupBackgroundService> _logger;

        public BookingCleanupBackgroundService(
            IServiceProvider serviceProvider,
            ILogger<BookingCleanupBackgroundService> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Booking cleanup background service is starting.");

            using var timer = new PeriodicTimer(TimeSpan.FromMinutes(1));

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await CleanupExpiredHoldsAsync(stoppingToken);
                }
                catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
                {
                    break;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error occurred while running booking cleanup job.");
                }

                try
                {
                    await timer.WaitForNextTickAsync(stoppingToken);
                }
                catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
                {
                    break;
                }
            }

            _logger.LogInformation("Booking cleanup background service is stopping.");
        }

        private async Task CleanupExpiredHoldsAsync(CancellationToken cancellationToken)
        {
            using var scope = _serviceProvider.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<SormsDbContext>();
            var now = DateTime.UtcNow;

            var expiredRooms = await dbContext.Rooms
                .Where(r => r.Status == "OnHold" && r.HoldExpiresAt.HasValue && r.HoldExpiresAt.Value <= now)
                .ToListAsync(cancellationToken);

            if (expiredRooms.Count == 0)
            {
                return;
            }

            var releasedCount = 0;

            foreach (var room in expiredRooms)
            {
                try
                {
                    var holdExpiresAt = room.HoldExpiresAt;

                    room.Status = "Available";
                    room.HoldExpiresAt = null;

                    if (holdExpiresAt.HasValue)
                    {
                        var holdStartedAt = holdExpiresAt.Value.AddMinutes(-6);
                        var pendingInvoice = await dbContext.Invoices
                            .Where(i => i.RoomId == room.Id
                                        && i.Status == "Pending"
                                        && i.CreatedAt >= holdStartedAt
                                        && i.CreatedAt <= holdExpiresAt.Value)
                            .OrderByDescending(i => i.CreatedAt)
                            .FirstOrDefaultAsync(cancellationToken);

                        if (pendingInvoice != null)
                        {
                            pendingInvoice.Status = "Cancelled";
                        }
                    }

                    releasedCount++;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to cleanup expired hold for room {RoomId}", room.Id);
                }
            }

            await dbContext.SaveChangesAsync(cancellationToken);
            _logger.LogInformation("Booking cleanup released {Count} expired hold(s).", releasedCount);
        }
    }
}
