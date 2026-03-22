using Microsoft.EntityFrameworkCore;
using SORMS.API.Models;

namespace SORMS.API.Data
{
    public class SormsDbContext : DbContext
    {
        public SormsDbContext(DbContextOptions<SormsDbContext> options)
            : base(options)
        {
        }

        // ===== DbSet cho các bảng =====
        public DbSet<Resident> Residents { get; set; }

        public DbSet<User> Users { get; set; }
        public DbSet<Room> Rooms { get; set; }
        public DbSet<RoomPricingConfig> RoomPricingConfigs { get; set; }
        public DbSet<ServiceRequest> ServiceRequests { get; set; }
        public DbSet<Staff> Staffs { get; set; }
        public DbSet<Notification> Notifications { get; set; }
        public DbSet<Role> Roles { get; set; }
        public DbSet<CheckInRecord> CheckInRecords { get; set; }
        public DbSet<Report> Reports { get; set; }
        public DbSet<Invoice> Invoices { get; set; }
        public DbSet<Reservation> Reservations { get; set; }
        public DbSet<ReservationGuest> ReservationGuests { get; set; }
        public DbSet<RoomInspection> RoomInspections { get; set; }
        public DbSet<Rating> Ratings { get; set; }
        public DbSet<Voucher> Vouchers { get; set; }
        public DbSet<Review> Reviews { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // ==========================
            // 🔹 Resident ↔ Room (1-n)
            // ==========================
            modelBuilder.Entity<Resident>()
                .HasOne(r => r.Room)
                .WithMany(rm => rm.Residents)
                .HasForeignKey(r => r.RoomId)
                .OnDelete(DeleteBehavior.Restrict); // Tránh cascade vòng lặp

            // ==========================
            // 🔹 Resident ↔ Billing (1-n)
            // ==========================
            modelBuilder.Entity<Invoice>()
                .HasOne(i => i.Resident)
                .WithMany(r => r.Invoices)
                .HasForeignKey(i => i.ResidentId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Invoice>()
                .HasOne(i => i.Voucher)
                .WithMany(v => v.Invoices)
                .HasForeignKey(i => i.VoucherId)
                .OnDelete(DeleteBehavior.SetNull);

            // ==========================
            // 🔹 Room ↔ RoomPricingConfig (1-n)
            // ==========================
            modelBuilder.Entity<RoomPricingConfig>()
                .HasOne(p => p.Room)
                .WithMany()
                .HasForeignKey(p => p.RoomId)
                .OnDelete(DeleteBehavior.Restrict);

            // ==========================
            // 🔹 Staff ↔ RoomPricingConfig (1-n)
            // ==========================
            modelBuilder.Entity<RoomPricingConfig>()
                .HasOne(p => p.UpdatedByStaff)
                .WithMany()
                .HasForeignKey(p => p.UpdatedByStaffId)
                .OnDelete(DeleteBehavior.SetNull);
            
            // ==========================
            // 🔹 Resident ↔ Notification (1-n)
            // ==========================
            modelBuilder.Entity<Notification>()
                .HasOne(n => n.Resident)
                .WithMany(r => r.Notifications)
                .HasForeignKey(n => n.ResidentId)
                .OnDelete(DeleteBehavior.Restrict);

            // ==========================
            // 🔹 Resident ↔ CheckInRecord (1-n)
            // ==========================
            modelBuilder.Entity<CheckInRecord>()
                .HasOne(c => c.Resident)
                .WithMany(r => r.CheckInRecords)
                .HasForeignKey(c => c.ResidentId)
                .OnDelete(DeleteBehavior.Restrict);

            // ==========================
            // 🔹 Room ↔ CheckInRecord (1-n)
            // ==========================
            modelBuilder.Entity<CheckInRecord>()
                .HasOne(c => c.Room)
                .WithMany(rm => rm.CheckInRecords)
                .HasForeignKey(c => c.RoomId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Reservation>()
                .HasOne(r => r.Resident)
                .WithMany(x => x.Reservations)
                .HasForeignKey(r => r.ResidentId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Reservation>()
                .HasOne(r => r.Room)
                .WithMany()
                .HasForeignKey(r => r.RoomId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Reservation>()
                .HasOne(r => r.Invoice)
                .WithMany()
                .HasForeignKey(r => r.InvoiceId)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<ReservationGuest>()
                .HasOne(g => g.Reservation)
                .WithMany(r => r.Guests)
                .HasForeignKey(g => g.ReservationId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<RoomInspection>()
                .HasOne(i => i.CheckInRecord)
                .WithMany()
                .HasForeignKey(i => i.CheckInRecordId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Rating>()
                .HasOne(r => r.Resident)
                .WithMany(x => x.Ratings)
                .HasForeignKey(r => r.ResidentId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Rating>()
                .HasOne(r => r.CheckInRecord)
                .WithMany()
                .HasForeignKey(r => r.CheckInRecordId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Rating>()
                .HasOne(r => r.Room)
                .WithMany()
                .HasForeignKey(r => r.RoomId)
                .OnDelete(DeleteBehavior.SetNull);

            // ==========================
            // 🔹 CheckInRecord ↔ Review (1-1)
            // ==========================
            modelBuilder.Entity<CheckInRecord>()
                .HasOne(c => c.Review)
                .WithOne(r => r.CheckIn)
                .HasForeignKey<Review>(r => r.CheckInId)
                .OnDelete(DeleteBehavior.Restrict);

            // ==========================
            // 🔹 Resident ↔ Review (1-n)
            // ==========================
            modelBuilder.Entity<Review>()
                .HasOne(r => r.Resident)
                .WithMany(res => res.Reviews)
                .HasForeignKey(r => r.ResidentId)
                .OnDelete(DeleteBehavior.Restrict);

            // ==========================
            // 🔹 Room ↔ Review (1-n)
            // ==========================
            modelBuilder.Entity<Review>()
                .HasOne(r => r.Room)
                .WithMany(room => room.Reviews)
                .HasForeignKey(r => r.RoomId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Review>()
                .Property(r => r.CreatedAt)
                .HasDefaultValueSql("NOW()");

            modelBuilder.Entity<Review>()
                .Property(r => r.IsHidden)
                .HasDefaultValue(false);

            modelBuilder.Entity<Invoice>()
                .Property(i => i.DiscountAmount)
                .HasColumnType("decimal(18,2)")
                .HasDefaultValue(0m);

            modelBuilder.Entity<Invoice>()
                .Property(i => i.TotalAmount)
                .HasColumnType("decimal(18,2)");

            modelBuilder.Entity<Voucher>()
                .HasIndex(v => v.Code)
                .IsUnique();

            modelBuilder.Entity<Voucher>()
                .Property(v => v.Code)
                .HasMaxLength(50);

            modelBuilder.Entity<Voucher>()
                .Property(v => v.Value)
                .HasColumnType("decimal(18,2)");

            modelBuilder.Entity<Voucher>()
                .Property(v => v.MinInvoiceAmount)
                .HasColumnType("decimal(18,2)")
                .HasDefaultValue(0m);

            modelBuilder.Entity<Voucher>()
                .Property(v => v.MaxDiscountAmount)
                .HasColumnType("decimal(18,2)");

            modelBuilder.Entity<Voucher>()
                .Property(v => v.IsActive)
                .HasDefaultValue(true);

            modelBuilder.Entity<Voucher>()
                .Property(v => v.CreatedAt)
                .HasDefaultValueSql("NOW()");

            modelBuilder.Entity<Room>()
                .Property(r => r.MaxCapacity)
                .HasDefaultValue(1);

            modelBuilder.Entity<Room>()
                .Property(r => r.Amenities)
                .HasColumnType("text[]")
                .HasDefaultValueSql("ARRAY[]::text[]");

            modelBuilder.Entity<CheckInRecord>()
                .Property(c => c.NumberOfResidents)
                .HasDefaultValue(1);

            // ==========================
            // 🔹 ServiceRequest ↔ Resident (1-n)
            // ==========================
            modelBuilder.Entity<ServiceRequest>()
                .HasOne(sr => sr.Resident)
                .WithMany(r => r.ServiceRequests)
                .HasForeignKey(sr => sr.ResidentId)
                .OnDelete(DeleteBehavior.Restrict);

            // ==========================
            // 🔹 User ↔ Role (1-n)
            // ==========================
            modelBuilder.Entity<User>()
                .HasOne(u => u.Role)
                .WithMany(r => r.Users)
                .HasForeignKey(u => u.RoleId)
                .OnDelete(DeleteBehavior.Restrict);

            // ==========================
            // 🔹 Optional: Seed dữ liệu mẫu
            // ==========================
            modelBuilder.Entity<Role>().HasData(
                new Role { Id = 1, Name = "Admin", Description = "System administrator" },
                new Role { Id = 2, Name = "Staff", Description = "Staff member" },
                new Role { Id = 3, Name = "Resident", Description = "Dormitory resident" },
                // Khách (Guest) có thể tự đăng ký
                new Role { Id = 4, Name = "Guest", Description = "External guest - allowed to self-register" }
            );

           
            
        }
    }
}
