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
    public class CheckInController : ControllerBase
    {
        private readonly ICheckInService _checkInService;

        public CheckInController(ICheckInService checkInService)
        {
            _checkInService = checkInService;
        }

        /// <summary>
        /// [RESIDENT] Tạo yêu cầu check-in vào phòng
        /// </summary>
        [Authorize(Roles = "Resident")]
        [HttpPost("request-checkin")]
        public async Task<IActionResult> RequestCheckIn([FromBody] CreateCheckInRequestDto request)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    var errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage).ToList();
                    Console.WriteLine($"[CheckIn API] Model Invalid: {string.Join(", ", errors)}");
                    return BadRequest(new { success = false, message = "Dữ liệu không hợp lệ.", errors = errors });
                }

                // Log tất cả claims để debug
                var allClaims = string.Join(", ", User.Claims.Select(c => $"{c.Type}={c.Value}"));
                Console.WriteLine($"[CheckIn API] All Claims: {allClaims}");

                var residentId = await ResolveResidentIdAsync();
                if (residentId == 0)
                {
                    Console.WriteLine("[CheckIn API] ERROR: ResidentId = 0, không tìm thấy resident hợp lệ cho user hiện tại");
                    return BadRequest(new { success = false, message = "Không tìm thấy thông tin resident. Vui lòng logout và login lại." });
                }

                Console.WriteLine($"[CheckIn API] Creating check-in request for ResidentId={residentId}, RoomId={request.RoomId}, CheckIn={request.CheckInDate:yyyy-MM-dd}, CheckOut={request.CheckOutDate:yyyy-MM-dd}");
                var result = await _checkInService.CreateCheckInRequestAsync(residentId, request);
                return Ok(new { 
                    success = true, 
                    message = "Yêu cầu check-in đã được gửi. Vui lòng chờ Staff/Admin phê duyệt.", 
                    data = result 
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        /// <summary>
        /// [RESIDENT] Tạo yêu cầu check-out khỏi phòng
        /// </summary>
        [Authorize(Roles = "Resident")]
        [HttpPost("request-checkout")]
        public async Task<IActionResult> RequestCheckOut([FromBody] CreateCheckOutRequestDto request)
        {
            try
            {
                var residentId = await ResolveResidentIdAsync();
                if (residentId == 0)
                    return BadRequest(new { success = false, message = "Không tìm thấy thông tin resident" });

                var result = await _checkInService.CreateCheckOutRequestAsync(residentId, request.CheckInRecordId);
                return Ok(new { 
                    success = true, 
                    message = "Yêu cầu check-out đã được gửi. Vui lòng chờ Staff/Admin phê duyệt.", 
                    data = result 
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        /// <summary>
        /// [RESIDENT] Hủy yêu cầu check-in đang chờ
        /// </summary>
        [Authorize(Roles = "Resident")]
        [HttpPost("cancel-checkin")]
        public async Task<IActionResult> CancelCheckIn([FromBody] CancelCheckInRequestDto request)
        {
            try
            {
                var residentId = await ResolveResidentIdAsync();
                if (residentId == 0)
                    return BadRequest(new { success = false, message = "Không tìm thấy thông tin resident" });

                await _checkInService.CancelPendingCheckInRequestAsync(residentId, request.CheckInRecordId);
                return Ok(new { success = true, message = "Đã hủy yêu cầu check-in." });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        private async Task<int> ResolveResidentIdAsync()
        {
            var residentIdClaim = User.FindFirst("ResidentId")?.Value;
            if (int.TryParse(residentIdClaim, out var residentIdFromClaim) && residentIdFromClaim > 0)
            {
                return residentIdFromClaim;
            }

            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdClaim, out var userId) || userId <= 0)
            {
                return 0;
            }

            return await _checkInService.GetResidentIdByUserIdAsync(userId);
        }

        /// <summary>
        /// [STAFF/ADMIN] Phê duyệt hoặc từ chối yêu cầu check-in
        /// </summary>
        [Authorize(Roles = "Admin,Staff")]
        [HttpPost("approve-checkin")]
        public async Task<IActionResult> ApproveCheckIn([FromBody] ApproveCheckInRequestDto request)
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdClaim))
                    return BadRequest("Không tìm thấy thông tin user");

                var userId = int.Parse(userIdClaim);
                // ✅ Cho phép userId = 0 (Admin từ config)
                // Không cần check userId == 0 vì Admin account hợp lệ có thể có Id = 0

                var result = await _checkInService.ApproveCheckInRequestAsync(
                    request.RequestId, 
                    userId, 
                    request.IsApproved, 
                    request.RejectReason
                );

                var message = request.IsApproved ? "Đã phê duyệt yêu cầu check-in" : "Đã từ chối yêu cầu check-in";
                return Ok(new { success = true, message = message });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        /// <summary>
        /// [STAFF/ADMIN] Phê duyệt hoặc từ chối yêu cầu check-out
        /// </summary>
        [Authorize(Roles = "Admin,Staff")]
        [HttpPost("approve-checkout")]
        public async Task<IActionResult> ApproveCheckOut([FromBody] ApproveCheckInRequestDto request)
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdClaim))
                    return BadRequest("Không tìm thấy thông tin user");

                var userId = int.Parse(userIdClaim);
                // ✅ Cho phép userId = 0 (Admin từ config)
                // Không cần check userId == 0 vì Admin account hợp lệ có thể có Id = 0

                var result = await _checkInService.ApproveCheckOutRequestAsync(
                    request.RequestId, 
                    userId, 
                    request.IsApproved, 
                    request.RejectReason
                );

                var message = request.IsApproved ? "Đã phê duyệt yêu cầu check-out" : "Đã từ chối yêu cầu check-out";
                return Ok(new { success = true, message = message });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        /// <summary>
        /// [STAFF/ADMIN] Lấy danh sách yêu cầu check-in chờ phê duyệt
        /// </summary>
        [Authorize(Roles = "Admin,Staff")]
        [HttpGet("pending-checkin")]
        public async Task<IActionResult> GetPendingCheckInRequests()
        {
            try
            {
                var requests = await _checkInService.GetPendingCheckInRequestsAsync();
                return Ok(new { success = true, data = requests });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        /// <summary>
        /// [STAFF/ADMIN] Lấy danh sách yêu cầu check-out chờ phê duyệt
        /// </summary>
        [Authorize(Roles = "Admin,Staff")]
        [HttpGet("pending-checkout")]
        public async Task<IActionResult> GetPendingCheckOutRequests()
        {
            try
            {
                var requests = await _checkInService.GetPendingCheckOutRequestsAsync();
                return Ok(new { success = true, data = requests });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        /// <summary>
        /// [RESIDENT] Lấy trạng thái check-in hiện tại của mình
        /// </summary>
        [Authorize(Roles = "Resident")]
        [HttpGet("my-status")]
        public async Task<IActionResult> GetMyCurrentStatus()
        {
            try
            {
                Console.WriteLine("[my-status] ========== START ==========");
                var residentIdClaim = User.FindFirst("ResidentId")?.Value;
                Console.WriteLine($"[my-status] ResidentId Claim: {residentIdClaim ?? "NULL"}");
                
                var residentId = int.Parse(residentIdClaim ?? "0");
                Console.WriteLine($"[my-status] Parsed ResidentId: {residentId}");
                
                // Nếu không có ResidentId claim, thử lấy từ UserId
                if (residentId == 0)
                {
                    Console.WriteLine("[my-status] ResidentId = 0, trying to get from UserId...");
                    var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                    Console.WriteLine($"[my-status] UserId from claim: {userId}");
                    
                    // ✅ Check userId == 0 là HỢP LÝ ở đây vì:
                    // 1. Endpoint này chỉ dành cho RESIDENT
                    // 2. Admin (userId = 0) sẽ KHÔNG BAO GIỜ gọi endpoint này
                    // 3. Resident PHẢI có userId > 0 (từ database)
                    if (userId == 0)
                    {
                        Console.WriteLine("[my-status] ERROR: UserId = 0");
                        return BadRequest(new { success = false, message = "Không tìm thấy thông tin người dùng" });
                    }
                    
                    // Tìm ResidentId từ UserId
                    residentId = await _checkInService.GetResidentIdByUserIdAsync(userId);
                    Console.WriteLine($"[my-status] ResidentId from UserId: {residentId}");
                    
                    if (residentId == 0)
                    {
                        Console.WriteLine("[my-status] ERROR: No resident found for this user");
                        return BadRequest(new { success = false, message = "Bạn chưa được đăng ký là cư dân. Vui lòng liên hệ quản trị viên." });
                    }
                }

                Console.WriteLine($"[my-status] Getting status for ResidentId: {residentId}");
                var status = await _checkInService.GetCurrentCheckInStatusAsync(residentId);
                Console.WriteLine($"[my-status] Status found: {status != null}");
                Console.WriteLine("[my-status] ========== END (SUCCESS) ==========");
                
                return Ok(new { success = true, data = status });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[my-status] ========== END (ERROR) ==========");
                Console.WriteLine($"[my-status] Exception: {ex.Message}");
                Console.WriteLine($"[my-status] StackTrace: {ex.StackTrace}");
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        /// <summary>
        /// [RESIDENT] Lấy lịch sử check-in của mình
        /// </summary>
        [Authorize(Roles = "Resident")]
        [HttpGet("my-history")]
        public async Task<IActionResult> GetMyHistory()
        {
            try
            {
                var residentIdClaim = User.FindFirst("ResidentId")?.Value;
                var residentId = int.Parse(residentIdClaim ?? "0");
                
                // Nếu không có ResidentId claim, thử lấy từ UserId
                if (residentId == 0)
                {
                    var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                    // ✅ Check userId == 0 là HỢP LÝ ở đây vì:
                    // 1. Endpoint này chỉ dành cho RESIDENT
                    // 2. Admin (userId = 0) sẽ KHÔNG BAO GIỜ gọi endpoint này
                    // 3. Resident PHẢI có userId > 0 (từ database)
                    if (userId == 0)
                        return BadRequest(new { success = false, message = "Không tìm thấy thông tin người dùng" });
                    
                    // Tìm ResidentId từ UserId
                    residentId = await _checkInService.GetResidentIdByUserIdAsync(userId);
                    if (residentId == 0)
                        return BadRequest(new { success = false, message = "Bạn chưa được đăng ký là cư dân." });
                }

                var history = await _checkInService.GetCheckInHistoryAsync(residentId);
                return Ok(new { success = true, data = history });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        /// <summary>
        /// [STAFF/ADMIN] Lấy tất cả records check-in
        /// </summary>
        [Authorize(Roles = "Admin,Staff")]
        [HttpGet("all")]
        public async Task<IActionResult> GetAllCheckInRecords()
        {
            try
            {
                var records = await _checkInService.GetAllCheckInRecordsAsync();
                return Ok(new { success = true, data = records });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }
    }
}
