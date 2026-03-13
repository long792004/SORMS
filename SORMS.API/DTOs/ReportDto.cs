namespace SORMS.API.DTOs
{
    public class ReportDto
    {
        public int Id { get; set; }
        public string Title { get; set; }
        public string Content { get; set; }
        public DateTime GeneratedDate { get; set; }
        public string CreatedBy { get; set; }
        public int? StaffId { get; set; }
        public string Status { get; set; }
        public string? AdminFeedback { get; set; }
        public string? ReviewedBy { get; set; }
        public DateTime? ReviewedDate { get; set; }
        public DateTime LastUpdated { get; set; }
    }

    public class CreateReportDto
    {
        public string Title { get; set; }
        public string Content { get; set; }
    }

    public class UpdateReportDto
    {
        public string Title { get; set; }
        public string Content { get; set; }
    }

    public class ReviewReportDto
    {
        public string Status { get; set; } // Reviewed, Rejected
        public string AdminFeedback { get; set; }
    }
}
