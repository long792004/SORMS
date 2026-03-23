namespace SORMS.API.DTOs
{
    public class CheckOutRequestDto
    {
        public int ResidentId { get; set; }
        public string QrCodeData { get; set; } = default!;
        public string Method { get; set; } = default!;
        public DateTime CheckOutTime { get; set; } = DateTime.UtcNow;
    }

}
