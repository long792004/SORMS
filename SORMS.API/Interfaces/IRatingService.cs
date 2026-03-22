using SORMS.API.DTOs;

namespace SORMS.API.Interfaces
{
    public interface IRatingService
    {
        Task<RatingDto> CreateRatingAsync(int userId, CreateRatingDto dto);
        Task<IEnumerable<RatingDto>> GetMyRatingsAsync(int userId);
        Task<IEnumerable<RatingDto>> GetAllRatingsAsync();
    }
}
