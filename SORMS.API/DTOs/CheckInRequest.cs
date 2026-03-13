namespace SORMS.API.DTOs
{
    public class CheckInRequestDto
    {
        public int ResidentId { get; set; }
        public string QrCodeData { get; set; } // Dữ liệu từ mã QR hoặc RFID
        public string Method { get; set; } // QR, RFID, Manual
        public DateTime CheckInTime { get; set; } = DateTime.UtcNow;
    }

}
