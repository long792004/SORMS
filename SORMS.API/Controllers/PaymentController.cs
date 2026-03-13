using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SORMS.API.DTOs;
using SORMS.API.Interfaces;
using System.Security.Claims;

namespace SORMS.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class PaymentController : ControllerBase
    {
        private readonly IPaymentService _paymentService;
        private readonly IResidentService _residentService;
        private readonly ILogger<PaymentController> _logger;

        public PaymentController(IPaymentService paymentService, IResidentService residentService, ILogger<PaymentController> logger)
        {
            _paymentService = paymentService;
            _residentService = residentService;
            _logger = logger;
        }

        // ==================== Invoice Endpoints ====================

        /// <summary>
        /// Get invoices for current resident user
        /// </summary>
        [HttpGet("my-invoices")]
        public async Task<IActionResult> GetMyInvoices()
        {
            try
            {
                var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (!int.TryParse(userIdString, out int userId))
                {
                    return Unauthorized(new { success = false, message = "User ID not found or invalid." });
                }

                // Get resident by user ID
                var resident = await _residentService.GetResidentByUserIdAsync(userId);
                
                // If user is not a resident (e.g., Staff/Admin), return empty list
                if (resident == null)
                {
                    return Ok(new { success = true, data = new List<object>() });
                }

                // Get invoices for this resident
                var invoices = await _paymentService.GetResidentInvoicesAsync(resident.Id);
                
                return Ok(new { success = true, data = invoices });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting invoices: {ex.Message}");
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        /// <summary>
        /// Get a specific invoice
        /// </summary>
        [HttpGet("invoice/{invoiceId}")]
        public async Task<IActionResult> GetInvoice(int invoiceId)
        {
            try
            {
                var invoice = await _paymentService.GetInvoiceByIdAsync(invoiceId);
                if (invoice == null)
                    return NotFound(new { message = "Invoice not found" });

                return Ok(new { success = true, data = invoice });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting invoice: {ex.Message}");
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        /// <summary>
        /// Get all invoices (Admin/Staff only)
        /// </summary>
        [Authorize(Roles = "Admin,Staff")]
        [HttpGet("all")]
        public async Task<IActionResult> GetAllInvoices([FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 10)
        {
            try
            {
                var invoices = await _paymentService.GetAllInvoicesAsync(pageNumber, pageSize);
                return Ok(new { success = true, data = invoices, pageNumber, pageSize });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting all invoices: {ex.Message}");
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        /// <summary>
        /// Create a new invoice (Admin/Staff only)
        /// </summary>
        [Authorize(Roles = "Admin,Staff")]
        [HttpPost("create")]
        public async Task<IActionResult> CreateInvoice([FromBody] InvoiceCreateDto invoiceDto)
        {
            try
            {
                var staffIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (!int.TryParse(staffIdString, out int staffId))
                {
                    return Unauthorized(new { message = "Staff ID not found" });
                }

                var invoice = await _paymentService.CreateInvoiceAsync(invoiceDto, staffId);
                return Ok(new { success = true, message = "Invoice created successfully", data = invoice });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error creating invoice: {ex.Message}");
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        /// <summary>
        /// Delete an invoice (Admin/Staff only)
        /// </summary>
        [Authorize(Roles = "Admin,Staff")]
        [HttpDelete("delete/{invoiceId}")]
        public async Task<IActionResult> DeleteInvoice(int invoiceId)
        {
            try
            {
                var result = await _paymentService.DeleteInvoiceAsync(invoiceId);
                if (!result)
                    return NotFound(new { message = "Invoice not found" });

                return Ok(new { success = true, message = "Invoice deleted successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error deleting invoice: {ex.Message}");
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        // ==================== Payment Endpoints ====================

        /// <summary>
        /// Create a PayOS payment link for an invoice
        /// </summary>
        [HttpPost("create-payment-link/{invoiceId}")]
        public async Task<IActionResult> CreatePaymentLink(int invoiceId, [FromBody] CreatePaymentLinkDto dto)
        {
            try
            {
                var response = await _paymentService.CreatePaymentLinkAsync(invoiceId, dto.ReturnUrl, dto.CancelUrl);
                
                if (!response.Success)
                    return BadRequest(response);

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error creating payment link: {ex.Message}");
                return BadRequest(new PaymentResponseDto
                {
                    Success = false,
                    Message = ex.Message
                });
            }
        }

        /// <summary>
        /// Get payment status for an invoice
        /// </summary>
        [HttpGet("payment-status/{invoiceId}")]
        public async Task<IActionResult> GetPaymentStatus(int invoiceId)
        {
            try
            {
                var status = await _paymentService.GetPaymentStatusAsync(invoiceId);
                if (status == null)
                    return NotFound(new { message = "Invoice not found" });

                return Ok(new { success = true, data = status });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting payment status: {ex.Message}");
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        /// <summary>
        /// Verify payment and update invoice status (Webhook from PayOS)
        /// </summary>
        [AllowAnonymous]
        [HttpPost("verify-payment")]
        public async Task<IActionResult> VerifyPayment([FromQuery] long orderCode)
        {
            try
            {
                var result = await _paymentService.VerifyPaymentAsync(orderCode);
                return Ok(new { success = result, message = result ? "Payment verified" : "Payment verification failed" });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error verifying payment: {ex.Message}");
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        /// <summary>
        /// PayOS webhook handler
        /// </summary>
        [AllowAnonymous]
        [HttpPost("payos-webhook")]
        public async Task<IActionResult> PayOSWebhookHandler([FromBody] PaymentWebhookDto webhookData)
        {
            try
            {
                var result = await _paymentService.HandlePayOSWebhookAsync(webhookData);
                if (!result)
                    return BadRequest(new { success = false, message = "Invalid webhook payload or signature." });

                return Ok(new { success = true });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error handling webhook: {ex.Message}");
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        // ==================== Room Pricing Endpoints ====================

        /// <summary>
        /// Get current pricing for a room
        /// </summary>
        [HttpGet("room-pricing/{roomId}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetRoomPricing(int roomId)
        {
            try
            {
                var pricing = await _paymentService.GetRoomPricingAsync(roomId);
                if (pricing == null)
                    return NotFound(new { message = "Room pricing not found" });

                return Ok(new { success = true, data = pricing });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting room pricing: {ex.Message}");
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        /// <summary>
        /// Get all room pricings
        /// </summary>
        [HttpGet("room-pricings")]
        [AllowAnonymous]
        public async Task<IActionResult> GetAllRoomPricings()
        {
            try
            {
                var pricings = await _paymentService.GetAllRoomPricingsAsync();
                return Ok(new { success = true, data = pricings });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting room pricings: {ex.Message}");
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        /// <summary>
        /// Create or update room pricing (Admin/Staff only)
        /// </summary>
        [Authorize(Roles = "Admin,Staff")]
        [HttpPost("room-pricing/{roomId}")]
        public async Task<IActionResult> CreateRoomPricing(int roomId, [FromBody] UpdateRoomPricingDto dto)
        {
            try
            {
                var staffIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (!int.TryParse(staffIdString, out int staffId))
                {
                    return Unauthorized(new { message = "Staff ID not found" });
                }

                var pricing = await _paymentService.CreateRoomPricingAsync(roomId, dto, staffId);
                return Ok(new { success = true, message = "Room pricing created successfully", data = pricing });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error creating room pricing: {ex.Message}");
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        /// <summary>
        /// Update room pricing (Admin/Staff only)
        /// </summary>
        [Authorize(Roles = "Admin,Staff")]
        [HttpPut("room-pricing/{roomId}")]
        public async Task<IActionResult> UpdateRoomPricing(int roomId, [FromBody] UpdateRoomPricingDto dto)
        {
            try
            {
                var staffIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (!int.TryParse(staffIdString, out int staffId))
                {
                    return Unauthorized(new { message = "Staff ID not found" });
                }

                var pricing = await _paymentService.UpdateRoomPricingAsync(roomId, dto, staffId);
                return Ok(new { success = true, message = "Room pricing updated successfully", data = pricing });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error updating room pricing: {ex.Message}");
                return BadRequest(new { success = false, message = ex.Message });
            }
        }
    }
}
