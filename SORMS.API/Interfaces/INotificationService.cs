using SORMS.API.DTOs;

namespace SORMS.API.Interfaces
{
    public interface INotificationService
    {
        // Lấy thông báo cho resident
        Task<IEnumerable<NotificationDto>> GetNotificationsForResidentAsync(int residentId);
        
        // Lấy thông báo cho staff
        Task<IEnumerable<NotificationDto>> GetNotificationsForStaffAsync(int staffId);
        
        // Tạo notification cho 1 resident cụ thể (Individual)
        Task<NotificationDto> CreateNotificationAsync(NotificationDto notificationDto);
        
        // Admin tạo broadcast notification cho All/Resident/Staff
        Task<int> CreateBroadcastNotificationAsync(CreateBroadcastNotificationDto dto);
        
        // Đánh dấu đã đọc
        Task<bool> MarkAsReadAsync(int notificationId);

        // Lấy tất cả thông báo (cho Admin/Staff xem lịch sử)
        Task<IEnumerable<NotificationDto>> GetAllNotificationsAsync();
    }

}
