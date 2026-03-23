using SORMS.API.DTOs;

namespace SORMS.API.Interfaces
{
    public interface ICheckInService
    {
        // Resident tạo yêu cầu check-in
        Task<CheckInRecordDto> CreateCheckInRequestAsync(int residentId, CreateCheckInRequestDto request);
        
        // Resident tạo yêu cầu check-out
        Task<CheckInRecordDto> CreateCheckOutRequestAsync(int residentId, int checkInRecordId);

        // Resident hủy yêu cầu check-in đang chờ
        Task<bool> CancelPendingCheckInRequestAsync(int residentId, int checkInRecordId);
        
        // Staff/Admin phê duyệt hoặc từ chối
        Task<bool> ApproveCheckInRequestAsync(int requestId, int approverId, bool isApproved, string? rejectReason);
        Task<bool> ApproveCheckOutRequestAsync(int requestId, int approverId, bool isApproved, string? rejectReason);
        
        // Lấy danh sách yêu cầu chờ phê duyệt
        Task<IEnumerable<CheckInRecordDto>> GetPendingCheckInRequestsAsync();
        Task<IEnumerable<CheckInRecordDto>> GetPendingCheckOutRequestsAsync();
        
        // Lấy thông tin của Resident
        Task<CheckInRecordDto?> GetCurrentCheckInStatusAsync(int residentId);
        Task<IEnumerable<CheckInRecordDto>> GetCheckInHistoryAsync(int residentId);
        
        // Lấy tất cả records (cho Staff/Admin)
        Task<IEnumerable<CheckInRecordDto>> GetAllCheckInRecordsAsync();
        
        // Helper method: Lấy ResidentId từ UserId
        Task<int> GetResidentIdByUserIdAsync(int userId);
    }
}
