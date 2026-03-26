namespace SORMS.API.DTOs
{
    public class CreatePaymentLinkDto
    {
        public int? InvoiceId { get; set; }
        public string? ReturnUrl { get; set; }
        public string? CancelUrl { get; set; }
    }

    public class CreateRoomPaymentLinkDto
    {
        public DateTime ExpectedCheckInDate { get; set; }
        public DateTime ExpectedCheckOutDate { get; set; }
        public int NumberOfResidents { get; set; } = 1;
        public string? ReturnUrl { get; set; }
        public string? CancelUrl { get; set; }
    }

    public class PaymentStatusDto
    {
        public int InvoiceId { get; set; }
        public long PayOSOrderId { get; set; }
        public string Status { get; set; } = string.Empty;
        public string PaymentMethod { get; set; } = "PayOS";
        public decimal Amount { get; set; }
        public decimal OriginalAmount { get; set; }
        public decimal DiscountAmount { get; set; }
        public decimal TotalAmount { get; set; }
        public int? VoucherId { get; set; }
        public string? VoucherCode { get; set; }
        public string Description { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime? PaidAt { get; set; }
        public string? CheckoutUrl { get; set; }
        public string? QrCodeDataUrl { get; set; }
    }

    public class PaymentResponseDto
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public string? CheckoutUrl { get; set; }
        public long? OrderCode { get; set; }
        public int? InvoiceId { get; set; }
        public string? Status { get; set; }
        public string? QrCodeDataUrl { get; set; }
    }

    public class ApplyVoucherRequestDto
    {
        public string VoucherCode { get; set; } = string.Empty;
    }

    public class PaymentWebhookDto
    {
        public string Code { get; set; } = string.Empty;
        public string Desc { get; set; } = string.Empty;
        public bool Success { get; set; }
        public PaymentWebhookDataDto? Data { get; set; }
        public string Signature { get; set; } = string.Empty;
    }

    public class PaymentWebhookDataDto
    {
        public long OrderCode { get; set; }
        public int Amount { get; set; }
        public string Description { get; set; } = string.Empty;
        public string AccountNumber { get; set; } = string.Empty;
        public string Reference { get; set; } = string.Empty;
        public string TransactionDateTime { get; set; } = string.Empty;
        public string Currency { get; set; } = string.Empty;
        public string PaymentLinkId { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;
        public string Desc { get; set; } = string.Empty;
        public string CounterAccountBankId { get; set; } = string.Empty;
        public string CounterAccountBankName { get; set; } = string.Empty;
        public string CounterAccountName { get; set; } = string.Empty;
        public string CounterAccountNumber { get; set; } = string.Empty;
        public string VirtualAccountName { get; set; } = string.Empty;
        public string VirtualAccountNumber { get; set; } = string.Empty;
    }

    public class PayOSItemDto
    {
        public string Name { get; set; } = string.Empty;
        public int Quantity { get; set; }
        public int Price { get; set; }
    }

    public class PayOSCreatePaymentRequestDto
    {
        public long OrderCode { get; set; }
        public int Amount { get; set; }
        public string Description { get; set; } = string.Empty;
        public string? BuyerName { get; set; }
        public string? BuyerEmail { get; set; }
        public string? BuyerPhone { get; set; }
        public List<PayOSItemDto> Items { get; set; } = new();
        public string CancelUrl { get; set; } = string.Empty;
        public string ReturnUrl { get; set; } = string.Empty;
        public long ExpiredAt { get; set; }
        public string Signature { get; set; } = string.Empty;
    }

    public class PayOSCreatePaymentApiResponseDto
    {
        public string Code { get; set; } = string.Empty;
        public string Desc { get; set; } = string.Empty;
        public PayOSCreatePaymentDataDto? Data { get; set; }
        public string? Signature { get; set; }
    }

    public class PayOSCreatePaymentDataDto
    {
        public string PaymentLinkId { get; set; } = string.Empty;
        public long OrderCode { get; set; }
        public int Amount { get; set; }
        public string Status { get; set; } = string.Empty;
        public string CheckoutUrl { get; set; } = string.Empty;
        public string QrCode { get; set; } = string.Empty;
    }

    public class PayOSPaymentInfoApiResponseDto
    {
        public string Code { get; set; } = string.Empty;
        public string Desc { get; set; } = string.Empty;
        public PayOSPaymentInfoDataDto? Data { get; set; }
        public string? Signature { get; set; }
    }

    public class PayOSPaymentInfoDataDto
    {
        public string Id { get; set; } = string.Empty;
        public long OrderCode { get; set; }
        public int Amount { get; set; }
        public int AmountPaid { get; set; }
        public int AmountRemaining { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime? CreatedAt { get; set; }
        public DateTime? CanceledAt { get; set; }
        public string? CancellationReason { get; set; }
    }

    public class ConfirmWebhookRequestDto
    {
        public string WebhookUrl { get; set; } = string.Empty;
    }

    public class RoomPricingDto
    {
        public int Id { get; set; }
        public int RoomId { get; set; }
        public string RoomNumber { get; set; } = string.Empty;
        public decimal MonthlyRent { get; set; }
        public decimal DailyRate
        {
            get => MonthlyRent;
            set => MonthlyRent = value;
        }
        public decimal ElectricityRate { get; set; }
        public decimal WaterRate { get; set; }
        public decimal InternetFee { get; set; }
        public decimal MaintenanceFee { get; set; }
        public decimal TotalEstimatedCost { get; set; }
        public DateTime EffectiveFrom { get; set; }
        public DateTime? EffectiveTo { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }

    public class UpdateRoomPricingDto
    {
        public decimal MonthlyRent { get; set; }
        public decimal DailyRate
        {
            get => MonthlyRent;
            set => MonthlyRent = value;
        }
        public decimal ElectricityRate { get; set; }
        public decimal WaterRate { get; set; }
        public decimal InternetFee { get; set; }
        public decimal MaintenanceFee { get; set; }
        public string? Notes { get; set; }
    }

    public class InvoiceCreateDto
    {
        public int ResidentId { get; set; }
        public int? RoomId { get; set; }
        public decimal Amount { get; set; }
        public string Description { get; set; } = string.Empty;
        public string InvoiceType { get; set; } = string.Empty; // "Rent", "Utility", "Service", "Other"
    }

    public class InvoiceDetailDto
    {
        public int Id { get; set; }
        public int ResidentId { get; set; }
        public string ResidentName { get; set; } = string.Empty;
        public int? RoomId { get; set; }
        public string RoomNumber { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public decimal OriginalAmount { get; set; }
        public decimal DiscountAmount { get; set; }
        public decimal TotalAmount { get; set; }
        public int? VoucherId { get; set; }
        public string? VoucherCode { get; set; }
        public string Description { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string PaymentMethod { get; set; } = "PayOS";
        public string? CheckoutUrl { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? ExpirationTime { get; set; }
        public DateTime? PaidAt { get; set; }
        public long? PayOSOrderId { get; set; }
        public DateTime? BookingCheckInDate { get; set; }
        public DateTime? BookingCheckOutDate { get; set; }
        public int? BookingNumberOfResidents { get; set; }
    }
}
