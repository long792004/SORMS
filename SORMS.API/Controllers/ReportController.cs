using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SORMS.API.DTOs;
using SORMS.API.Interfaces;
using System.Security.Claims;

namespace SORMS.API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class ReportController : ControllerBase
    {
        private readonly IReportService _reportService;

        public ReportController(IReportService reportService)
        {
            _reportService = reportService;
        }

        // ==================== STAFF CRUD OPERATIONS ====================

        /// <summary>
        /// Staff: Tạo báo cáo mới
        /// </summary>
        [HttpPost]
        [Authorize(Roles = "Staff")]
        public async Task<IActionResult> CreateReport([FromBody] CreateReportDto dto)
        {
            var username = User.FindFirst("username")?.Value;
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            
            if (string.IsNullOrEmpty(username) || string.IsNullOrEmpty(userId))
            {
                return BadRequest(new { message = "Không thể xác định thông tin người dùng" });
            }
            
            var report = await _reportService.CreateReportAsync(dto, username, int.Parse(userId));
            return Ok(report);
        }

        /// <summary>
        /// Staff/Admin: Lấy tất cả báo cáo
        /// </summary>
        [HttpGet]
        [Authorize(Roles = "Admin,Staff")]
        public async Task<IActionResult> GetAllReports()
        {
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            IEnumerable<ReportDto> reports;

            if (userRole == "Admin")
            {
                // Admin xem tất cả báo cáo
                reports = await _reportService.GetAllReportsAsync();
            }
            else
            {
                // Staff chỉ xem báo cáo của mình
                reports = await _reportService.GetReportsByStaffIdAsync(int.Parse(userId));
            }

            return Ok(reports);
        }

        /// <summary>
        /// Staff/Admin: Lấy báo cáo theo ID
        /// </summary>
        [HttpGet("{id}")]
        [Authorize(Roles = "Admin,Staff")]
        public async Task<IActionResult> GetReportById(int id)
        {
            var report = await _reportService.GetReportByIdAsync(id);
            if (report == null)
                return NotFound(new { message = "Không tìm thấy báo cáo" });

            // Check permission: Staff chỉ xem báo cáo của mình
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (userRole == "Staff" && report.StaffId != int.Parse(userId))
            {
                return Forbid();
            }

            return Ok(report);
        }

        /// <summary>
        /// Staff: Cập nhật báo cáo
        /// </summary>
        [HttpPut("{id}")]
        [Authorize(Roles = "Staff")]
        public async Task<IActionResult> UpdateReport(int id, [FromBody] UpdateReportDto dto)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var success = await _reportService.UpdateReportAsync(id, dto, int.Parse(userId));

            if (!success)
                return BadRequest(new { message = "Không thể cập nhật báo cáo. Có thể báo cáo không tồn tại hoặc bạn không có quyền." });

            return Ok(new { message = "Cập nhật báo cáo thành công" });
        }

        /// <summary>
        /// Staff: Xóa báo cáo
        /// </summary>
        [HttpDelete("{id}")]
        [Authorize(Roles = "Staff")]
        public async Task<IActionResult> DeleteReport(int id)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var success = await _reportService.DeleteReportAsync(id, int.Parse(userId));

            if (!success)
                return BadRequest(new { message = "Không thể xóa báo cáo. Có thể báo cáo không tồn tại hoặc bạn không có quyền." });

            return Ok(new { message = "Xóa báo cáo thành công" });
        }

        // ==================== ADMIN REVIEW OPERATIONS ====================

        /// <summary>
        /// Admin: Review báo cáo (Approved/Rejected + Feedback)
        /// </summary>
        [HttpPost("{id}/review")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> ReviewReport(int id, [FromBody] ReviewReportDto dto)
        {
            var adminName = User.FindFirst("username")?.Value;
            
            if (string.IsNullOrEmpty(adminName))
            {
                return BadRequest(new { message = "Không thể xác định thông tin admin" });
            }
            
            var success = await _reportService.ReviewReportAsync(id, dto, adminName);

            if (!success)
                return BadRequest(new { message = "Không thể review báo cáo" });

            return Ok(new { message = "Review báo cáo thành công" });
        }

        /// <summary>
        /// Admin: Lấy danh sách báo cáo chờ duyệt
        /// </summary>
        [HttpGet("pending")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetPendingReports()
        {
            var reports = await _reportService.GetReportsByStatusAsync("Pending");
            return Ok(reports);
        }

        // ==================== AUTO GENERATED REPORTS ====================

        /// <summary>
        /// Tạo báo cáo tỷ lệ phòng đã sử dụng
        /// </summary>
        [HttpPost("occupancy")]
        [Authorize(Roles = "Admin,Staff")]
        public async Task<IActionResult> GenerateOccupancyReport()
        {
            var report = await _reportService.GenerateOccupancyReportAsync();
            return Ok(report);
        }

        /// <summary>
        /// Tạo báo cáo sử dụng dịch vụ
        /// </summary>
        [HttpPost("service-usage")]
        [Authorize(Roles = "Admin,Staff")]
        public async Task<IActionResult> GenerateServiceUsageReport()
        {
            var report = await _reportService.GenerateServiceUsageReportAsync();
            return Ok(report);
        }

        /// <summary>
        /// Tạo báo cáo doanh thu đã thu
        /// </summary>
        [HttpPost("revenue")]
        [Authorize(Roles = "Admin,Staff")]
        public async Task<IActionResult> GenerateRevenueReport()
        {
            var report = await _reportService.GenerateRevenueReportAsync();
            return Ok(report);
        }
    }
}
