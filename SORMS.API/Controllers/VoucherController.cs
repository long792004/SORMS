using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SORMS.API.DTOs;
using SORMS.API.Interfaces;

namespace SORMS.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public class VoucherController : ControllerBase
    {
        private readonly IVoucherService _voucherService;
        private readonly ILogger<VoucherController> _logger;

        public VoucherController(IVoucherService voucherService, ILogger<VoucherController> logger)
        {
            _voucherService = voucherService;
            _logger = logger;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            try
            {
                var vouchers = await _voucherService.GetAllVouchersAsync();
                return Ok(new { success = true, data = vouchers });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting vouchers");
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id)
        {
            try
            {
                var voucher = await _voucherService.GetVoucherByIdAsync(id);
                if (voucher == null)
                {
                    return NotFound(new { success = false, message = "Voucher not found." });
                }

                return Ok(new { success = true, data = voucher });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting voucher {VoucherId}", id);
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Create([FromBody] VoucherCreateDto dto)
        {
            try
            {
                var voucher = await _voucherService.CreateVoucherAsync(dto);
                return CreatedAtAction(nameof(GetById), new { id = voucher.Id }, new { success = true, data = voucher });
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogWarning(ex, "Invalid voucher create request");
                return BadRequest(new { success = false, message = ex.Message });
            }
            catch (ArgumentException ex)
            {
                _logger.LogWarning(ex, "Invalid voucher create request");
                return BadRequest(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating voucher");
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpPut("{id:int}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Update(int id, [FromBody] VoucherUpdateDto dto)
        {
            try
            {
                var voucher = await _voucherService.UpdateVoucherAsync(id, dto);
                return Ok(new { success = true, data = voucher });
            }
            catch (KeyNotFoundException ex)
            {
                _logger.LogWarning(ex, "Voucher not found for update {VoucherId}", id);
                return NotFound(new { success = false, message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogWarning(ex, "Invalid voucher update request {VoucherId}", id);
                return BadRequest(new { success = false, message = ex.Message });
            }
            catch (ArgumentException ex)
            {
                _logger.LogWarning(ex, "Invalid voucher update request {VoucherId}", id);
                return BadRequest(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating voucher {VoucherId}", id);
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpDelete("{id:int}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(int id)
        {
            try
            {
                var deleted = await _voucherService.DeleteVoucherAsync(id);
                if (!deleted)
                {
                    return NotFound(new { success = false, message = "Voucher not found." });
                }

                return Ok(new { success = true, message = "Voucher deleted successfully." });
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogWarning(ex, "Invalid voucher delete request {VoucherId}", id);
                return BadRequest(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting voucher {VoucherId}", id);
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpPatch("{id:int}/toggle-active")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> ToggleActive(int id)
        {
            try
            {
                var voucher = await _voucherService.ToggleActiveAsync(id);
                return Ok(new { success = true, data = voucher });
            }
            catch (KeyNotFoundException ex)
            {
                _logger.LogWarning(ex, "Voucher not found for toggle {VoucherId}", id);
                return NotFound(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error toggling voucher {VoucherId}", id);
                return BadRequest(new { success = false, message = ex.Message });
            }
        }
    }
}