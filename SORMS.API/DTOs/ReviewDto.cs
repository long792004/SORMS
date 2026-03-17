using System.ComponentModel.DataAnnotations;

namespace SORMS.API.DTOs
{
    public class CreateReviewRequest
    {
        [Required]
        public int CheckInId { get; set; }

        [Range(1, 5)]
        public int Rating { get; set; }

        [StringLength(1000)]
        public string? Comment { get; set; }
    }

    public class ReviewResponse
    {
        public int Id { get; set; }
        public string ResidentName { get; set; } = string.Empty;
        public string RoomName { get; set; } = string.Empty;
        public int Rating { get; set; }
        public string? Comment { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class RoomReviewSummaryResponse
    {
        public int TotalReviews { get; set; }
        public double AverageRating { get; set; }
        public List<ReviewResponse> Reviews { get; set; } = new();
    }
}