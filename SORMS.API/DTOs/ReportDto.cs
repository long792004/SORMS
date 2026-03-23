namespace SORMS.API.DTOs
{
    public class ReportDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = default!;
        public string Content { get; set; } = default!;
        public DateTime GeneratedDate { get; set; }
        public string CreatedBy { get; set; } = default!;
        public int? StaffId { get; set; }
        public string Status { get; set; } = default!;
        public string? AdminFeedback { get; set; }
        public string? ReviewedBy { get; set; }
        public DateTime? ReviewedDate { get; set; }
        public DateTime LastUpdated { get; set; }
    }

    public class CreateReportDto
    {
        public string Title { get; set; } = default!;
        public string Content { get; set; } = default!;
    }

    public class UpdateReportDto
    {
        public string Title { get; set; } = default!;
        public string Content { get; set; } = default!;
    }

    public class ReviewReportDto
    {
        public string Status { get; set; } = default!; // Reviewed, Rejected
        public string AdminFeedback { get; set; } = default!;
    }
}
