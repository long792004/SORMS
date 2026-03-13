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
    public class ServiceRequestController : ControllerBase
    {
        private readonly IServiceRequestService _serviceRequestService;
        private readonly IResidentService _residentService;

        public ServiceRequestController(IServiceRequestService serviceRequestService, IResidentService residentService)
        {
            _serviceRequestService = serviceRequestService;
            _residentService = residentService;
        }

        // ==================== RESIDENT OPERATIONS ====================

        /// <summary>
        /// Resident: Tạo yêu cầu dịch vụ mới
        /// </summary>
        [HttpPost]
        [Authorize(Roles = "Resident")]
        public async Task<IActionResult> CreateRequest([FromBody] CreateServiceRequestDto dto)
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
                {
                    return BadRequest(new { message = "Không thể xác định thông tin người dùng" });
                }

                // Get Resident from UserId
                var resident = await _residentService.GetResidentByUserIdAsync(userId);
                if (resident == null)
                {
                    return NotFound(new { message = "Không tìm thấy thông tin cư dân" });
                }
                
                var request = await _serviceRequestService.CreateRequestAsync(dto, resident.Id);
                return Ok(request);
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        /// <summary>
        /// Resident: Lấy danh sách yêu cầu của mình
        /// </summary>
        [HttpGet("my-requests")]
        [Authorize(Roles = "Resident")]
        public async Task<IActionResult> GetMyRequests()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
            {
                return BadRequest(new { message = "Không thể xác định thông tin người dùng" });
            }

            var resident = await _residentService.GetResidentByUserIdAsync(userId);
            if (resident == null)
            {
                return NotFound(new { message = "Không tìm thấy thông tin cư dân" });
            }

            var requests = await _serviceRequestService.GetRequestsByResidentIdAsync(resident.Id);
            return Ok(requests);
        }

        /// <summary>
        /// Resident: Cập nhật yêu cầu
        /// </summary>
        [HttpPut("{id}")]
        [Authorize(Roles = "Resident")]
        public async Task<IActionResult> UpdateRequest(int id, [FromBody] UpdateServiceRequestDto dto)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
            {
                return BadRequest(new { message = "Không thể xác định thông tin người dùng" });
            }

            var resident = await _residentService.GetResidentByUserIdAsync(userId);
            if (resident == null)
            {
                return NotFound(new { message = "Không tìm thấy thông tin cư dân" });
            }

            var success = await _serviceRequestService.UpdateRequestAsync(id, dto, resident.Id);

            if (!success)
                return BadRequest(new { message = "Không thể cập nhật yêu cầu. Có thể yêu cầu không tồn tại hoặc bạn không có quyền." });

            return Ok(new { message = "Cập nhật yêu cầu thành công" });
        }

        /// <summary>
        /// Resident: Xóa yêu cầu
        /// </summary>
        [HttpDelete("{id}")]
        [Authorize(Roles = "Resident")]
        public async Task<IActionResult> DeleteRequest(int id)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
            {
                return BadRequest(new { message = "Không thể xác định thông tin người dùng" });
            }

            var resident = await _residentService.GetResidentByUserIdAsync(userId);
            if (resident == null)
            {
                return NotFound(new { message = "Không tìm thấy thông tin cư dân" });
            }

            var success = await _serviceRequestService.DeleteRequestAsync(id, resident.Id);

            if (!success)
                return BadRequest(new { message = "Không thể xóa yêu cầu. Có thể yêu cầu không tồn tại hoặc bạn không có quyền." });

            return Ok(new { message = "Xóa yêu cầu thành công" });
        }

        // ==================== STAFF/ADMIN OPERATIONS ====================

        /// <summary>
        /// Staff/Admin: Lấy tất cả yêu cầu
        /// </summary>
        [HttpGet]
        [Authorize(Roles = "Admin,Staff")]
        public async Task<IActionResult> GetAllRequests()
        {
            var requests = await _serviceRequestService.GetAllRequestsAsync();
            return Ok(requests);
        }

        /// <summary>
        /// Staff/Admin: Lấy yêu cầu theo ID
        /// </summary>
        [HttpGet("{id}")]
        [Authorize(Roles = "Admin,Staff,Resident")]
        public async Task<IActionResult> GetRequestById(int id)
        {
            var request = await _serviceRequestService.GetRequestByIdAsync(id);
            if (request == null)
                return NotFound(new { message = "Không tìm thấy yêu cầu" });

            // Check permission: Resident chỉ xem yêu cầu của mình
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
            
            if (userRole == "Resident")
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
                {
                    return BadRequest(new { message = "Không thể xác định thông tin người dùng" });
                }

                var resident = await _residentService.GetResidentByUserIdAsync(userId);
                if (resident == null || request.ResidentId != resident.Id)
                {
                    return Forbid();
                }
            }

            return Ok(request);
        }

        /// <summary>
        /// Admin/Staff: Lấy danh sách yêu cầu chờ xử lý
        /// </summary>
        [HttpGet("pending")]
        [Authorize(Roles = "Admin,Staff")]
        public async Task<IActionResult> GetPendingRequests()
        {
            var requests = await _serviceRequestService.GetRequestsByStatusAsync("Pending");
            return Ok(requests);
        }

        /// <summary>
        /// Admin/Staff: Review yêu cầu (Approved/InProgress/Completed/Rejected + Feedback)
        /// </summary>
        [HttpPost("{id}/review")]
        [Authorize(Roles = "Admin,Staff")]
        public async Task<IActionResult> ReviewRequest(int id, [FromBody] ReviewServiceRequestDto dto)
        {
            var staffName = User.FindFirst("username")?.Value;
            
            if (string.IsNullOrEmpty(staffName))
            {
                staffName = User.FindFirst(ClaimTypes.Name)?.Value ?? "Staff";
            }
            
            var success = await _serviceRequestService.ReviewRequestAsync(id, dto, staffName);

            if (!success)
                return BadRequest(new { message = "Không thể review yêu cầu" });

            return Ok(new { message = "Review yêu cầu thành công" });
        }
    }
}
