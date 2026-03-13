namespace SORMS.API.DTOs
{
    public class CheckOutRequestDto
    {
        public int ResidentId { get; set; }
        public string QrCodeData { get; set; }
        public string Method { get; set; }
        public DateTime CheckOutTime { get; set; } = DateTime.UtcNow;
    }

}
