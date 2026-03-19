using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using QRCoder;
using SORMS.API.Data;
using SORMS.API.DTOs;
using SORMS.API.Interfaces;
using SORMS.API.Models;
using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace SORMS.API.Services
{
    public class PaymentService : IPaymentService
    {
        private readonly SormsDbContext _context;
        private readonly ILogger<PaymentService> _logger;
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly string _frontendUrl;
        private readonly string? _publicApiUrl;
        private readonly string? _payOSWebhookUrl;
        private readonly string? _payOSClientId;
        private readonly string? _payOSApiKey;
        private readonly string? _payOSChecksumKey;
        private readonly string _payOSBaseUrl;
        private readonly bool _payOSEnabled;
        private readonly JsonSerializerOptions _jsonOptions = new()
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            PropertyNameCaseInsensitive = true
        };

        public PaymentService(
            SormsDbContext context,
            IConfiguration configuration,
            IHttpClientFactory httpClientFactory,
            ILogger<PaymentService> logger)
        {
            _context = context;
            _logger = logger;
            _httpClientFactory = httpClientFactory;
            _frontendUrl = configuration["FrontendUrl"] ?? "http://localhost:5173";
            _publicApiUrl = configuration["PublicApiUrl"];
            _payOSWebhookUrl = configuration["PayOS:WebhookUrl"];
            _payOSClientId = configuration["PayOS:ClientId"];
            _payOSApiKey = configuration["PayOS:ApiKey"];
            _payOSChecksumKey = configuration["PayOS:ChecksumKey"];
            _payOSBaseUrl = configuration["PayOS:BaseUrl"] ?? "https://api-merchant.payos.vn";

            // Check if PayOS is configured
            _payOSEnabled = !string.IsNullOrEmpty(_payOSClientId) && 
                           !string.IsNullOrEmpty(_payOSApiKey) && 
                           !string.IsNullOrEmpty(_payOSChecksumKey) &&
                           _payOSClientId != "YOUR_PAYOS_CLIENT_ID";

            if (!_payOSEnabled)
            {
                _logger.LogWarning("PayOS is not configured or using placeholder credentials. Real payment QR/link is disabled until PayOS credentials are provided.");
            }
        }

        // ==================== Invoice Management ====================

        public async Task<InvoiceDetailDto?> GetInvoiceByIdAsync(int invoiceId)
        {
            try
            {
                var invoice = await _context.Invoices
                    .Include(i => i.Resident)
                    .Include(i => i.Room)
                    .Include(i => i.Voucher)
                    .FirstOrDefaultAsync(i => i.Id == invoiceId);

                if (invoice == null)
                    return null;

                await SyncInvoiceStatusAsync(invoice);

                return MapToInvoiceDetailDto(invoice);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting invoice: {ex.Message}");
                throw;
            }
        }

        public async Task<List<InvoiceDetailDto>> GetResidentInvoicesAsync(int residentId)
        {
            try
            {
                var invoices = await _context.Invoices
                    .Where(i => i.ResidentId == residentId)
                    .Include(i => i.Resident)
                    .Include(i => i.Room)
                    .Include(i => i.Voucher)
                    .OrderByDescending(i => i.CreatedAt)
                    .ToListAsync();

                await SyncInvoiceStatusesAsync(invoices);

                return invoices.Select(MapToInvoiceDetailDto).ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting resident invoices: {ex.Message}");
                throw;
            }
        }

        public async Task<List<InvoiceDetailDto>> GetAllInvoicesAsync(int pageNumber = 1, int pageSize = 10)
        {
            try
            {
                var invoices = await _context.Invoices
                    .Include(i => i.Resident)
                    .Include(i => i.Room)
                    .Include(i => i.Voucher)
                    .OrderByDescending(i => i.CreatedAt)
                    .Skip((pageNumber - 1) * pageSize)
                    .Take(pageSize)
                    .ToListAsync();

                await SyncInvoiceStatusesAsync(invoices);

                return invoices.Select(MapToInvoiceDetailDto).ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting all invoices: {ex.Message}");
                throw;
            }
        }

        public async Task<InvoiceDetailDto> CreateInvoiceAsync(InvoiceCreateDto invoiceDto, int createdByStaffId)
        {
            try
            {
                var resident = await _context.Residents.FirstOrDefaultAsync(r => r.Id == invoiceDto.ResidentId);
                if (resident == null)
                    throw new Exception("Resident not found");

                var invoice = new Invoice
                {
                    ResidentId = invoiceDto.ResidentId,
                    RoomId = invoiceDto.RoomId,
                    Amount = invoiceDto.Amount,
                    DiscountAmount = 0,
                    TotalAmount = invoiceDto.Amount,
                    Description = invoiceDto.Description,
                    Status = "Pending",
                    CreatedAt = DateTime.UtcNow
                };

                _context.Invoices.Add(invoice);
                await _context.SaveChangesAsync();

                return await GetInvoiceByIdAsync(invoice.Id)
                    ?? throw new Exception("Created invoice could not be reloaded.");
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error creating invoice: {ex.Message}");
                throw;
            }
        }

        public async Task<bool> DeleteInvoiceAsync(int invoiceId)
        {
            try
            {
                var invoice = await _context.Invoices
                    .Include(i => i.Voucher)
                    .FirstOrDefaultAsync(i => i.Id == invoiceId);
                if (invoice == null)
                    return false;

                if (invoice.Status == "Paid")
                    throw new Exception("Cannot delete paid invoice");

                _context.Invoices.Remove(invoice);
                await _context.SaveChangesAsync();
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error deleting invoice: {ex.Message}");
                throw;
            }
        }

        public async Task<InvoiceDetailDto> ApplyVoucherToInvoiceAsync(int invoiceId, string voucherCode, string currentUserId)
        {
            IDbContextTransaction? transaction = null;

            try
            {
                if (string.IsNullOrWhiteSpace(voucherCode))
                    throw new ArgumentException("Voucher code is required.");

                if (!int.TryParse(currentUserId, out var userId))
                    throw new UnauthorizedAccessException("Current user is invalid.");

                var resident = await _context.Residents
                    .FirstOrDefaultAsync(r => r.UserId == userId && r.IsActive);

                if (resident == null)
                    throw new UnauthorizedAccessException("Resident profile not found.");

                transaction = await _context.Database.BeginTransactionAsync(IsolationLevel.Serializable);

                var invoice = await _context.Invoices
                    .Include(i => i.Resident)
                    .Include(i => i.Room)
                    .Include(i => i.Voucher)
                    .FirstOrDefaultAsync(i => i.Id == invoiceId);

                if (invoice == null)
                    throw new KeyNotFoundException("Invoice not found.");

                if (!string.Equals(invoice.Status, "Pending", StringComparison.OrdinalIgnoreCase))
                    throw new InvalidOperationException("Voucher can only be applied to pending invoices.");

                if (invoice.ResidentId != resident.Id)
                    throw new UnauthorizedAccessException("You are not allowed to apply a voucher to this invoice.");

                if (invoice.VoucherId.HasValue)
                    throw new InvalidOperationException("A voucher has already been applied to this invoice.");

                var normalizedVoucherCode = NormalizeVoucherCode(voucherCode);
                var voucher = await _context.Vouchers.FirstOrDefaultAsync(v => v.Code == normalizedVoucherCode);

                if (voucher == null)
                    throw new KeyNotFoundException("Voucher not found.");

                ValidateVoucherForInvoice(voucher, invoice.Amount);

                var discountAmount = CalculateDiscountAmount(invoice.Amount, voucher);

                invoice.VoucherId = voucher.Id;
                invoice.DiscountAmount = discountAmount;
                invoice.TotalAmount = Math.Max(0, invoice.Amount - discountAmount);
                invoice.PayOSOrderId = null;
                invoice.CheckoutUrl = null;
                voucher.UsedCount++;

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return MapToInvoiceDetailDto(invoice);
            }
            catch (DbUpdateException ex)
            {
                if (transaction != null)
                {
                    await transaction.RollbackAsync();
                }

                _logger.LogWarning(ex, "Race condition detected while applying voucher to invoice {InvoiceId}", invoiceId);
                throw new InvalidOperationException("Voucher is no longer available. Please refresh and try again.");
            }
            catch (Exception ex)
            {
                if (transaction != null)
                {
                    await transaction.RollbackAsync();
                }

                _logger.LogError(ex, "Error applying voucher {VoucherCode} to invoice {InvoiceId}", voucherCode, invoiceId);
                throw;
            }
            finally
            {
                if (transaction != null)
                {
                    await transaction.DisposeAsync();
                }
            }
        }

        // ==================== PayOS Payment ====================

        public async Task<PaymentResponseDto> CreatePaymentLinkAsync(int invoiceId, string? returnUrl, string? cancelUrl)
        {
            try
            {
                var invoice = await _context.Invoices
                    .Include(i => i.Resident)
                    .Include(i => i.Voucher)
                    .FirstOrDefaultAsync(i => i.Id == invoiceId);

                if (invoice == null)
                    throw new Exception("Invoice not found");

                if (invoice.Status == "Paid")
                    throw new Exception("Invoice is already paid");

                return await CreatePaymentLinkForInvoiceAsync(
                    invoice,
                    returnUrl,
                    cancelUrl,
                    DateTime.UtcNow.AddMinutes(6));
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error creating payment link: {ex.Message}");
                return new PaymentResponseDto
                {
                    Success = false,
                    Message = $"Error: {ex.Message}",
                    CheckoutUrl = null,
                    OrderCode = null
                };
            }
        }

        public async Task<PaymentResponseDto> CreateRoomBookingPaymentLinkAsync(int roomId, int residentId, CreateRoomPaymentLinkDto dto)
        {
            IDbContextTransaction? transaction = null;

            try
            {
                var expectedCheckIn = NormalizeUtcDate(dto.ExpectedCheckInDate);
                var expectedCheckOut = NormalizeUtcDate(dto.ExpectedCheckOutDate);

                if (expectedCheckOut <= expectedCheckIn)
                    throw new InvalidOperationException("Check-out date must be greater than check-in date.");

                if (dto.NumberOfResidents <= 0)
                    throw new InvalidOperationException("Number of residents must be greater than 0.");

                transaction = await _context.Database.BeginTransactionAsync(IsolationLevel.Serializable);

                var resident = await _context.Residents
                    .FirstOrDefaultAsync(r => r.Id == residentId && r.IsActive);

                if (resident == null)
                    throw new InvalidOperationException("Resident not found.");

                var room = await _context.Rooms
                    .FromSqlInterpolated($"SELECT * FROM \"Rooms\" WHERE \"Id\" = {roomId} FOR UPDATE")
                    .FirstOrDefaultAsync();

                if (room == null)
                    throw new InvalidOperationException("Room not found.");

                var now = DateTime.UtcNow;
                var isRoomAvailable = room.IsActive &&
                                      (room.Status == "Available" ||
                                       (room.Status == "OnHold" && room.HoldExpiresAt.HasValue && room.HoldExpiresAt.Value <= now));

                if (!isRoomAvailable)
                    throw new InvalidOperationException("Room is currently held by another user");

                var activeBookingStatuses = new[] { "PendingCheckIn", "CheckedIn", "PendingCheckOut" };
                var roomAlreadyBooked = await _context.CheckInRecords
                    .AnyAsync(r => r.RoomId == roomId
                                   && activeBookingStatuses.Contains(r.Status)
                                   && expectedCheckIn < r.ExpectedCheckOutDate
                                   && expectedCheckOut > r.ExpectedCheckInDate);

                if (roomAlreadyBooked)
                    throw new InvalidOperationException("Room is currently held by another user");

                var holdExpiresAt = now.AddMinutes(6);
                room.Status = "OnHold";
                room.HoldExpiresAt = holdExpiresAt;

                var nights = (expectedCheckOut - expectedCheckIn).Days;
                var amount = room.MonthlyRent * nights;

                var invoice = new Invoice
                {
                    ResidentId = residentId,
                    Resident = resident,
                    RoomId = roomId,
                    Amount = amount,
                    DiscountAmount = 0,
                    TotalAmount = amount,
                    Description = $"Room booking hold for room {room.RoomNumber} ({expectedCheckIn:yyyy-MM-dd} to {expectedCheckOut:yyyy-MM-dd})",
                    Status = "Pending",
                    CreatedAt = now,
                    BookingCheckInDate = expectedCheckIn,
                    BookingCheckOutDate = expectedCheckOut,
                    BookingNumberOfResidents = dto.NumberOfResidents
                };

                _context.Invoices.Add(invoice);
                await _context.SaveChangesAsync();

                var paymentLink = await CreatePaymentLinkForInvoiceAsync(
                    invoice,
                    dto.ReturnUrl,
                    dto.CancelUrl,
                    holdExpiresAt);

                if (!paymentLink.Success)
                    throw new InvalidOperationException(paymentLink.Message);

                await transaction.CommitAsync();
                return paymentLink;
            }
            catch (InvalidOperationException)
            {
                if (transaction != null)
                {
                    await transaction.RollbackAsync();
                }

                throw;
            }
            catch (Exception ex)
            {
                if (transaction != null)
                {
                    await transaction.RollbackAsync();
                }

                _logger.LogError(ex, "Error creating room booking payment link for room {RoomId} and resident {ResidentId}", roomId, residentId);
                throw;
            }
            finally
            {
                if (transaction != null)
                {
                    await transaction.DisposeAsync();
                }
            }
        }

        private async Task<PaymentResponseDto> CreatePaymentLinkForInvoiceAsync(
            Invoice invoice,
            string? returnUrl,
            string? cancelUrl,
            DateTime expiresAtUtc)
        {
            // Generate unique order code
            long orderCode = (DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() * 1000L) + (invoice.Id % 1000);
            invoice.PayOSOrderId = orderCode;

            // Prepare return URLs
            string finalReturnUrl = returnUrl ?? $"{_frontendUrl}/resident/invoices?success=true";
            string finalCancelUrl = cancelUrl ?? $"{_frontendUrl}/resident/invoices?cancel=true";

            if (!_payOSEnabled)
                throw new Exception("PayOS chưa được cấu hình. Vui lòng cấu hình PayOS ClientId/ApiKey/ChecksumKey để tạo QR thanh toán thật.");

            await EnsureWebhookConfiguredAsync();

            int amount = decimal.ToInt32(decimal.Round(invoice.TotalAmount, MidpointRounding.AwayFromZero));
            if (amount <= 0)
                throw new Exception("Invoice amount must be greater than 0.");

            string payOSDescription = BuildPayOSDescription(invoice.Id);
            var paymentRequest = new PayOSCreatePaymentRequestDto
            {
                OrderCode = orderCode,
                Amount = amount,
                Description = payOSDescription,
                BuyerName = invoice.Resident?.FullName,
                BuyerEmail = invoice.Resident?.Email,
                BuyerPhone = invoice.Resident?.Phone,
                Items = new List<PayOSItemDto>
                {
                    new()
                    {
                        Name = BuildItemName(invoice.Description),
                        Quantity = 1,
                        Price = amount
                    }
                },
                ReturnUrl = finalReturnUrl,
                CancelUrl = finalCancelUrl,
                ExpiredAt = new DateTimeOffset(expiresAtUtc).ToUnixTimeSeconds(),
                Signature = CreatePaymentRequestSignature(amount, finalCancelUrl, payOSDescription, orderCode, finalReturnUrl)
            };

            var client = CreatePayOSClient();
            using var response = await client.PostAsJsonAsync("/v2/payment-requests", paymentRequest, _jsonOptions);
            var payload = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
                throw new Exception($"PayOS create link failed: {payload}");

            var payOSResponse = JsonSerializer.Deserialize<PayOSCreatePaymentApiResponseDto>(payload, _jsonOptions);
            if (payOSResponse?.Code != "00" || payOSResponse.Data == null)
                throw new Exception(payOSResponse?.Desc ?? "PayOS did not return a payment link.");

            invoice.CheckoutUrl = payOSResponse.Data.CheckoutUrl;
            await _context.SaveChangesAsync();

            return new PaymentResponseDto
            {
                Success = true,
                Message = "Payment link created successfully",
                CheckoutUrl = payOSResponse.Data.CheckoutUrl,
                OrderCode = payOSResponse.Data.OrderCode,
                InvoiceId = invoice.Id,
                Status = NormalizePayOSStatus(payOSResponse.Data.Status),
                QrCodeDataUrl = GenerateQrCodeDataUrl(payOSResponse.Data.QrCode)
            };
        }

        public async Task<PaymentStatusDto?> GetPaymentStatusAsync(int invoiceId)
        {
            try
            {
                var invoice = await _context.Invoices.FirstOrDefaultAsync(i => i.Id == invoiceId);
                if (invoice == null)
                    return null;

                if (_payOSEnabled && invoice.PayOSOrderId.HasValue)
                {
                    var paymentInfo = await GetPayOSPaymentInfoAsync(invoice.PayOSOrderId.Value);
                    if (paymentInfo?.Data != null)
                    {
                        await ApplyPayOSStatusToInvoiceAsync(invoice, paymentInfo.Data.Status);
                    }
                }

                return new PaymentStatusDto
                {
                    InvoiceId = invoice.Id,
                    PayOSOrderId = invoice.PayOSOrderId ?? 0,
                    Status = invoice.Status,
                    Amount = invoice.TotalAmount,
                    OriginalAmount = invoice.Amount,
                    DiscountAmount = invoice.DiscountAmount,
                    TotalAmount = invoice.TotalAmount,
                    VoucherId = invoice.VoucherId,
                    VoucherCode = invoice.Voucher?.Code,
                    Description = invoice.Description,
                    CreatedAt = invoice.CreatedAt,
                    PaidAt = invoice.PaidAt,
                    CheckoutUrl = invoice.CheckoutUrl,
                    QrCodeDataUrl = null
                };
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting payment status: {ex.Message}");
                throw;
            }
        }

        private string? GenerateQrCodeDataUrl(string? content)
        {
            if (string.IsNullOrWhiteSpace(content))
            {
                return null;
            }

            using var qrGenerator = new QRCodeGenerator();
            using var qrCodeData = qrGenerator.CreateQrCode(content, QRCodeGenerator.ECCLevel.Q);
            var qrCode = new PngByteQRCode(qrCodeData);
            var qrBytes = qrCode.GetGraphic(20);
            return $"data:image/png;base64,{Convert.ToBase64String(qrBytes)}";
        }

        private HttpClient CreatePayOSClient()
        {
            var client = _httpClientFactory.CreateClient();
            client.BaseAddress = new Uri(_payOSBaseUrl);
            client.DefaultRequestHeaders.Accept.Clear();
            client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
            client.DefaultRequestHeaders.Remove("x-client-id");
            client.DefaultRequestHeaders.Remove("x-api-key");
            client.DefaultRequestHeaders.Add("x-client-id", _payOSClientId);
            client.DefaultRequestHeaders.Add("x-api-key", _payOSApiKey);
            return client;
        }

        private async Task EnsureWebhookConfiguredAsync()
        {
            var webhookUrl = BuildWebhookUrl();
            if (!_payOSEnabled || string.IsNullOrWhiteSpace(webhookUrl))
                return;

            try
            {
                var client = CreatePayOSClient();
                using var response = await client.PostAsJsonAsync("/confirm-webhook", new ConfirmWebhookRequestDto
                {
                    WebhookUrl = webhookUrl
                }, _jsonOptions);

                if (!response.IsSuccessStatusCode)
                {
                    var body = await response.Content.ReadAsStringAsync();
                    _logger.LogWarning("PayOS webhook confirmation failed: {body}", body);
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning("Unable to confirm PayOS webhook automatically: {message}", ex.Message);
            }
        }

        private string? BuildWebhookUrl()
        {
            var configuredUrl = !string.IsNullOrWhiteSpace(_payOSWebhookUrl)
                ? _payOSWebhookUrl
                : string.IsNullOrWhiteSpace(_publicApiUrl)
                    ? null
                    : $"{_publicApiUrl.TrimEnd('/')}/api/Payment/payos-webhook";

            if (string.IsNullOrWhiteSpace(configuredUrl))
                return null;

            if (Uri.TryCreate(configuredUrl, UriKind.Absolute, out var uri) &&
                (string.Equals(uri.Host, "localhost", StringComparison.OrdinalIgnoreCase) || uri.Host == "127.0.0.1"))
            {
                _logger.LogWarning("PayOS webhook URL {url} is local-only. Configure PublicApiUrl or PayOS:WebhookUrl with a public HTTPS URL to receive webhook callbacks.", configuredUrl);
                return null;
            }

            return configuredUrl;
        }

        private string BuildPayOSDescription(int invoiceId)
        {
            return $"INV{invoiceId}";
        }

        private string BuildItemName(string description)
        {
            if (string.IsNullOrWhiteSpace(description))
                return "SORMS Invoice";

            return description.Length <= 25 ? description : description[..25];
        }

        private string CreatePaymentRequestSignature(int amount, string cancelUrl, string description, long orderCode, string returnUrl)
        {
            var payload = new SortedDictionary<string, string>(StringComparer.Ordinal)
            {
                ["amount"] = amount.ToString(),
                ["cancelUrl"] = cancelUrl,
                ["description"] = description,
                ["orderCode"] = orderCode.ToString(),
                ["returnUrl"] = returnUrl
            };

            return ComputeSignature(payload);
        }

        private bool IsValidWebhookSignature(PaymentWebhookDto webhookData)
        {
            if (webhookData.Data == null || string.IsNullOrWhiteSpace(webhookData.Signature))
                return false;

            var payload = new SortedDictionary<string, string>(StringComparer.Ordinal)
            {
                ["accountNumber"] = webhookData.Data.AccountNumber ?? string.Empty,
                ["amount"] = webhookData.Data.Amount.ToString(),
                ["code"] = webhookData.Data.Code ?? string.Empty,
                ["counterAccountBankId"] = webhookData.Data.CounterAccountBankId ?? string.Empty,
                ["counterAccountBankName"] = webhookData.Data.CounterAccountBankName ?? string.Empty,
                ["counterAccountName"] = webhookData.Data.CounterAccountName ?? string.Empty,
                ["counterAccountNumber"] = webhookData.Data.CounterAccountNumber ?? string.Empty,
                ["currency"] = webhookData.Data.Currency ?? string.Empty,
                ["desc"] = webhookData.Data.Desc ?? string.Empty,
                ["description"] = webhookData.Data.Description ?? string.Empty,
                ["orderCode"] = webhookData.Data.OrderCode.ToString(),
                ["paymentLinkId"] = webhookData.Data.PaymentLinkId ?? string.Empty,
                ["reference"] = webhookData.Data.Reference ?? string.Empty,
                ["transactionDateTime"] = webhookData.Data.TransactionDateTime ?? string.Empty,
                ["virtualAccountName"] = webhookData.Data.VirtualAccountName ?? string.Empty,
                ["virtualAccountNumber"] = webhookData.Data.VirtualAccountNumber ?? string.Empty
            };

            var computedSignature = ComputeSignature(payload);
            return string.Equals(computedSignature, webhookData.Signature, StringComparison.OrdinalIgnoreCase);
        }

        private string ComputeSignature(SortedDictionary<string, string> payload)
        {
            var query = string.Join("&", payload.Select(entry => $"{entry.Key}={entry.Value ?? string.Empty}"));
            using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(_payOSChecksumKey ?? string.Empty));
            var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(query));
            return Convert.ToHexString(hash).ToLowerInvariant();
        }

        private async Task<PayOSPaymentInfoApiResponseDto?> GetPayOSPaymentInfoAsync(long orderCode)
        {
            var client = CreatePayOSClient();
            using var response = await client.GetAsync($"/v2/payment-requests/{orderCode}");
            var body = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("PayOS payment info request failed for order {orderCode}: {body}", orderCode, body);
                return null;
            }

            return JsonSerializer.Deserialize<PayOSPaymentInfoApiResponseDto>(body, _jsonOptions);
        }

        private async Task ApplyPayOSStatusToInvoiceAsync(Invoice invoice, string? payOSStatus)
        {
            var normalizedStatus = NormalizePayOSStatus(payOSStatus);
            var hasChanges = false;

            if (normalizedStatus == "Paid" && !string.Equals(invoice.Status, "Paid", StringComparison.OrdinalIgnoreCase))
            {
                invoice.Status = "Paid";
                invoice.PaidAt = DateTime.UtcNow;
                hasChanges = true;
            }
            else if (normalizedStatus == "Cancelled" && !string.Equals(invoice.Status, "Cancelled", StringComparison.OrdinalIgnoreCase))
            {
                invoice.Status = "Cancelled";
                invoice.PaidAt = null;
                hasChanges = true;
            }
            else if ((normalizedStatus == "Pending" || normalizedStatus == "Processing") && string.Equals(invoice.Status, "Cancelled", StringComparison.OrdinalIgnoreCase))
            {
                invoice.Status = "Pending";
                hasChanges = true;
            }

            if (hasChanges)
            {
                await _context.SaveChangesAsync();
            }
        }

        private async Task SyncInvoiceStatusesAsync(IEnumerable<Invoice> invoices)
        {
            foreach (var invoice in invoices)
            {
                await SyncInvoiceStatusAsync(invoice);
            }
        }

        private async Task SyncInvoiceStatusAsync(Invoice invoice)
        {
            if (!_payOSEnabled || !invoice.PayOSOrderId.HasValue)
            {
                return;
            }

            var paymentInfo = await GetPayOSPaymentInfoAsync(invoice.PayOSOrderId.Value);
            if (paymentInfo?.Data == null)
            {
                return;
            }

            await ApplyPayOSStatusToInvoiceAsync(invoice, paymentInfo.Data.Status);
        }

        private string NormalizePayOSStatus(string? payOSStatus)
        {
            return payOSStatus?.ToUpperInvariant() switch
            {
                "PAID" => "Paid",
                "CANCELLED" => "Cancelled",
                "EXPIRED" => "Cancelled",
                "PROCESSING" => "Processing",
                _ => "Pending"
            };
        }

        public async Task<bool> VerifyPaymentAsync(long orderCode)
        {
            try
            {
                var invoice = await _context.Invoices
                    .FirstOrDefaultAsync(i => i.PayOSOrderId == orderCode);

                if (!_payOSEnabled)
                {
                    _logger.LogWarning("VerifyPayment was called but PayOS is not configured.");
                    return false;
                }

                if (invoice == null)
                    return false;

                var paymentInfo = await GetPayOSPaymentInfoAsync(orderCode);
                if (paymentInfo?.Data == null)
                    return string.Equals(invoice.Status, "Paid", StringComparison.OrdinalIgnoreCase);

                await ApplyPayOSStatusToInvoiceAsync(invoice, paymentInfo.Data.Status);
                return string.Equals(invoice.Status, "Paid", StringComparison.OrdinalIgnoreCase);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error verifying payment: {ex.Message}");
                throw;
            }
        }

        public async Task<bool> HandlePayOSWebhookAsync(PaymentWebhookDto webhookData)
        {
            IDbContextTransaction? transaction = null;

            try
            {
                if (webhookData.Data == null)
                    return false;

                if (_payOSEnabled && !IsValidWebhookSignature(webhookData))
                {
                    _logger.LogWarning("Rejected PayOS webhook because signature validation failed for order {orderCode}", webhookData.Data.OrderCode);
                    return false;
                }

                transaction = await _context.Database.BeginTransactionAsync(IsolationLevel.Serializable);

                var invoice = await _context.Invoices
                    .FromSqlInterpolated($"SELECT * FROM \"Invoices\" WHERE \"PayOSOrderId\" = {webhookData.Data.OrderCode} FOR UPDATE")
                    .FirstOrDefaultAsync();

                if (invoice == null)
                {
                    _logger.LogInformation("PayOS webhook acknowledged for unknown order {orderCode}. This can happen during webhook confirmation.", webhookData.Data.OrderCode);
                    await transaction.CommitAsync();
                    return true;
                }

                if (webhookData.Success && webhookData.Code == "00" && webhookData.Data.Code == "00")
                {
                    if (!string.Equals(invoice.Status, "Paid", StringComparison.OrdinalIgnoreCase))
                    {
                        invoice.Status = "Paid";
                        invoice.PaidAt = DateTime.UtcNow;

                        if (invoice.RoomId.HasValue)
                        {
                            var room = await _context.Rooms
                                .FromSqlInterpolated($"SELECT * FROM \"Rooms\" WHERE \"Id\" = {invoice.RoomId.Value} FOR UPDATE")
                                .FirstOrDefaultAsync();
                            if (room != null)
                            {
                                room.Status = "Occupied";
                                room.HoldExpiresAt = null;
                            }
                        }

                        var existingCheckIn = await _context.CheckInRecords
                            .FirstOrDefaultAsync(c => c.ResidentId == invoice.ResidentId
                                                   && c.RoomId == invoice.RoomId
                                                   && c.Status == "PendingCheckIn"
                                                   && c.RequestType == "CheckIn"
                                                   && c.RequestTime >= invoice.CreatedAt.AddMinutes(-1));

                        if (existingCheckIn == null && invoice.RoomId.HasValue)
                        {
                            var checkInRecord = new CheckInRecord
                            {
                                ResidentId = invoice.ResidentId,
                                RoomId = invoice.RoomId.Value,
                                RequestTime = DateTime.UtcNow,
                                ExpectedCheckInDate = invoice.BookingCheckInDate ?? NormalizeUtcDate(DateTime.UtcNow),
                                ExpectedCheckOutDate = invoice.BookingCheckOutDate ?? NormalizeUtcDate(DateTime.UtcNow).AddDays(1),
                                NumberOfResidents = Math.Max(1, invoice.BookingNumberOfResidents ?? 1),
                                Status = "PendingCheckIn",
                                RequestType = "CheckIn"
                            };

                            _context.CheckInRecords.Add(checkInRecord);
                        }

                        await _context.SaveChangesAsync();
                    }
                }

                await transaction.CommitAsync();

                return true;
            }
            catch (Exception ex)
            {
                if (transaction != null)
                {
                    await transaction.RollbackAsync();
                }

                _logger.LogError($"Error handling PayOS webhook: {ex.Message}");
                throw;
            }
            finally
            {
                if (transaction != null)
                {
                    await transaction.DisposeAsync();
                }
            }
        }

        public async Task<bool> MarkInvoiceAsPaidAsync(int invoiceId)
        {
            try
            {
                var invoice = await _context.Invoices.FirstOrDefaultAsync(i => i.Id == invoiceId);
                if (invoice == null)
                    return false;

                invoice.Status = "Paid";
                invoice.PaidAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                _logger.LogInformation($"Invoice {invoiceId} marked as paid");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error marking invoice as paid: {ex.Message}");
                throw;
            }
        }

        // ==================== Room Pricing ====================

        public async Task<RoomPricingDto?> GetRoomPricingAsync(int roomId)
        {
            try
            {
                var pricing = await _context.Set<RoomPricingConfig>()
                    .Include(p => p.Room)
                    .Where(p => p.RoomId == roomId && p.IsActive)
                    .OrderByDescending(p => p.EffectiveFrom)
                    .FirstOrDefaultAsync();

                if (pricing == null)
                    return null;

                return MapToRoomPricingDto(pricing);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting room pricing: {ex.Message}");
                throw;
            }
        }

        public async Task<RoomPricingDto> CreateRoomPricingAsync(int roomId, UpdateRoomPricingDto pricingDto, int staffId)
        {
            try
            {
                var room = await _context.Rooms.FirstOrDefaultAsync(r => r.Id == roomId);
                if (room == null)
                    throw new Exception("Room not found");

                // Deactivate previous pricing
                var previousPricing = await _context.Set<RoomPricingConfig>()
                    .Where(p => p.RoomId == roomId && p.IsActive)
                    .ToListAsync();

                foreach (var pricing in previousPricing)
                {
                    pricing.IsActive = false;
                    pricing.EffectiveTo = DateTime.UtcNow;
                }

                var newPricing = new RoomPricingConfig
                {
                    RoomId = roomId,
                    MonthlyRent = pricingDto.MonthlyRent,
                    ElectricityRate = pricingDto.ElectricityRate,
                    WaterRate = pricingDto.WaterRate,
                    InternetFee = pricingDto.InternetFee,
                    MaintenanceFee = pricingDto.MaintenanceFee,
                    EffectiveFrom = DateTime.UtcNow,
                    IsActive = true,
                    UpdatedByStaffId = staffId,
                    Notes = pricingDto.Notes,
                    CreatedAt = DateTime.UtcNow
                };

                _context.Set<RoomPricingConfig>().Add(newPricing);
                await _context.SaveChangesAsync();

                return await GetRoomPricingAsync(roomId)
                    ?? throw new Exception("Created room pricing could not be reloaded.");
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error creating room pricing: {ex.Message}");
                throw;
            }
        }

        public async Task<RoomPricingDto> UpdateRoomPricingAsync(int roomId, UpdateRoomPricingDto pricingDto, int staffId)
        {
            try
            {
                return await CreateRoomPricingAsync(roomId, pricingDto, staffId);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error updating room pricing: {ex.Message}");
                throw;
            }
        }

        public async Task<List<RoomPricingDto>> GetAllRoomPricingsAsync()
        {
            try
            {
                var pricings = await _context.Set<RoomPricingConfig>()
                    .Include(p => p.Room)
                    .Where(p => p.IsActive)
                    .OrderBy(p => p.Room != null ? p.Room.RoomNumber : string.Empty)
                    .ToListAsync();

                return pricings.Select(MapToRoomPricingDto).ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting all room pricings: {ex.Message}");
                throw;
            }
        }

        public async Task<bool> DeactivatePricingAsync(int pricingId)
        {
            try
            {
                var pricing = await _context.Set<RoomPricingConfig>()
                    .FirstOrDefaultAsync(p => p.Id == pricingId);

                if (pricing == null)
                    return false;

                pricing.IsActive = false;
                pricing.EffectiveTo = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error deactivating pricing: {ex.Message}");
                throw;
            }
        }

        // ==================== Helper Methods ====================

        private InvoiceDetailDto MapToInvoiceDetailDto(Invoice invoice)
        {
            return new InvoiceDetailDto
            {
                Id = invoice.Id,
                ResidentId = invoice.ResidentId,
                ResidentName = invoice.Resident?.FullName ?? "Unknown",
                RoomId = invoice.RoomId,
                RoomNumber = invoice.Room?.RoomNumber ?? "N/A",
                Amount = invoice.TotalAmount,
                OriginalAmount = invoice.Amount,
                DiscountAmount = invoice.DiscountAmount,
                TotalAmount = invoice.TotalAmount,
                VoucherId = invoice.VoucherId,
                VoucherCode = invoice.Voucher?.Code,
                Description = invoice.Description,
                Status = invoice.Status,
                CheckoutUrl = invoice.CheckoutUrl,
                CreatedAt = invoice.CreatedAt,
                PaidAt = invoice.PaidAt,
                PayOSOrderId = invoice.PayOSOrderId,
                BookingCheckInDate = invoice.BookingCheckInDate,
                BookingCheckOutDate = invoice.BookingCheckOutDate,
                BookingNumberOfResidents = invoice.BookingNumberOfResidents
            };
        }

        private static string NormalizeVoucherCode(string voucherCode)
        {
            return voucherCode.Trim().ToUpperInvariant();
        }

        private static void ValidateVoucherForInvoice(Voucher voucher, decimal originalAmount)
        {
            var now = DateTime.UtcNow;

            if (!voucher.IsActive)
                throw new InvalidOperationException("Voucher is inactive.");

            if (now < voucher.StartDate || now > voucher.EndDate)
                throw new InvalidOperationException("Voucher is outside its valid date range.");

            if (voucher.UsedCount >= voucher.UsageLimit)
                throw new InvalidOperationException("Voucher usage limit has been reached.");

            if (originalAmount < voucher.MinInvoiceAmount)
                throw new InvalidOperationException("Invoice does not meet the voucher minimum amount requirement.");
        }

        private static decimal CalculateDiscountAmount(decimal originalAmount, Voucher voucher)
        {
            decimal discount = voucher.DiscountType switch
            {
                "FixedAmount" => voucher.Value,
                "Percentage" => (originalAmount * voucher.Value) / 100m,
                _ => throw new InvalidOperationException("Unsupported voucher discount type.")
            };

            if (voucher.MaxDiscountAmount.HasValue)
            {
                discount = Math.Min(discount, voucher.MaxDiscountAmount.Value);
            }

            return Math.Min(originalAmount, Math.Max(0, decimal.Round(discount, 2, MidpointRounding.AwayFromZero)));
        }

        private static DateTime NormalizeUtcDate(DateTime value)
        {
            return DateTime.SpecifyKind(value.Date, DateTimeKind.Utc);
        }

        private RoomPricingDto MapToRoomPricingDto(RoomPricingConfig pricing)
        {
            var totalEstimated = pricing.MonthlyRent + pricing.ElectricityRate + 
                                pricing.WaterRate + pricing.InternetFee + pricing.MaintenanceFee;

            return new RoomPricingDto
            {
                Id = pricing.Id,
                RoomId = pricing.RoomId,
                RoomNumber = pricing.Room?.RoomNumber ?? "N/A",
                MonthlyRent = pricing.MonthlyRent,
                ElectricityRate = pricing.ElectricityRate,
                WaterRate = pricing.WaterRate,
                InternetFee = pricing.InternetFee,
                MaintenanceFee = pricing.MaintenanceFee,
                TotalEstimatedCost = totalEstimated,
                EffectiveFrom = pricing.EffectiveFrom,
                EffectiveTo = pricing.EffectiveTo,
                IsActive = pricing.IsActive,
                CreatedAt = pricing.CreatedAt,
                UpdatedAt = pricing.UpdatedAt
            };
        }
    }
}
