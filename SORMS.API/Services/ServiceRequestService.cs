namespace SORMS.API.Services
{
    using Microsoft.EntityFrameworkCore;
    using SORMS.API.Data;
    using SORMS.API.DTOs;
    using SORMS.API.Interfaces;
    using SORMS.API.Models;

    public class ServiceRequestService : IServiceRequestService
    {
        private readonly SormsDbContext _context;

        public ServiceRequestService(SormsDbContext context)
        {
            _context = context;
        }

        // ==================== CRUD OPERATIONS ====================

        public async Task<ServiceRequestDto> CreateRequestAsync(CreateServiceRequestDto dto, int residentId)
        {
            // ? Ki?m tra Resident dã check-in chua
            var resident = await _context.Residents.FindAsync(residentId);
            if (resident == null)
                throw new Exception("Không tìm th?y thông tin cu dân");

            // Ki?m tra có check-in record v?i status "CheckedIn"
            var hasActiveCheckIn = await _context.CheckInRecords
                .AnyAsync(c => c.ResidentId == residentId && c.Status == "CheckedIn");

            if (!hasActiveCheckIn)
                throw new Exception("B?n ph?i check-in phòng tru?c khi g?i yêu c?u d?ch v?");

            var request = new ServiceRequest
            {
                Title = dto.Title,
                ServiceType = dto.ServiceType,
                Description = dto.Description,
                Priority = dto.Priority,
                RequestDate = DateTime.UtcNow,
                ResidentId = residentId,
                Status = "Pending",
                LastUpdated = DateTime.UtcNow
            };

            _context.ServiceRequests.Add(request);
            await _context.SaveChangesAsync();

            return await MapToDtoAsync(request);
        }

        public async Task<IEnumerable<ServiceRequestDto>> GetAllRequestsAsync()
        {
            var requests = await _context.ServiceRequests
                .Include(r => r.Resident)
                .OrderByDescending(r => r.RequestDate)
                .ToListAsync();

            var dtos = new List<ServiceRequestDto>();
            foreach (var request in requests)
            {
                dtos.Add(await MapToDtoAsync(request));
            }
            return dtos;
        }

        public async Task<IEnumerable<ServiceRequestDto>> GetRequestsByResidentIdAsync(int residentId)
        {
            var requests = await _context.ServiceRequests
                .Include(r => r.Resident)
                .Where(r => r.ResidentId == residentId)
                .OrderByDescending(r => r.RequestDate)
                .ToListAsync();

            var dtos = new List<ServiceRequestDto>();
            foreach (var request in requests)
            {
                dtos.Add(await MapToDtoAsync(request));
            }
            return dtos;
        }

        public async Task<IEnumerable<ServiceRequestDto>> GetRequestsByStatusAsync(string status)
        {
            var requests = await _context.ServiceRequests
                .Include(r => r.Resident)
                .Where(r => r.Status == status)
                .OrderByDescending(r => r.RequestDate)
                .ToListAsync();

            var dtos = new List<ServiceRequestDto>();
            foreach (var request in requests)
            {
                dtos.Add(await MapToDtoAsync(request));
            }
            return dtos;
        }

        public async Task<ServiceRequestDto?> GetRequestByIdAsync(int id)
        {
            var request = await _context.ServiceRequests
                .Include(r => r.Resident)
                .FirstOrDefaultAsync(r => r.Id == id);

            return request == null ? null : await MapToDtoAsync(request);
        }

        public async Task<bool> UpdateRequestAsync(int id, UpdateServiceRequestDto dto, int residentId)
        {
            var request = await _context.ServiceRequests.FindAsync(id);
            
            if (request == null || request.ResidentId != residentId)
                return false;

            // Ch? cho phép update n?u status là Pending
            if (request.Status != "Pending")
                return false;

            request.Title = dto.Title;
            request.ServiceType = dto.ServiceType;
            request.Description = dto.Description;
            request.Priority = dto.Priority;
            request.LastUpdated = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteRequestAsync(int id, int residentId)
        {
            var request = await _context.ServiceRequests.FindAsync(id);
            
            if (request == null || request.ResidentId != residentId)
                return false;

            // Ch? cho phép xóa n?u status là Pending
            if (request.Status != "Pending")
                return false;

            _context.ServiceRequests.Remove(request);
            await _context.SaveChangesAsync();
            return true;
        }

        // ==================== STAFF/ADMIN REVIEW ====================

        public async Task<bool> ReviewRequestAsync(int id, ReviewServiceRequestDto dto, string reviewedBy)
        {
            var request = await _context.ServiceRequests.FindAsync(id);
            
            if (request == null)
                return false;

            request.Status = dto.Status;
            request.StaffFeedback = dto.StaffFeedback;
            request.ReviewedBy = reviewedBy;
            request.ReviewedDate = DateTime.UtcNow;
            
            if (dto.Status == "Completed")
            {
                request.CompletedDate = DateTime.UtcNow;
            }
            
            request.LastUpdated = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return true;
        }

        // ==================== HELPER ====================

        private async Task<ServiceRequestDto> MapToDtoAsync(ServiceRequest request)
        {
            // Load resident if not loaded
            if (request.Resident == null)
            {
                await _context.Entry(request)
                    .Reference(r => r.Resident)
                    .LoadAsync();
            }

            return new ServiceRequestDto
            {
                Id = request.Id,
                Title = request.Title,
                ServiceType = request.ServiceType,
                Description = request.Description,
                RequestDate = request.RequestDate,
                Status = request.Status,
                ResidentId = request.ResidentId,
                ResidentName = request.Resident?.FullName ?? "Unknown",
                StaffFeedback = request.StaffFeedback,
                ReviewedBy = request.ReviewedBy,
                ReviewedDate = request.ReviewedDate,
                CompletedDate = request.CompletedDate,
                LastUpdated = request.LastUpdated,
                Priority = request.Priority
            };
        }
    }
}
