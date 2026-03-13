using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SORMS.API.DTOs;
using SORMS.API.Interfaces;
using System.Security.Claims;

namespace SORMS.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class StaffController : ControllerBase
    {
        private readonly IStaffService _staffService;

        public StaffController(IStaffService staffService)
        {
            _staffService = staffService;
        }

        /// <summary>
        /// Admin xem danh sách toàn bộ nhân viên
        /// </summary>
        [Authorize(Roles = "Admin")]
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var staff = await _staffService.GetAllStaffAsync();
            return Ok(staff);
        }

        /// <summary>
        /// Admin xem thông tin chi tiết một nhân viên theo Id
        /// </summary>
        [Authorize(Roles = "Admin")]
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var staff = await _staffService.GetStaffByIdAsync(id);
            if (staff == null) return NotFound(new { message = "Staff not found" });
            return Ok(staff);
        }

        /// <summary>
        /// Admin cập nhật thông tin bất kỳ nhân viên nào
        /// </summary>
        [Authorize(Roles = "Admin")]
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] StaffDto staffDto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var result = await _staffService.UpdateStaffAsync(id, staffDto);
            if (!result) return NotFound(new { message = "Staff not found" });

            return NoContent();
        }

        /// <summary>
        /// Admin xóa nhân viên (đồng thời xóa User tương ứng nếu có)
        /// </summary>
        [Authorize(Roles = "Admin")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var result = await _staffService.DeleteStaffAsync(id);
            if (!result) return NotFound(new { message = "Staff not found" });

            return NoContent();
        }

        /// <summary>
        /// Nhân viên xem thông tin hồ sơ của chính mình
        /// </summary>
        [Authorize(Roles = "Staff")]
        [HttpGet("me")]
        public async Task<IActionResult> GetMyProfile()
        {
            var staffIdClaim = User.FindFirst("StaffId")?.Value;
            if (string.IsNullOrEmpty(staffIdClaim) || !int.TryParse(staffIdClaim, out int staffId))
            {
                return Unauthorized(new { message = "Invalid or missing StaffId claim in token" });
            }

            var staff = await _staffService.GetStaffByIdAsync(staffId);
            if (staff == null) return NotFound(new { message = "Staff profile not found" });

            return Ok(staff);
        }

        /// <summary>
        /// Nhân viên cập nhật thông tin của chính mình
        /// </summary>
        [Authorize(Roles = "Staff")]
        [HttpPut("me")]
        public async Task<IActionResult> UpdateMyProfile([FromBody] StaffDto staffDto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var staffIdClaim = User.FindFirst("StaffId")?.Value;
            if (string.IsNullOrEmpty(staffIdClaim) || !int.TryParse(staffIdClaim, out int staffId))
            {
                return Unauthorized(new { message = "Invalid or missing StaffId claim in token" });
            }

            // Luôn dùng StaffId từ token, không cho phép client sửa Id của người khác
            var result = await _staffService.UpdateStaffAsync(staffId, staffDto);
            if (!result) return NotFound(new { message = "Staff profile not found" });

            return NoContent();
        }
    }
}
