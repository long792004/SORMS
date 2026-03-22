namespace SORMS.API.Services
{
    using Microsoft.EntityFrameworkCore;
    using SORMS.API.Data;
    using SORMS.API.DTOs;
    using SORMS.API.Interfaces;
    using SORMS.API.Models;

    public class NotificationService : INotificationService
    {
        private readonly SormsDbContext _context;

        public NotificationService(SormsDbContext context)
        {
            _context = context;
        }

        // Lấy thông báo cho resident (bao gồm cả broadcast và individual)
        public async Task<IEnumerable<NotificationDto>> GetNotificationsForResidentAsync(int residentId)
        {
            var notifications = await _context.Notifications
                .Where(n => 
                    // Individual notification cho resident này
                    (n.Type == "Individual" && n.ResidentId == residentId) ||
                    // Broadcast cho tất cả
                    (n.Type == "Broadcast" && n.TargetRole == "All") ||
                    // Broadcast cho resident
                    (n.Type == "Broadcast" && n.TargetRole == "Resident")
                )
                .OrderByDescending(n => n.CreatedAt)
                .ToListAsync();

            return notifications.Select(n => new NotificationDto
            {
                Id = n.Id,
                Message = n.Message,
                CreatedAt = n.CreatedAt,
                IsRead = n.IsRead,
                Type = n.Type,
                TargetRole = n.TargetRole,
                ResidentId = n.ResidentId,
                StaffId = n.StaffId
            });
        }

        // Lấy thông báo cho staff (bao gồm cả broadcast)
        public async Task<IEnumerable<NotificationDto>> GetNotificationsForStaffAsync(int staffId)
        {
            var notifications = await _context.Notifications
                .Where(n => 
                    // Individual notification cho staff này
                    (n.Type == "Individual" && n.StaffId == staffId) ||
                    // Broadcast cho tất cả
                    (n.Type == "Broadcast" && n.TargetRole == "All") ||
                    // Broadcast cho staff
                    (n.Type == "Broadcast" && n.TargetRole == "Staff")
                )
                .OrderByDescending(n => n.CreatedAt)
                .ToListAsync();

            return notifications.Select(n => new NotificationDto
            {
                Id = n.Id,
                Message = n.Message,
                CreatedAt = n.CreatedAt,
                IsRead = n.IsRead,
                Type = n.Type,
                TargetRole = n.TargetRole,
                ResidentId = n.ResidentId,
                StaffId = n.StaffId
            });
        }

        // Tạo notification Individual (cho 1 resident hoặc 1 staff cụ thể)
        public async Task<NotificationDto> CreateNotificationAsync(NotificationDto notificationDto)
        {
            var message = notificationDto.Message?.Trim();
            if (string.IsNullOrWhiteSpace(message))
            {
                throw new ArgumentException("Nội dung thông báo không được để trống");
            }

            if (notificationDto.ResidentId.HasValue)
            {
                var residentExists = await _context.Residents.AnyAsync(r => r.Id == notificationDto.ResidentId.Value);
                if (!residentExists)
                {
                    throw new InvalidOperationException($"Không tìm thấy resident với ID {notificationDto.ResidentId.Value}");
                }
            }

            if (notificationDto.StaffId.HasValue)
            {
                var staffExists = await _context.Staffs.AnyAsync(s => s.Id == notificationDto.StaffId.Value);
                if (!staffExists)
                {
                    throw new InvalidOperationException($"Không tìm thấy staff với ID {notificationDto.StaffId.Value}");
                }
            }

            if (!notificationDto.ResidentId.HasValue && !notificationDto.StaffId.HasValue)
            {
                throw new ArgumentException("Phải chỉ định người nhận thông báo");
            }

            var notification = new Notification
            {
                Message = message,
                CreatedAt = DateTime.UtcNow,
                IsRead = false,
                Type = "Individual",
                ResidentId = notificationDto.ResidentId,
                StaffId = notificationDto.StaffId
            };

            _context.Notifications.Add(notification);
            await _context.SaveChangesAsync();

            notificationDto.Id = notification.Id;
            notificationDto.Message = notification.Message;
            notificationDto.IsRead = false;
            notificationDto.CreatedAt = notification.CreatedAt;
            notificationDto.Type = "Individual";
            
            return notificationDto;
        }

        // Admin tạo broadcast notification
        public async Task<int> CreateBroadcastNotificationAsync(CreateBroadcastNotificationDto dto)
        {
            // Tạo 1 notification duy nhất với Type = Broadcast
            var notification = new Notification
            {
                Message = dto.Message,
                CreatedAt = DateTime.UtcNow,
                IsRead = false,
                Type = "Broadcast",
                TargetRole = dto.TargetRole // "All", "Resident", "Staff"
            };

            _context.Notifications.Add(notification);
            await _context.SaveChangesAsync();

            return notification.Id;
        }

        public async Task<bool> MarkAsReadAsync(int notificationId)
        {
            var notification = await _context.Notifications.FindAsync(notificationId);
            if (notification == null)
                return false;

            // Không cho phép đánh dấu đã đọc với Broadcast notification
            // vì một record Broadcast được dùng chung cho nhiều user
            if (notification.Type == "Broadcast")
                return false;

            // Nếu đã đọc rồi thì vẫn trả về true (không phải lỗi)
            if (notification.IsRead)
                return true;

            notification.IsRead = true;
            await _context.SaveChangesAsync();
            return true;
        }

        // Lấy tất cả thông báo (cho Admin/Staff xem lịch sử đã gửi)
        public async Task<IEnumerable<NotificationDto>> GetAllNotificationsAsync()
        {
            var notifications = await _context.Notifications
                .OrderByDescending(n => n.CreatedAt)
                .ToListAsync();

            return notifications.Select(n => new NotificationDto
            {
                Id = n.Id,
                Message = n.Message,
                CreatedAt = n.CreatedAt,
                IsRead = n.IsRead,
                Type = n.Type,
                TargetRole = n.TargetRole,
                ResidentId = n.ResidentId,
                StaffId = n.StaffId
            });
        }
    }

}
