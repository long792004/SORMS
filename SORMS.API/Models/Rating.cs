using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SORMS.API.Models
{
    public class Rating
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [Required]
        public int ResidentId { get; set; }

        [ForeignKey(nameof(ResidentId))]
        public Resident Resident { get; set; } = null!;

        public int? RoomId { get; set; }

        [ForeignKey(nameof(RoomId))]
        public Room? Room { get; set; }

        [Required]
        public int CheckInRecordId { get; set; }

        [ForeignKey(nameof(CheckInRecordId))]
        public CheckInRecord CheckInRecord { get; set; } = null!;

        [Range(1, 5)]
        public int RoomScore { get; set; }

        [Range(1, 5)]
        public int ServiceScore { get; set; }

        [MaxLength(1000)]
        public string? Comment { get; set; }

        [Required]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
