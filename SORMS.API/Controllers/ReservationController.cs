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
    public class ReservationController : ControllerBase
    {
        private readonly IReservationService _reservationService;

        public ReservationController(IReservationService reservationService)
        {
            _reservationService = reservationService;
        }

        [Authorize(Roles = "Resident")]
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateReservationDto dto)
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                if (userId <= 0)
                    return BadRequest(new { success = false, message = "Không tìm thấy thông tin người dùng." });

                var result = await _reservationService.CreateReservationAsync(userId, dto);
                return Ok(new
                {
                    success = true,
                    message = "Tạo reservation thành công. Vui lòng thanh toán trong 15 phút để giữ phòng.",
                    data = result
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [Authorize(Roles = "Resident")]
        [HttpGet("my")]
        public async Task<IActionResult> GetMyReservations()
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                if (userId <= 0)
                    return BadRequest(new { success = false, message = "Không tìm thấy thông tin người dùng." });

                var data = await _reservationService.GetMyReservationsAsync(userId);
                return Ok(new { success = true, data });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [Authorize(Roles = "Admin,Staff")]
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var data = await _reservationService.GetAllReservationsAsync();
            return Ok(new { success = true, data });
        }

        [Authorize(Roles = "Resident,Admin,Staff")]
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var data = await _reservationService.GetByIdAsync(id);
            if (data == null)
                return NotFound(new { success = false, message = "Không tìm thấy reservation." });

            return Ok(new { success = true, data });
        }

        [Authorize(Roles = "Resident")]
        [HttpPost("{id}/cancel")]
        public async Task<IActionResult> Cancel(int id, [FromBody] CancelReservationDto dto)
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                if (userId <= 0)
                    return BadRequest(new { success = false, message = "Không tìm thấy thông tin người dùng." });

                var ok = await _reservationService.CancelReservationAsync(id, userId, dto?.Reason);
                if (!ok)
                    return BadRequest(new { success = false, message = "Không thể hủy reservation." });

                return Ok(new { success = true, message = "Hủy reservation thành công." });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [Authorize(Roles = "Resident,Admin,Staff")]
        [HttpPost("{id}/confirm-payment")]
        public async Task<IActionResult> ConfirmPayment(int id, [FromBody] ConfirmReservationPaymentDto dto)
        {
            try
            {
                var ok = await _reservationService.ConfirmPaymentAsync(id, dto.OrderCode);
                if (!ok)
                    return BadRequest(new { success = false, message = "Không thể xác nhận thanh toán reservation." });

                return Ok(new { success = true, message = "Reservation đã được xác nhận thanh toán." });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }
    }
}
