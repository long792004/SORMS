using SORMS.API.DTOs;

namespace SORMS.API.Interfaces
{
    public interface IReportService
    {
        // CRUD Operations
        Task<ReportDto> CreateReportAsync(CreateReportDto dto, string createdBy, int staffId);
        Task<IEnumerable<ReportDto>> GetAllReportsAsync();
        Task<IEnumerable<ReportDto>> GetReportsByStaffIdAsync(int staffId);
        Task<IEnumerable<ReportDto>> GetReportsByStatusAsync(string status);
        Task<ReportDto?> GetReportByIdAsync(int id);
        Task<bool> UpdateReportAsync(int id, UpdateReportDto dto, int staffId);
        Task<bool> DeleteReportAsync(int id, int staffId);

        // Admin Review
        Task<bool> ReviewReportAsync(int id, ReviewReportDto dto, string reviewedBy);

        // Auto Generated Reports
        Task<ReportDto> GenerateOccupancyReportAsync();
        Task<ReportDto> GenerateServiceUsageReportAsync();
        Task<ReportDto> GenerateRevenueReportAsync();
    }
}
