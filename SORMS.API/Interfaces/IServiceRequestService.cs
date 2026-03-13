using SORMS.API.DTOs;

namespace SORMS.API.Interfaces
{
    public interface IServiceRequestService
    {
        // CRUD Operations
        Task<ServiceRequestDto> CreateRequestAsync(CreateServiceRequestDto dto, int residentId);
        Task<IEnumerable<ServiceRequestDto>> GetAllRequestsAsync();
        Task<IEnumerable<ServiceRequestDto>> GetRequestsByResidentIdAsync(int residentId);
        Task<IEnumerable<ServiceRequestDto>> GetRequestsByStatusAsync(string status);
        Task<ServiceRequestDto?> GetRequestByIdAsync(int id);
        Task<bool> UpdateRequestAsync(int id, UpdateServiceRequestDto dto, int residentId);
        Task<bool> DeleteRequestAsync(int id, int residentId);

        // Staff/Admin Review
        Task<bool> ReviewRequestAsync(int id, ReviewServiceRequestDto dto, string reviewedBy);
    }
}
