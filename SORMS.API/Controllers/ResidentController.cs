using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SORMS.API.DTOs;
using SORMS.API.Interfaces;
using System.Security.Claims;

namespace SORMS.API.Controllers
{
    [Authorize] // Tất cả endpoints đều cần đăng nhập
    [ApiController]
    [Route("api/[controller]")]
    public class ResidentController : ControllerBase
    {
        private readonly IResidentService _residentService;

        public ResidentController(IResidentService residentService)
        {
            _residentService = residentService;
        }

        /// <summary>
        /// Lấy danh sách tất cả cư dân - Chỉ Admin và Staff
        /// </summary>
        [HttpGet]
        [Authorize(Roles = "Admin,Staff")]
        public async Task<IActionResult> GetAll()
        {
            var residents = await _residentService.GetAllResidentsAsync();
            return Ok(residents);
        }

        /// <summary>
        /// Lấy thông tin cư dân theo ID - Chỉ Admin và Staff
        /// </summary>
        [HttpGet("{id}")]
        [Authorize(Roles = "Admin,Staff")]
        public async Task<IActionResult> GetById(int id)
        {
            var resident = await _residentService.GetResidentByIdAsync(id);
            if (resident == null)
                return NotFound("Không tìm thấy cư dân.");

            return Ok(resident);
        }

        /// <summary>
        /// Cập nhật profile của Resident hiện tại
        /// </summary>
        [HttpPut("my-profile")]
        [Authorize(Roles = "Resident")]
        public async Task<IActionResult> UpdateMyProfile([FromBody] UpdateResidentProfileDto dto)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
            {
                return Unauthorized("Không thể xác định người dùng.");
            }

            var success = await _residentService.UpdateResidentProfileAsync(userId, dto.Address, dto.EmergencyContact, dto.Notes);
            if (!success)
                return BadRequest("Không thể cập nhật profile.");

            return Ok("Cập nhật profile thành công.");
        }

        /// <summary>
        /// Lấy profile của Resident hiện tại
        /// </summary>
        [HttpGet("my-profile")]
        [Authorize(Roles = "Resident")]
        public async Task<IActionResult> GetMyProfile()
        {
            // Lấy UserId từ JWT token
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
            {
                return Unauthorized("Không thể xác định người dùng.");
            }

            // Tìm resident theo UserId (sử dụng method mới)
            var myResident = await _residentService.GetResidentByUserIdAsync(userId);

            if (myResident == null)
            {
                return NotFound("Không tìm thấy hồ sơ cư dân. Vui lòng liên hệ Admin để được hỗ trợ.");
            }

            return Ok(myResident);
        }

        /// <summary>
        /// Tạo mới cư dân - Chỉ Admin và Staff
        /// </summary>
        [HttpPost]
        [Authorize(Roles = "Admin,Staff")]
        public async Task<IActionResult> Create([FromBody] ResidentDto residentDto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var created = await _residentService.CreateResidentAsync(residentDto);
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
        }

        /// <summary>
        /// Cập nhật thông tin cư dân - Chỉ Admin và Staff
        /// </summary>
        [HttpPut("{id}")]
        [Authorize(Roles = "Admin,Staff")]
        public async Task<IActionResult> Update(int id, [FromBody] ResidentDto residentDto)
        {
            var success = await _residentService.UpdateResidentAsync(id, residentDto);
            if (!success)
                return NotFound("Không thể cập nhật cư dân.");

            return NoContent();
        }

        /// <summary>
        /// Xóa cư dân - Chỉ Admin
        /// </summary>
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(int id)
        {
            var success = await _residentService.DeleteResidentAsync(id);
            if (!success)
                return NotFound("Không thể xóa cư dân.");

            return NoContent();
        }

        /// <summary>
        /// Lấy danh sách cư dân theo phòng - Chỉ Admin và Staff
        /// </summary>
        [HttpGet("room/{roomId}")]
        [Authorize(Roles = "Admin,Staff")]
        public async Task<IActionResult> GetByRoom(int roomId)
        {
            var residents = await _residentService.GetResidentsByRoomIdAsync(roomId);
            return Ok(residents);
        }

        /// <summary>
        /// Check-in cư dân theo ngày - Chỉ Admin và Staff
        /// </summary>
        [HttpPut("{residentId}/checkin")]
        [Authorize(Roles = "Admin,Staff")]
        public async Task<IActionResult> CheckIn(int residentId, [FromQuery] DateTime date)
        {
            var success = await _residentService.CheckInAsync(residentId, date);
            if (!success)
                return BadRequest("Không thể check-in.");

            return Ok("Check-in thành công.");
        }

        /// <summary>
        /// Check-out cư dân theo ngày - Chỉ Admin và Staff
        /// </summary>
        [HttpPut("{residentId}/checkout")]
        [Authorize(Roles = "Admin,Staff")]
        public async Task<IActionResult> CheckOut(int residentId, [FromQuery] DateTime date)
        {
            var success = await _residentService.CheckOutAsync(residentId, date);
            if (!success)
                return BadRequest("Không thể check-out.");

            return Ok("Check-out thành công.");
        }

        /// <summary>
        /// Update email and phone for Resident (Settings page)
        /// </summary>
        [HttpPut("update-account")]
        [Authorize(Roles = "Resident")]
        public async Task<IActionResult> UpdateAccount([FromBody] UpdateResidentAccountDto dto)
        {
            Console.WriteLine($"[API UpdateAccount] Received - Email: {dto.Email}, Phone: {dto.Phone}");
            
            if (!ModelState.IsValid)
            {
                Console.WriteLine("[API UpdateAccount] ModelState invalid:");
                foreach (var error in ModelState)
                {
                    Console.WriteLine($"  Key: {error.Key}, Errors: {string.Join(", ", error.Value.Errors.Select(e => e.ErrorMessage))}");
                }
                return BadRequest(ModelState);
            }

            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            Console.WriteLine($"[API UpdateAccount] UserId from token: {userIdClaim}");
            
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
            {
                Console.WriteLine("[API UpdateAccount] Invalid token - userId not found");
                return Unauthorized("Invalid token");
            }

            var success = await _residentService.UpdateResidentAccountAsync(userId, dto.Email, dto.Phone);
            Console.WriteLine($"[API UpdateAccount] Update result: {success}");
            
            if (!success)
                return NotFound("Không tìm thấy hồ sơ cư dân");

            return Ok("Cập nhật tài khoản thành công");
        }

        /// <summary>
        /// Update profile info for Resident (Settings page)
        /// </summary>
        [HttpPut("update-profile")]
        [Authorize(Roles = "Resident")]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateResidentProfileDto dto)
        {
            Console.WriteLine($"[API UpdateProfile] Received - Address: {dto.Address}, EmergencyContact: {dto.EmergencyContact}, Notes: {dto.Notes}");
            
            if (!ModelState.IsValid)
            {
                Console.WriteLine("[API UpdateProfile] ModelState invalid");
                return BadRequest(ModelState);
            }

            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            Console.WriteLine($"[API UpdateProfile] UserId from token: {userIdClaim}");
            
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
            {
                Console.WriteLine("[API UpdateProfile] Invalid token");
                return Unauthorized("Invalid token");
            }

            var success = await _residentService.UpdateResidentProfileAsync(userId, dto.Address, dto.EmergencyContact, dto.Notes);
            Console.WriteLine($"[API UpdateProfile] Update result: {success}");
            
            if (!success)
                return NotFound("Không tìm thấy hồ sơ cư dân");

            return Ok("Cập nhật hồ sơ thành công");
        }
    }
}
