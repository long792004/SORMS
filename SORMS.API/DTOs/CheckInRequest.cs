namespace SORMS.API.DTOs
{
    public class CheckInRequestDto
    {
        public int ResidentId { get; set; }
        public string QrCodeData { get; set; } = default!; // Dữ liệu từ mã QR hoặc RFID
        public string Method { get; set; } = default!; // QR, RFID, Manual
        public DateTime CheckInTime { get; set; } = DateTime.UtcNow;
    }

}
