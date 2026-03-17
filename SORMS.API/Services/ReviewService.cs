using Microsoft.EntityFrameworkCore;
using SORMS.API.Data;
using SORMS.API.DTOs;
using SORMS.API.Interfaces;
using SORMS.API.Models;
using System.Security.Claims;

namespace SORMS.API.Services
{
    public class ReviewService : IReviewService
    {
        private readonly SormsDbContext _context;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public ReviewService(SormsDbContext context, IHttpContextAccessor httpContextAccessor)
        {
            _context = context;
            _httpContextAccessor = httpContextAccessor;
        }

        public async Task<ReviewResponse> CreateReviewAsync(CreateReviewRequest request)
        {
            var currentResidentId = await ResolveCurrentResidentIdAsync();

            var checkIn = await _context.CheckInRecords
                .Include(c => c.Resident)
                .Include(c => c.Room)
                .FirstOrDefaultAsync(c => c.Id == request.CheckInId);

            // Validation 1: check-in must exist and belong to current resident.
            if (checkIn == null || checkIn.ResidentId != currentResidentId)
                throw new ArgumentException("Check-in record is invalid or does not belong to the current resident.");

            // Validation 2: resident can review only after checkout is fully approved.
            if (!string.Equals(checkIn.Status, "CheckedOut", StringComparison.OrdinalIgnoreCase))
                throw new InvalidOperationException("You can only review after checkout is completed.");

            // Validation 3: each stay (check-in record) can have only one review.
            var existedReview = await _context.Reviews
                .AnyAsync(r => r.CheckInId == request.CheckInId);

            if (existedReview)
                throw new InvalidOperationException("A review already exists for this stay.");

            var review = new Review
            {
                ResidentId = checkIn.ResidentId,
                RoomId = checkIn.RoomId,
                CheckInId = checkIn.Id,
                Rating = request.Rating,
                Comment = string.IsNullOrWhiteSpace(request.Comment) ? null : request.Comment.Trim(),
                CreatedAt = DateTime.UtcNow,
                IsHidden = false
            };

            _context.Reviews.Add(review);
            await _context.SaveChangesAsync();

            return new ReviewResponse
            {
                Id = review.Id,
                ResidentName = checkIn.Resident?.FullName ?? string.Empty,
                RoomName = checkIn.Room?.RoomNumber ?? string.Empty,
                Rating = review.Rating,
                Comment = review.Comment,
                CreatedAt = review.CreatedAt
            };
        }

        public async Task<RoomReviewSummaryResponse> GetRoomReviewsAsync(int roomId, int pageNumber = 1, int pageSize = 10)
        {
            var roomExists = await _context.Rooms.AsNoTracking().AnyAsync(r => r.Id == roomId);
            if (!roomExists)
                throw new KeyNotFoundException("Room not found.");

            if (pageNumber <= 0)
                pageNumber = 1;

            if (pageSize <= 0)
                pageSize = 10;

            var baseQuery = _context.Reviews
                .AsNoTracking()
                .Include(r => r.Resident)
                .Include(r => r.Room)
                .Where(r => r.RoomId == roomId && !r.IsHidden);

            var totalReviews = await baseQuery.CountAsync();

            var averageRating = totalReviews == 0
                ? 0
                : await baseQuery.AverageAsync(r => (double)r.Rating);

            var reviews = await baseQuery
                .OrderByDescending(r => r.CreatedAt)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .Select(r => new ReviewResponse
                {
                    Id = r.Id,
                    ResidentName = r.Resident != null ? r.Resident.FullName : string.Empty,
                    RoomName = r.Room != null ? r.Room.RoomNumber : string.Empty,
                    Rating = r.Rating,
                    Comment = r.Comment,
                    CreatedAt = r.CreatedAt
                })
                .ToListAsync();

            return new RoomReviewSummaryResponse
            {
                TotalReviews = totalReviews,
                AverageRating = Math.Round(averageRating, 2),
                Reviews = reviews
            };
        }

        public async Task<List<ReviewResponse>> GetPublicRecentReviewsAsync(int limit = 6)
        {
            if (limit <= 0)
                limit = 6;

            return await _context.Reviews
                .AsNoTracking()
                .Include(r => r.Resident)
                .Include(r => r.Room)
                .Where(r => !r.IsHidden)
                .OrderByDescending(r => r.CreatedAt)
                .Take(limit)
                .Select(r => new ReviewResponse
                {
                    Id = r.Id,
                    ResidentName = r.Resident != null ? r.Resident.FullName : string.Empty,
                    RoomName = r.Room != null ? r.Room.RoomNumber : string.Empty,
                    Rating = r.Rating,
                    Comment = r.Comment,
                    CreatedAt = r.CreatedAt
                })
                .ToListAsync();
        }

        public async Task<List<ReviewResponse>> GetMyReviewsAsync()
        {
            var currentResidentId = await ResolveCurrentResidentIdAsync();

            return await _context.Reviews
                .AsNoTracking()
                .Include(r => r.Room)
                .Where(r => r.ResidentId == currentResidentId)
                .OrderByDescending(r => r.CreatedAt)
                .Select(r => new ReviewResponse
                {
                    Id = r.Id,
                    ResidentName = r.Resident != null ? r.Resident.FullName : string.Empty,
                    RoomName = r.Room != null ? r.Room.RoomNumber : string.Empty,
                    Rating = r.Rating,
                    Comment = r.Comment,
                    CreatedAt = r.CreatedAt
                })
                .ToListAsync();
        }

        public async Task<List<ReviewResponse>> GetAllReviewsForAdminAsync()
        {
            return await _context.Reviews
                .AsNoTracking()
                .Include(r => r.Resident)
                .Include(r => r.Room)
                .Where(r => !r.IsHidden)
                .OrderByDescending(r => r.CreatedAt)
                .Select(r => new ReviewResponse
                {
                    Id = r.Id,
                    ResidentName = r.Resident != null ? r.Resident.FullName : string.Empty,
                    RoomName = r.Room != null ? r.Room.RoomNumber : string.Empty,
                    Rating = r.Rating,
                    Comment = r.Comment,
                    CreatedAt = r.CreatedAt
                })
                .ToListAsync();
        }

        public async Task<bool> DeleteReviewAsync(int reviewId)
        {
            var review = await _context.Reviews.FirstOrDefaultAsync(r => r.Id == reviewId);
            if (review == null)
                return false;

            if (review.IsHidden)
                return true;

            review.IsHidden = true;
            await _context.SaveChangesAsync();
            return true;
        }

        private async Task<int> ResolveCurrentResidentIdAsync()
        {
            var user = _httpContextAccessor.HttpContext?.User
                       ?? throw new UnauthorizedAccessException("User context is not available.");

            var residentIdClaim = user.FindFirst("ResidentId")?.Value;
            if (int.TryParse(residentIdClaim, out var residentId) && residentId > 0)
                return residentId;

            var userIdClaim = user.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(userIdClaim, out var userId) || userId <= 0)
                throw new UnauthorizedAccessException("Current user id is invalid.");

            var resident = await _context.Residents
                .AsNoTracking()
                .FirstOrDefaultAsync(r => r.UserId == userId && r.IsActive);

            if (resident == null)
                throw new UnauthorizedAccessException("Current user is not linked to an active resident profile.");

            return resident.Id;
        }
    }
}