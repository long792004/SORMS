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
    public class RoomInspectionController : ControllerBase
    {
        private readonly IRoomInspectionService _roomInspectionService;

        public RoomInspectionController(IRoomInspectionService roomInspectionService)
        {
            _roomInspectionService = roomInspectionService;
        }

        [Authorize(Roles = "Admin,Staff")]
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateRoomInspectionDto dto)
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                if (userId < 0)
                    return BadRequest(new { success = false, message = "Không tìm thấy thông tin staff." });

                var result = await _roomInspectionService.CreateInspectionAsync(userId, dto);
                return Ok(new { success = true, message = "Đã ghi nhận biên bản kiểm tra phòng.", data = result });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [Authorize(Roles = "Admin,Staff,Resident")]
        [HttpGet("checkin-record/{checkInRecordId}")]
        public async Task<IActionResult> GetByCheckInRecord(int checkInRecordId)
        {
            var data = await _roomInspectionService.GetByCheckInRecordIdAsync(checkInRecordId);
            if (data == null)
                return NotFound(new { success = false, message = "Không tìm thấy biên bản kiểm tra phòng." });

            return Ok(new { success = true, data });
        }
    }
}
