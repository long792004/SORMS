namespace SORMS.API.DTOs
{
    public class RoomDto
    {
        public int Id { get; set; }
        public string RoomNumber { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public string RoomType { get; set; } = string.Empty; // Alias for Type
        public int Floor { get; set; }
        public decimal MonthlyRent { get; set; }
        public decimal DailyRate
        {
            get => MonthlyRent;
            set => MonthlyRent = value;
        }
        public decimal Area { get; set; }
        public int MaxCapacity { get; set; } = 1;
        public string Status { get; set; } = "Available"; // Available, OnHold, Occupied, Maintenance
        public DateTime? HoldExpiresAt { get; set; }
        public DateTime? MaintenanceEndDate { get; set; }
        public string? CurrentResident { get; set; }
        public string? Description { get; set; }
        public string? ImageUrl { get; set; }
        public string[] ImageUrls { get; set; } = Array.Empty<string>();
        public string[] Images
        {
            get => ImageUrls;
            set => ImageUrls = value ?? Array.Empty<string>();
        }
        public string[] Amenities { get; set; } = Array.Empty<string>();
        public double AverageRating { get; set; }
        public int ReviewCount { get; set; }
        public bool IsActive { get; set; } = true;
    }
}
