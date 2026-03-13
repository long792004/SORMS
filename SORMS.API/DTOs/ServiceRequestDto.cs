namespace SORMS.API.DTOs
{
    public class ServiceRequestDto
    {
        public int Id { get; set; }
        public string Title { get; set; }
        public string ServiceType { get; set; }
        public string Description { get; set; }
        public DateTime RequestDate { get; set; }
        public string Status { get; set; }
        public int ResidentId { get; set; }
        public string? ResidentName { get; set; }
        public string? StaffFeedback { get; set; }
        public string? ReviewedBy { get; set; }
        public DateTime? ReviewedDate { get; set; }
        public DateTime? CompletedDate { get; set; }
        public DateTime LastUpdated { get; set; }
        public string Priority { get; set; }
    }

    public class CreateServiceRequestDto
    {
        public string Title { get; set; }
        public string ServiceType { get; set; }
        public string Description { get; set; }
        public string Priority { get; set; } = "Normal";
    }

    public class UpdateServiceRequestDto
    {
        public string Title { get; set; }
        public string ServiceType { get; set; }
        public string Description { get; set; }
        public string Priority { get; set; }
    }

    public class ReviewServiceRequestDto
    {
        public string Status { get; set; } // Approved, InProgress, Completed, Rejected
        public string StaffFeedback { get; set; }
    }
}
