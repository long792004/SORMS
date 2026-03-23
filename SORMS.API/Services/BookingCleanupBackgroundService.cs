using Microsoft.EntityFrameworkCore;
using SORMS.API.Data;
using SORMS.API.Interfaces;
using SORMS.API.DTOs;

namespace SORMS.API.Services
{
    public class BookingManagementBackgroundService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<BookingManagementBackgroundService> _logger;

        public BookingManagementBackgroundService(
            IServiceProvider serviceProvider,
            ILogger<BookingManagementBackgroundService> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Booking management background service is starting.");

            using var timer = new PeriodicTimer(TimeSpan.FromMinutes(1));

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await CleanupExpiredHoldsAsync(stoppingToken);
                    await AutoCheckOutExpiredStaysAsync(stoppingToken);
                    await AutoReleaseMaintenanceRoomsAsync(stoppingToken);
                    await SendCheckInRemindersAsync(stoppingToken);
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

            _logger.LogInformation("Booking management background service is stopping.");
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

        private async Task AutoCheckOutExpiredStaysAsync(CancellationToken cancellationToken)
        {
            using var scope = _serviceProvider.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<SormsDbContext>();
            var notificationService = scope.ServiceProvider.GetRequiredService<INotificationService>();
            var now = DateTime.UtcNow;

            // Tìm các record CheckedIn hoặc PendingCheckOut đã quá ngày ExpectedCheckOutDate
            var expiredStays = await dbContext.CheckInRecords
                .Include(r => r.Room)
                .Include(r => r.Resident)
                .Where(r => (r.Status == "CheckedIn" || r.Status == "PendingCheckOut") 
                         && r.ExpectedCheckOutDate <= now)
                .ToListAsync(cancellationToken);

            if (expiredStays.Count == 0) return;

            var checkoutCount = 0;
            foreach (var record in expiredStays)
            {
                try
                {
                    // Cập nhật trạng thái record
                    record.Status = "CheckedOut";
                    record.CheckOutTime = now;
                    
                    // Cập nhật trạng thái phòng
                    if (record.Room != null)
                    {
                        record.Room.Status = "Available";
                        record.Room.CurrentResident = null;
                        record.Room.HoldExpiresAt = null;
                    }

                    // Cập nhật thông tin Resident
                    if (record.Resident != null)
                    {
                        record.Resident.RoomId = null;
                        record.Resident.CheckOutDate = now;

                        // Gửi thông báo
                        await notificationService.CreateNotificationAsync(new NotificationDto
                        {
                            ResidentId = record.Resident.Id,
                            Message = $"Checkout tự động thành công cho phòng {record.Room?.RoomNumber}. Hãy feedback trải nghiệm của bạn. CHECKIN_ID:{record.Id}",
                            CreatedAt = now,
                            IsRead = false
                        });
                    }

                    checkoutCount++;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to auto-checkout record {RecordId}", record.Id);
                }
            }

            if (checkoutCount > 0)
            {
                _logger.LogInformation("Auto-checkout processed {Count} expired stay(s).", checkoutCount);
            }
        }

        private async Task AutoReleaseMaintenanceRoomsAsync(CancellationToken cancellationToken)
        {
            using var scope = _serviceProvider.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<SormsDbContext>();
            var now = DateTime.UtcNow;

            // Tìm các phòng đang bảo trì và đã quá ngày kết thúc
            var finishedMaintenance = await dbContext.Rooms
                .Where(r => r.Status == "Maintenance" && r.MaintenanceEndDate.HasValue && r.MaintenanceEndDate.Value <= now)
                .ToListAsync(cancellationToken);

            if (finishedMaintenance.Count == 0) return;

            var releasedCount = 0;
            foreach (var room in finishedMaintenance)
            {
                try
                {
                    room.Status = "Available";
                    room.MaintenanceEndDate = null;
                    releasedCount++;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to release maintenance for room {RoomId}", room.Id);
                }
            }

            await dbContext.SaveChangesAsync(cancellationToken);
            if (releasedCount > 0)
            {
                _logger.LogInformation("Auto-released {Count} room(s) from maintenance.", releasedCount);
            }
        }

        private async Task SendCheckInRemindersAsync(CancellationToken cancellationToken)
        {
            using var scope = _serviceProvider.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<SormsDbContext>();
            var notificationService = scope.ServiceProvider.GetRequiredService<INotificationService>();
            var now = DateTime.UtcNow;

            var in24h = now.AddHours(24);
            var in2h = now.AddHours(2);

            var upcomingReservations = await dbContext.Reservations
                .Include(r => r.Room)
                .Where(r => r.Status == "Confirmed" 
                         && r.CheckInDate > now
                         && (!r.Reminder24hSent || !r.Reminder2hSent))
                .ToListAsync(cancellationToken);

            int sentCount = 0;
            foreach (var res in upcomingReservations)
            {
                try
                {
                    if (!res.Reminder2hSent && res.CheckInDate <= in2h)
                    {
                        res.Reminder2hSent = true;
                        res.Reminder24hSent = true; // In case 24h passed
                        await notificationService.CreateNotificationAsync(new NotificationDto
                        {
                            ResidentId = res.ResidentId,
                            Message = $"⏰ Nhắc nhở: Chỉ còn chưa tới 2 giờ nữa là tới giờ check-in phòng {res.Room?.RoomNumber}. Bạn đã sẵn sàng chưa?",
                            CreatedAt = now,
                            IsRead = false
                        });
                        sentCount++;
                    }
                    else if (!res.Reminder24hSent && res.CheckInDate <= in24h && res.CheckInDate > in2h)
                    {
                        res.Reminder24hSent = true;
                        await notificationService.CreateNotificationAsync(new NotificationDto
                        {
                            ResidentId = res.ResidentId,
                            Message = $"⏰ Nhắc nhở: Ngày mai {res.CheckInDate:dd/MM/yyyy HH:mm} bạn có lịch check-in phòng {res.Room?.RoomNumber}.",
                            CreatedAt = now,
                            IsRead = false
                        });
                        sentCount++;
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to send check-in reminder for reservation {ResId}", res.Id);
                }
            }

            if (sentCount > 0)
            {
                await dbContext.SaveChangesAsync(cancellationToken);
                _logger.LogInformation("Sent {Count} check-in reminder(s).", sentCount);
            }
        }
    }
}
