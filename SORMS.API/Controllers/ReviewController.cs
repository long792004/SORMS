using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SORMS.API.DTOs;
using SORMS.API.Interfaces;

namespace SORMS.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ReviewController : ControllerBase
    {
        private readonly IReviewService _reviewService;

        public ReviewController(IReviewService reviewService)
        {
            _reviewService = reviewService;
        }

        [Authorize(Roles = "Resident")]
        [HttpPost]
        public async Task<IActionResult> CreateReview([FromBody] CreateReviewRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                var result = await _reviewService.CreateReviewAsync(request);
                return Ok(new { success = true, data = result });
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(403, new { success = false, message = ex.Message });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { success = false, message = ex.Message });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [AllowAnonymous]
        [HttpGet("room/{roomId}")]
        public async Task<IActionResult> GetRoomReviews(
            int roomId,
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 10)
        {
            try
            {
                var result = await _reviewService.GetRoomReviewsAsync(roomId, pageNumber, pageSize);
                return Ok(new { success = true, data = result, pageNumber, pageSize });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { success = false, message = ex.Message });
            }
        }

        [AllowAnonymous]
        [HttpGet("public/recent")]
        public async Task<IActionResult> GetPublicRecentReviews([FromQuery] int limit = 6)
        {
            var result = await _reviewService.GetPublicRecentReviewsAsync(limit);
            return Ok(new { success = true, data = result });
        }

        [Authorize(Roles = "Resident")]
        [HttpGet("my-reviews")]
        public async Task<IActionResult> GetMyReviews()
        {
            try
            {
                var result = await _reviewService.GetMyReviewsAsync();
                return Ok(new { success = true, data = result });
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(403, new { success = false, message = ex.Message });
            }
        }

        [Authorize(Roles = "Admin")]
        [HttpGet("admin/all")]
        public async Task<IActionResult> GetAllReviewsForAdmin()
        {
            var result = await _reviewService.GetAllReviewsForAdminAsync();
            return Ok(new { success = true, data = result });
        }

        [Authorize(Roles = "Admin")]
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> DeleteReview(int id)
        {
            var deleted = await _reviewService.DeleteReviewAsync(id);
            if (!deleted)
                return NotFound(new { success = false, message = "Review not found." });

            return Ok(new { success = true, message = "Review deleted successfully." });
        }
    }
}