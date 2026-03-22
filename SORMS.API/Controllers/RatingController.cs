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
    public class RatingController : ControllerBase
    {
        private readonly IRatingService _ratingService;

        public RatingController(IRatingService ratingService)
        {
            _ratingService = ratingService;
        }

        [Authorize(Roles = "Resident")]
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateRatingDto dto)
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                if (userId <= 0)
                    return BadRequest(new { success = false, message = "Không tìm thấy thông tin người dùng." });

                var data = await _ratingService.CreateRatingAsync(userId, dto);
                return Ok(new { success = true, message = "Đánh giá thành công.", data });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [Authorize(Roles = "Resident")]
        [HttpGet("my")]
        public async Task<IActionResult> GetMyRatings()
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                if (userId <= 0)
                    return BadRequest(new { success = false, message = "Không tìm thấy thông tin người dùng." });

                var data = await _ratingService.GetMyRatingsAsync(userId);
                return Ok(new { success = true, data });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [Authorize(Roles = "Admin,Staff")]
        [HttpGet]
        public async Task<IActionResult> GetAllRatings()
        {
            var data = await _ratingService.GetAllRatingsAsync();
            return Ok(new { success = true, data });
        }
    }
}
