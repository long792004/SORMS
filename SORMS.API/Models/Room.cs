using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SORMS.API.Models
{
    public class Room
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [Required, MaxLength(20)]
        public string RoomNumber { get; set; } = string.Empty;

        [Required, MaxLength(30)]
        public string Type { get; set; } = string.Empty;

        public int Floor { get; set; }

        [Column(TypeName = "numeric(10,2)")]
        public decimal MonthlyRent { get; set; }

        [Column(TypeName = "numeric(10,2)")]
        public decimal Area { get; set; }

        public int MaxCapacity { get; set; } = 1;

        [Required, MaxLength(20)]
        public string Status { get; set; } = "Available"; // "Available", "Occupied", "Maintenance"

        public DateTime? MaintenanceEndDate { get; set; }

        public string? Description { get; set; }

        public string? CurrentResident { get; set; }

        public string? ImageUrl { get; set; }

        public bool IsActive { get; set; } = true;

        public ICollection<Resident> Residents { get; set; } = new List<Resident>();
        public ICollection<CheckInRecord> CheckInRecords { get; set; } = new List<CheckInRecord>();
        public ICollection<Invoice> Invoices { get; set; } = new List<Invoice>();
    }
}
