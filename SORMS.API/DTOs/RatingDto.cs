using System.ComponentModel.DataAnnotations;

namespace SORMS.API.DTOs
{
    public class RatingDto
    {
        public int Id { get; set; }
        public int ResidentId { get; set; }
        public int? RoomId { get; set; }
        public int CheckInRecordId { get; set; }
        public int RoomScore { get; set; }
        public int ServiceScore { get; set; }
        public string? Comment { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class CreateRatingDto
    {
        [Required]
        public int CheckInRecordId { get; set; }

        [Range(1, 5)]
        public int RoomScore { get; set; }

        [Range(1, 5)]
        public int ServiceScore { get; set; }

        [MaxLength(1000)]
        public string? Comment { get; set; }
    }
}
