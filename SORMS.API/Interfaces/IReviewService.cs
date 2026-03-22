using SORMS.API.DTOs;

namespace SORMS.API.Interfaces
{
    public interface IReviewService
    {
        Task<ReviewResponse> CreateReviewAsync(CreateReviewRequest request);
        Task<RoomReviewSummaryResponse> GetRoomReviewsAsync(int roomId, int pageNumber = 1, int pageSize = 10);
        Task<List<ReviewResponse>> GetPublicRecentReviewsAsync(int limit = 6);
        Task<List<ReviewResponse>> GetMyReviewsAsync();
        Task<List<ReviewResponse>> GetAllReviewsForAdminAsync();
        Task<bool> DeleteReviewAsync(int reviewId);
    }
}