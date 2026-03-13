using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SORMS.API.DTOs;
using SORMS.API.Interfaces;
using System.Security.Claims;

namespace SORMS.API.Controllers
{
    [Authorize(Roles = "Admin,Staff,Resident")]
    [ApiController]
    [Route("api/[controller]")]
    public class NotificationController : ControllerBase
    {
        private readonly INotificationService _notificationService;

        public NotificationController(INotificationService notificationService)
        {
            _notificationService = notificationService;
        }

        /// <summary>
        /// Admin tạo broadcast notification cho All/Resident/Staff
        /// </summary>
        [Authorize(Roles = "Admin")]
        [HttpPost("broadcast")]
        public async Task<IActionResult> CreateBroadcast([FromBody] CreateBroadcastNotificationDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var notificationId = await _notificationService.CreateBroadcastNotificationAsync(dto);
            return Ok(new { 
                message = "Broadcast notification đã được tạo thành công", 
                notificationId = notificationId 
            });
        }

        /// <summary>
        /// Staff/Admin tạo individual notification cho 1 resident cụ thể
        /// </summary>
        [Authorize(Roles = "Admin,Staff")]
        [HttpPost("individual")]
        public async Task<IActionResult> CreateIndividual([FromBody] NotificationDto notificationDto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            // Chỉ cho phép gửi cho resident (không cho staff gửi cho staff khác)
            if (notificationDto.ResidentId == null)
                return BadRequest("ResidentId là bắt buộc khi tạo individual notification");

            var created = await _notificationService.CreateNotificationAsync(notificationDto);
            return Ok(new { 
                message = "Notification đã được gửi thành công", 
                notification = created 
            });
        }

        /// <summary>
        /// Lấy danh sách thông báo của resident hiện tại (từ JWT token)
        /// </summary>
        [Authorize(Roles = "Resident")]
        [HttpGet("my-notifications")]
        public async Task<IActionResult> GetMyNotifications()
        {
            var residentIdClaim = User.FindFirst("ResidentId")?.Value;
            if (string.IsNullOrEmpty(residentIdClaim) || !int.TryParse(residentIdClaim, out int residentId))
                return BadRequest("Không tìm thấy ResidentId trong token");

            var notifications = await _notificationService.GetNotificationsForResidentAsync(residentId);
            return Ok(notifications);
        }

        /// <summary>
        /// Lấy danh sách thông báo của staff hiện tại (từ JWT token)
        /// </summary>
        [Authorize(Roles = "Staff")]
        [HttpGet("staff/my-notifications")]
        public async Task<IActionResult> GetStaffNotifications()
        {
            var staffIdClaim = User.FindFirst("StaffId")?.Value;
            if (string.IsNullOrEmpty(staffIdClaim) || !int.TryParse(staffIdClaim, out int staffId))
                return BadRequest("Không tìm thấy StaffId trong token");

            var notifications = await _notificationService.GetNotificationsForStaffAsync(staffId);
            return Ok(notifications);
        }

        /// <summary>
        /// Lấy danh sách thông báo của resident (by ID - Admin/Staff dùng)
        /// </summary>
        [Authorize(Roles = "Admin,Staff")]
        [HttpGet("resident/{residentId}")]
        public async Task<IActionResult> GetByResident(int residentId)
        {
            var notifications = await _notificationService.GetNotificationsForResidentAsync(residentId);
            return Ok(notifications);
        }

        /// <summary>
        /// Đánh dấu thông báo là đã đọc
        /// </summary>
        [HttpPut("{notificationId}/read")]
        public async Task<IActionResult> MarkAsRead(int notificationId)
        {
            var success = await _notificationService.MarkAsReadAsync(notificationId);
            if (!success)
                return BadRequest("Không thể đánh dấu đã đọc.");

            return NoContent();
        }

        /// <summary>
        /// Admin/Staff lấy danh sách tất cả thông báo đã tạo (broadcast + individual)
        /// </summary>
        [Authorize(Roles = "Admin,Staff")]
        [HttpGet("sent-history")]
        public async Task<IActionResult> GetSentHistory()
        {
            var notifications = await _notificationService.GetAllNotificationsAsync();
            return Ok(notifications);
        }
    }
}
