using Microsoft.EntityFrameworkCore;
using SORMS.API.Data;
using SORMS.API.DTOs;
using SORMS.API.Interfaces;
using SORMS.API.Models;

namespace SORMS.API.Services
{
    public class ReservationService : IReservationService
    {
        private readonly SormsDbContext _context;
        private readonly IPaymentService _paymentService;

        public ReservationService(SormsDbContext context, IPaymentService paymentService)
        {
            _context = context;
            _paymentService = paymentService;
        }

        public async Task<ReservationDto> CreateReservationAsync(int userId, CreateReservationDto dto)
        {
            var resident = await _context.Residents.FirstOrDefaultAsync(r => r.UserId == userId && r.IsActive);
            if (resident == null)
                throw new Exception("Không tìm thấy thông tin cư dân");

            var checkInDate = DateTime.SpecifyKind(dto.CheckInDate.Date, DateTimeKind.Utc);
            var checkOutDate = DateTime.SpecifyKind(dto.CheckOutDate.Date, DateTimeKind.Utc);
            var nights = (checkOutDate - checkInDate).Days;

            if (checkOutDate <= checkInDate)
                throw new Exception("Check-out phải lớn hơn Check-in.");

            if (dto.Guests == null || dto.Guests.Count == 0)
                throw new Exception("Danh sách khách ở là bắt buộc.");

            if (dto.NumberOfGuests != dto.Guests.Count)
                throw new Exception("Số lượng khách không khớp với danh sách khách ở.");

            var room = await _context.Rooms.FirstOrDefaultAsync(r => r.Id == dto.RoomId && r.IsActive);
            if (room == null)
                throw new Exception("Phòng không tồn tại.");

            var maxCapacity = room.MaxCapacity > 0 ? room.MaxCapacity : 1;
            if (dto.NumberOfGuests > maxCapacity)
                throw new Exception($"Số khách không được vượt quá sức chứa phòng ({maxCapacity}).");

            foreach (var guest in dto.Guests)
            {
                if (string.IsNullOrWhiteSpace(guest.FullName) || string.IsNullOrWhiteSpace(guest.IdentityNumber) || string.IsNullOrWhiteSpace(guest.Phone))
                    throw new Exception("Mỗi khách phải có đầy đủ Họ tên, CCCD và SĐT.");
            }

            var duplicateIdentity = dto.Guests
                .GroupBy(g => g.IdentityNumber.Trim())
                .Any(g => g.Count() > 1);
            if (duplicateIdentity)
                throw new Exception("Danh sách khách có CCCD bị trùng.");

            var overlapStatuses = new[] { "Held", "Confirmed", "CheckedIn" };

            var hasReservationOverlap = await _context.Reservations
                .AnyAsync(r => r.RoomId == dto.RoomId
                            && overlapStatuses.Contains(r.Status)
                            && checkInDate < r.CheckOutDate
                            && checkOutDate > r.CheckInDate);

            if (hasReservationOverlap)
                throw new Exception("Phòng đã có reservation trùng lịch.");

            var hasCheckInOverlap = await _context.CheckInRecords
                .AnyAsync(c => c.RoomId == dto.RoomId
                            && (c.Status == "PendingCheckIn" || c.Status == "CheckedIn" || c.Status == "PendingCheckOut")
                            && checkInDate < c.ExpectedCheckOutDate
                            && checkOutDate > c.ExpectedCheckInDate);

            if (hasCheckInOverlap)
                throw new Exception("Phòng đã có lịch lưu trú trùng thời gian.");

            var pricing = await _context.RoomPricingConfigs
                .Where(p => p.RoomId == dto.RoomId && p.IsActive)
                .OrderByDescending(p => p.EffectiveFrom)
                .FirstOrDefaultAsync();

            var dailyRate = pricing?.MonthlyRent ?? room.MonthlyRent;
            if (dailyRate <= 0)
                throw new Exception("Phòng chưa được cấu hình giá hợp lệ.");

            var invoice = new Invoice
            {
                ResidentId = resident.Id,
                RoomId = room.Id,
                Amount = dailyRate * nights,
                Status = "Pending",
                Description = $"Reservation hold for room {room.RoomNumber}: {nights} night(s)",
                CreatedAt = DateTime.UtcNow
            };

            _context.Invoices.Add(invoice);
            await _context.SaveChangesAsync();

            var reservation = new Reservation
            {
                ResidentId = resident.Id,
                RoomId = room.Id,
                CheckInDate = checkInDate,
                CheckOutDate = checkOutDate,
                NumberOfGuests = dto.NumberOfGuests,
                Status = "Held",
                HoldExpiresAt = DateTime.UtcNow.AddMinutes(15),
                CreatedAt = DateTime.UtcNow,
                InvoiceId = invoice.Id,
                Guests = dto.Guests.Select((g, index) => new ReservationGuest
                {
                    FullName = g.FullName.Trim(),
                    IdentityNumber = g.IdentityNumber.Trim(),
                    Phone = g.Phone.Trim(),
                    IsPrimaryGuest = index == 0
                }).ToList()
            };

            _context.Reservations.Add(reservation);
            await _context.SaveChangesAsync();

            return await GetByIdAsync(reservation.Id)
                ?? throw new Exception("Không thể tải dữ liệu reservation vừa tạo.");
        }

        public async Task<IEnumerable<ReservationDto>> GetMyReservationsAsync(int userId)
        {
            var resident = await _context.Residents.FirstOrDefaultAsync(r => r.UserId == userId && r.IsActive);
            if (resident == null)
                return Enumerable.Empty<ReservationDto>();

            var reservations = await _context.Reservations
                .Include(r => r.Room)
                .Include(r => r.Resident)
                .Include(r => r.Guests)
                .Where(r => r.ResidentId == resident.Id)
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync();

            return reservations.Select(MapToDto);
        }

        public async Task<IEnumerable<ReservationDto>> GetAllReservationsAsync()
        {
            var reservations = await _context.Reservations
                .Include(r => r.Room)
                .Include(r => r.Resident)
                .Include(r => r.Guests)
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync();

            return reservations.Select(MapToDto);
        }

        public async Task<ReservationDto?> GetByIdAsync(int reservationId)
        {
            var reservation = await _context.Reservations
                .Include(r => r.Room)
                .Include(r => r.Resident)
                .Include(r => r.Guests)
                .FirstOrDefaultAsync(r => r.Id == reservationId);

            return reservation == null ? null : MapToDto(reservation);
        }

        public async Task<bool> CancelReservationAsync(int reservationId, int userId, string? reason)
        {
            var reservation = await _context.Reservations
                .Include(r => r.Resident)
                .FirstOrDefaultAsync(r => r.Id == reservationId);

            if (reservation == null)
                return false;

            var isOwner = reservation.Resident.UserId == userId;
            if (!isOwner)
                return false;

            if (reservation.Status != "Held" && reservation.Status != "Confirmed")
                return false;

            reservation.Status = "Cancelled";
            reservation.CancelReason = reason ?? "Cancelled by user";

            if (reservation.InvoiceId.HasValue)
            {
                var invoice = await _context.Invoices.FindAsync(reservation.InvoiceId.Value);
                if (invoice != null && (invoice.Status == "Pending" || invoice.Status == "Created" || invoice.Status == "Processing"))
                {
                    invoice.Status = "Cancelled";
                }
            }

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> ConfirmPaymentAsync(int reservationId, long orderCode)
        {
            var reservation = await _context.Reservations.FirstOrDefaultAsync(r => r.Id == reservationId);
            if (reservation == null || !reservation.InvoiceId.HasValue)
                return false;

            if (reservation.Status != "Held")
                return false;

            if (reservation.HoldExpiresAt <= DateTime.UtcNow)
            {
                reservation.Status = "Expired";
                await _context.SaveChangesAsync();
                return false;
            }

            var verified = await _paymentService.VerifyPaymentAsync(orderCode);
            if (!verified)
                return false;

            var invoice = await _context.Invoices.FindAsync(reservation.InvoiceId.Value);
            if (invoice == null || !string.Equals(invoice.Status, "Paid", StringComparison.OrdinalIgnoreCase))
                return false;

            reservation.Status = "Confirmed";
            reservation.ConfirmedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<int> ExpireHeldReservationsAsync()
        {
            var now = DateTime.UtcNow;
            var expiredReservations = await _context.Reservations
                .Where(r => r.Status == "Held" && r.HoldExpiresAt <= now)
                .ToListAsync();

            if (expiredReservations.Count == 0)
                return 0;

            foreach (var reservation in expiredReservations)
            {
                reservation.Status = "Expired";
                reservation.CancelReason = "Reservation hold timeout (15 minutes)";

                if (reservation.InvoiceId.HasValue)
                {
                    var invoice = await _context.Invoices.FindAsync(reservation.InvoiceId.Value);
                    if (invoice != null && (invoice.Status == "Pending" || invoice.Status == "Created" || invoice.Status == "Processing"))
                    {
                        invoice.Status = "Cancelled";
                    }
                }
            }

            await _context.SaveChangesAsync();
            return expiredReservations.Count;
        }

        private static ReservationDto MapToDto(Reservation reservation)
        {
            return new ReservationDto
            {
                Id = reservation.Id,
                ResidentId = reservation.ResidentId,
                ResidentName = reservation.Resident?.FullName ?? string.Empty,
                RoomId = reservation.RoomId,
                RoomNumber = reservation.Room?.RoomNumber ?? string.Empty,
                CheckInDate = reservation.CheckInDate,
                CheckOutDate = reservation.CheckOutDate,
                NumberOfGuests = reservation.NumberOfGuests,
                Status = reservation.Status,
                HoldExpiresAt = reservation.HoldExpiresAt,
                CreatedAt = reservation.CreatedAt,
                ConfirmedAt = reservation.ConfirmedAt,
                CancelReason = reservation.CancelReason,
                InvoiceId = reservation.InvoiceId,
                Guests = reservation.Guests.Select(g => new ReservationGuestDto
                {
                    Id = g.Id,
                    FullName = g.FullName,
                    IdentityNumber = g.IdentityNumber,
                    Phone = g.Phone,
                    IsPrimaryGuest = g.IsPrimaryGuest
                }).ToList()
            };
        }
    }
}
