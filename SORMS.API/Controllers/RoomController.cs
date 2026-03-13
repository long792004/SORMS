using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SORMS.API.DTOs;
using SORMS.API.Interfaces;

namespace SORMS.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class RoomController : ControllerBase
    {
        private readonly IRoomService _roomService;

        public RoomController(IRoomService roomService)
        {
            _roomService = roomService;
        }

        /// <summary>
        /// Lấy danh sách tất cả phòng - Tất cả roles có thể xem
        /// </summary>
        [HttpGet]
        [Authorize(Roles = "Admin,Staff,Resident")]
        public async Task<IActionResult> GetAll()
        {
            var rooms = await _roomService.GetAllRoomsAsync();
            return Ok(rooms);
        }

        /// <summary>
        /// Lấy thông tin phòng theo ID - Tất cả roles có thể xem
        /// </summary>
        [HttpGet("{id}")]
        [Authorize(Roles = "Admin,Staff,Resident")]
        public async Task<IActionResult> GetById(int id)
        {
            var room = await _roomService.GetRoomByIdAsync(id);
            if (room == null)
                return NotFound("Không tìm thấy phòng.");

            return Ok(room);
        }

        /// <summary>
        /// Tạo phòng mới - Chỉ Admin và Staff
        /// </summary>
        [HttpPost]
        [Authorize(Roles = "Admin,Staff")]
        public async Task<IActionResult> Create([FromBody] RoomDto roomDto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var created = await _roomService.CreateRoomAsync(roomDto);
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
        }

        /// <summary>
        /// Cập nhật thông tin phòng - Chỉ Admin và Staff
        /// </summary>
        [HttpPut("{id}")]
        [Authorize(Roles = "Admin,Staff")]
        public async Task<IActionResult> Update(int id, [FromBody] RoomDto roomDto)
        {
            var success = await _roomService.UpdateRoomAsync(id, roomDto);
            if (!success)
                return NotFound("Không thể cập nhật phòng.");

            return NoContent();
        }

        /// <summary>
        /// Xóa phòng - CHỈ ADMIN
        /// </summary>
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(int id)
        {
            var success = await _roomService.DeleteRoomAsync(id);
            if (!success)
                return NotFound("Không thể xóa phòng.");

            return NoContent();
        }

        /// <summary>
        /// Lấy danh sách phòng trống - Tất cả roles có thể xem
        /// </summary>
        [HttpGet("available")]
        [Authorize(Roles = "Admin,Staff,Resident")]
        public async Task<IActionResult> GetAvailableRooms([FromQuery] DateTime? checkIn, [FromQuery] DateTime? checkOut)
        {
            if (checkIn.HasValue && checkOut.HasValue && checkOut.Value.Date <= checkIn.Value.Date)
                return BadRequest("Check-out phải lớn hơn Check-in.");

            var rooms = await _roomService.GetAvailableRoomsAsync(checkIn, checkOut);
            return Ok(rooms);
        }
    }
}
