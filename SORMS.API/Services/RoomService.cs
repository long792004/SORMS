using Microsoft.EntityFrameworkCore;
using SORMS.API.Data;
using SORMS.API.DTOs;
using SORMS.API.Interfaces;
using SORMS.API.Models;
using System.Text.Json;

namespace SORMS.API.Services
{
    public class RoomService : IRoomService
    {
        private readonly SormsDbContext _context;

        public RoomService(SormsDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<RoomDto>> GetAllRoomsAsync()
        {
            var rooms = await _context.Rooms
                .AsNoTracking()
                .Include(r => r.Reviews)
                .ToListAsync();

            return rooms.Select(MapToRoomDto);
        }

        public async Task<RoomDto?> GetRoomByIdAsync(int id)
        {
            var room = await _context.Rooms
                .AsNoTracking()
                .Include(r => r.Reviews)
                .FirstOrDefaultAsync(r => r.Id == id);
            if (room == null) return null;

            return MapToRoomDto(room);
        }

        public async Task<RoomDto> CreateRoomAsync(RoomDto roomDto)
        {
            var imageUrls = NormalizeImageUrls(roomDto.ImageUrls, roomDto.ImageUrl);
            var room = new Room
            {
                RoomNumber = roomDto.RoomNumber,
                Type = roomDto.Type,
                Floor = roomDto.Floor,
                MonthlyRent = roomDto.MonthlyRent,
                Area = roomDto.Area,
                MaxCapacity = roomDto.MaxCapacity <= 0 ? 1 : roomDto.MaxCapacity,
                Status = roomDto.Status,
                HoldExpiresAt = roomDto.HoldExpiresAt,
                MaintenanceEndDate = roomDto.MaintenanceEndDate,
                Description = roomDto.Description,
                ImageUrl = SerializeImageUrls(imageUrls),
                Amenities = roomDto.Amenities ?? Array.Empty<string>(),
                CurrentResident = roomDto.CurrentResident,
                IsActive = true
            };

            _context.Rooms.Add(room);
            await _context.SaveChangesAsync();

            return MapToRoomDto(room);
        }

        public async Task<bool> UpdateRoomAsync(int id, RoomDto roomDto)
        {
            var room = await _context.Rooms.FindAsync(id);
            if (room == null) return false;

            var imageUrls = NormalizeImageUrls(roomDto.ImageUrls, roomDto.ImageUrl);

            // Validate status changes
            if (room.Status == "Occupied" && roomDto.Status == "Maintenance")
            {
                throw new InvalidOperationException("Cannot set an occupied room to maintenance status directly.");
            }
            if (room.Status == "Maintenance" && roomDto.Status != "Maintenance" && roomDto.MaintenanceEndDate > DateTime.UtcNow)
            {
                throw new InvalidOperationException("Cannot change status from maintenance if maintenance end date is in the future.");
            }

            room.RoomNumber = roomDto.RoomNumber;
            room.Type = roomDto.Type;
            room.Floor = roomDto.Floor;
            room.MonthlyRent = roomDto.MonthlyRent;
            room.Area = roomDto.Area;
            room.MaxCapacity = roomDto.MaxCapacity <= 0 ? 1 : roomDto.MaxCapacity;
            room.Status = roomDto.Status;
            room.HoldExpiresAt = roomDto.HoldExpiresAt;
            room.MaintenanceEndDate = roomDto.MaintenanceEndDate;
            room.Description = roomDto.Description;
            room.ImageUrl = SerializeImageUrls(imageUrls);
            room.Amenities = roomDto.Amenities ?? Array.Empty<string>();
            room.CurrentResident = roomDto.CurrentResident;

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteRoomAsync(int id)
        {
            var room = await _context.Rooms.FindAsync(id);
            if (room == null) return false;

            // Kiểm tra xem phòng có đang được thuê không
            if (room.Status == "Occupied")
                throw new InvalidOperationException("Khong the xoa phong dang co nguoi thue.");

            var reviews = await _context.Reviews.Where(r => r.RoomId == id).ToListAsync();
            if (reviews.Count > 0)
            {
                _context.Reviews.RemoveRange(reviews);
            }

            var checkInRecords = await _context.CheckInRecords.Where(c => c.RoomId == id).ToListAsync();
            if (checkInRecords.Count > 0)
            {
                _context.CheckInRecords.RemoveRange(checkInRecords);
            }

            var invoices = await _context.Invoices.Where(i => i.RoomId == id).ToListAsync();
            foreach (var invoice in invoices)
            {
                invoice.RoomId = null;
            }

            var residents = await _context.Residents.Where(r => r.RoomId == id).ToListAsync();
            foreach (var resident in residents)
            {
                resident.RoomId = null;
            }

            _context.Rooms.Remove(room);

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<IEnumerable<RoomDto>> GetAvailableRoomsAsync(DateTime? checkInDate = null, DateTime? checkOutDate = null)
        {
            var requestedCheckIn = NormalizeUtcDate(checkInDate ?? DateTime.UtcNow);
            var requestedCheckOut = NormalizeUtcDate(checkOutDate ?? requestedCheckIn.AddDays(1));
            var now = DateTime.UtcNow;

            if (requestedCheckOut <= requestedCheckIn)
                throw new ArgumentException("Check-out date must be greater than check-in date.");

            var activeBookingStatuses = new[] { "PendingCheckIn", "CheckedIn", "PendingCheckOut" };

            var availableRooms = await _context.Rooms
                .AsNoTracking()
                .Include(r => r.Reviews)
                .Where(r => r.IsActive)
                .Where(r => r.Status == "Available" || (r.Status == "OnHold" && r.HoldExpiresAt.HasValue && r.HoldExpiresAt.Value <= now))
                .Where(r => r.Status != "Maintenance" || !r.MaintenanceEndDate.HasValue || r.MaintenanceEndDate.Value.Date <= requestedCheckIn)
                .Where(r => !_context.CheckInRecords.Any(c =>
                    c.RoomId == r.Id &&
                    activeBookingStatuses.Contains(c.Status) &&
                    requestedCheckIn < (c.ExpectedCheckOutDate) &&
                    requestedCheckOut > (c.ExpectedCheckInDate)))
                .ToListAsync();

            return availableRooms.Select(MapToRoomDto);
        }

        private static DateTime NormalizeUtcDate(DateTime value)
        {
            return DateTime.SpecifyKind(value.Date, DateTimeKind.Utc);
        }

        private static string[] ParseImageUrls(string? storedValue)
        {
            if (string.IsNullOrWhiteSpace(storedValue))
                return Array.Empty<string>();

            var trimmed = storedValue.Trim();
            if (trimmed.StartsWith("["))
            {
                try
                {
                    var parsed = JsonSerializer.Deserialize<string[]>(trimmed);
                    if (parsed != null)
                    {
                        return parsed.Where(url => !string.IsNullOrWhiteSpace(url)).Select(url => url.Trim()).Distinct().ToArray();
                    }
                }
                catch (JsonException)
                {
                }
            }

            return new[] { trimmed };
        }

        private static string[] NormalizeImageUrls(IEnumerable<string>? imageUrls, string? fallbackImageUrl)
        {
            var normalized = (imageUrls ?? Array.Empty<string>())
                .Where(url => !string.IsNullOrWhiteSpace(url))
                .Select(url => url.Trim())
                .Distinct()
                .ToList();

            if (normalized.Count == 0 && !string.IsNullOrWhiteSpace(fallbackImageUrl))
            {
                normalized.AddRange(ParseImageUrls(fallbackImageUrl));
            }

            return normalized.Where(url => !string.IsNullOrWhiteSpace(url)).Distinct().ToArray();
        }

        private static string? SerializeImageUrls(IEnumerable<string> imageUrls)
        {
            var normalized = imageUrls
                .Where(url => !string.IsNullOrWhiteSpace(url))
                .Select(url => url.Trim())
                .Distinct()
                .ToArray();

            if (normalized.Length == 0)
                return null;

            if (normalized.Length == 1)
                return normalized[0];

            return JsonSerializer.Serialize(normalized);
        }

        private static RoomDto MapToRoomDto(Room room)
        {
            var imageUrls = ParseImageUrls(room.ImageUrl);
            var visibleReviews = room.Reviews?.Where(review => !review.IsHidden).ToList() ?? new List<Review>();
            var reviewCount = visibleReviews.Count;
            var averageRating = reviewCount == 0 ? 0 : Math.Round(visibleReviews.Average(review => review.Rating), 2);

            return new RoomDto
            {
                Id = room.Id,
                RoomNumber = room.RoomNumber,
                Type = room.Type,
                RoomType = room.Type,
                Floor = room.Floor,
                MonthlyRent = room.MonthlyRent,
                Area = room.Area,
                MaxCapacity = room.MaxCapacity > 0 ? room.MaxCapacity : 1,
                Status = room.Status,
                HoldExpiresAt = room.HoldExpiresAt,
                MaintenanceEndDate = room.MaintenanceEndDate,
                CurrentResident = room.CurrentResident,
                Description = room.Description,
                ImageUrl = imageUrls.FirstOrDefault(),
                ImageUrls = imageUrls,
                Amenities = room.Amenities ?? Array.Empty<string>(),
                AverageRating = averageRating,
                ReviewCount = reviewCount,
                IsActive = room.IsActive
            };
        }
    }
}
