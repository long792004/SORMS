using SORMS.API.DTOs;
using System.Threading.Tasks;

namespace SORMS.API.Interfaces
{
    public interface IPaymentService
    {
        // Invoice Management
        Task<InvoiceDetailDto?> GetInvoiceByIdAsync(int invoiceId);
        Task<List<InvoiceDetailDto>> GetResidentInvoicesAsync(int residentId);
        Task<List<InvoiceDetailDto>> GetAllInvoicesAsync(int pageNumber = 1, int pageSize = 10);
        Task<InvoiceDetailDto> CreateInvoiceAsync(InvoiceCreateDto invoiceDto, int createdByStaffId);
        Task<InvoiceDetailDto> ApplyVoucherToInvoiceAsync(int invoiceId, string voucherCode, string currentUserId);
        Task<bool> DeleteInvoiceAsync(int invoiceId);

        // PayOS Payment
        Task<PaymentResponseDto> CreatePaymentLinkAsync(int invoiceId, string? returnUrl, string? cancelUrl);
        Task<InvoiceDetailDto> RequestHotelPaymentAsync(int invoiceId, string currentUserId);
        Task<PaymentResponseDto> CreateRoomBookingPaymentLinkAsync(int roomId, int residentId, CreateRoomPaymentLinkDto dto);
        Task<PaymentStatusDto?> GetPaymentStatusAsync(int invoiceId);
        Task<bool> VerifyPaymentAsync(long orderCode);
        Task<bool> HandlePayOSWebhookAsync(PaymentWebhookDto webhookData);
        Task<bool> MarkInvoiceAsPaidAsync(int invoiceId);

        // Room Pricing
        Task<RoomPricingDto?> GetRoomPricingAsync(int roomId);
        Task<RoomPricingDto> CreateRoomPricingAsync(int roomId, UpdateRoomPricingDto pricingDto, int staffId);
        Task<RoomPricingDto> UpdateRoomPricingAsync(int roomId, UpdateRoomPricingDto pricingDto, int staffId);
        Task<List<RoomPricingDto>> GetAllRoomPricingsAsync();
        Task<bool> DeactivatePricingAsync(int pricingId);
    }
}
