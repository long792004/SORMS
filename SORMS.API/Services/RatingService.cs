using Microsoft.EntityFrameworkCore;
using SORMS.API.Data;
using SORMS.API.DTOs;
using SORMS.API.Interfaces;
using SORMS.API.Models;

namespace SORMS.API.Services
{
    public class RatingService : IRatingService
    {
        private readonly SormsDbContext _context;

        public RatingService(SormsDbContext context)
        {
            _context = context;
        }

        public async Task<RatingDto> CreateRatingAsync(int userId, CreateRatingDto dto)
        {
            var resident = await _context.Residents.FirstOrDefaultAsync(r => r.UserId == userId && r.IsActive);
            if (resident == null)
                throw new Exception("Không tìm thấy thông tin cư dân.");

            var checkInRecord = await _context.CheckInRecords.FirstOrDefaultAsync(c => c.Id == dto.CheckInRecordId);
            if (checkInRecord == null)
                throw new Exception("Không tìm thấy lịch sử lưu trú.");

            if (checkInRecord.ResidentId != resident.Id)
                throw new Exception("Bạn không có quyền đánh giá lượt lưu trú này.");

            if (checkInRecord.Status != "CheckedOut")
                throw new Exception("Chỉ có thể đánh giá sau khi đã checkout.");

            var existed = await _context.Ratings.AnyAsync(r => r.CheckInRecordId == dto.CheckInRecordId && r.ResidentId == resident.Id);
            if (existed)
                throw new Exception("Bạn đã đánh giá lượt lưu trú này rồi.");

            var rating = new Rating
            {
                ResidentId = resident.Id,
                RoomId = checkInRecord.RoomId,
                CheckInRecordId = dto.CheckInRecordId,
                RoomScore = dto.RoomScore,
                ServiceScore = dto.ServiceScore,
                Comment = dto.Comment,
                CreatedAt = DateTime.UtcNow
            };

            _context.Ratings.Add(rating);
            await _context.SaveChangesAsync();

            return MapToDto(rating);
        }

        public async Task<IEnumerable<RatingDto>> GetMyRatingsAsync(int userId)
        {
            var resident = await _context.Residents.FirstOrDefaultAsync(r => r.UserId == userId && r.IsActive);
            if (resident == null)
                return Enumerable.Empty<RatingDto>();

            var ratings = await _context.Ratings
                .Where(r => r.ResidentId == resident.Id)
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync();

            return ratings.Select(MapToDto);
        }

        public async Task<IEnumerable<RatingDto>> GetAllRatingsAsync()
        {
            var ratings = await _context.Ratings
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync();

            return ratings.Select(MapToDto);
        }

        private static RatingDto MapToDto(Rating rating)
        {
            return new RatingDto
            {
                Id = rating.Id,
                ResidentId = rating.ResidentId,
                RoomId = rating.RoomId,
                CheckInRecordId = rating.CheckInRecordId,
                RoomScore = rating.RoomScore,
                ServiceScore = rating.ServiceScore,
                Comment = rating.Comment,
                CreatedAt = rating.CreatedAt
            };
        }
    }
}
