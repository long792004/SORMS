namespace SORMS.API.Services
{
    using Microsoft.EntityFrameworkCore;
    using SORMS.API.Data;
    using SORMS.API.DTOs;
    using SORMS.API.Interfaces;
    using SORMS.API.Models;

    public class ReportService : IReportService
    {
        private readonly SormsDbContext _context;

        public ReportService(SormsDbContext context)
        {
            _context = context;
        }

        // ==================== CRUD OPERATIONS ====================

        public async Task<ReportDto> CreateReportAsync(CreateReportDto dto, string createdBy, int staffId)
        {
            var report = new Report
            {
                Title = dto.Title,
                Content = dto.Content,
                GeneratedDate = DateTime.UtcNow,
                CreatedBy = createdBy,
                StaffId = staffId,
                Status = "Pending",
                LastUpdated = DateTime.UtcNow
            };

            _context.Reports.Add(report);
            await _context.SaveChangesAsync();

            return MapToDto(report);
        }

        public async Task<IEnumerable<ReportDto>> GetAllReportsAsync()
        {
            var reports = await _context.Reports
                .OrderByDescending(r => r.GeneratedDate)
                .ToListAsync();

            return reports.Select(MapToDto);
        }

        public async Task<IEnumerable<ReportDto>> GetReportsByStaffIdAsync(int staffId)
        {
            var reports = await _context.Reports
                .Where(r => r.StaffId == staffId)
                .OrderByDescending(r => r.GeneratedDate)
                .ToListAsync();

            return reports.Select(MapToDto);
        }

        public async Task<IEnumerable<ReportDto>> GetReportsByStatusAsync(string status)
        {
            var reports = await _context.Reports
                .Where(r => r.Status == status)
                .OrderByDescending(r => r.GeneratedDate)
                .ToListAsync();

            return reports.Select(MapToDto);
        }

        public async Task<ReportDto?> GetReportByIdAsync(int id)
        {
            var report = await _context.Reports.FindAsync(id);
            return report == null ? null : MapToDto(report);
        }

        public async Task<bool> UpdateReportAsync(int id, UpdateReportDto dto, int staffId)
        {
            var report = await _context.Reports.FindAsync(id);
            
            if (report == null || report.StaffId != staffId)
                return false;

            // Chỉ cho phép update nếu status là Pending
            if (report.Status != "Pending")
                return false;

            report.Title = dto.Title;
            report.Content = dto.Content;
            report.LastUpdated = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteReportAsync(int id, int staffId)
        {
            var report = await _context.Reports.FindAsync(id);
            
            if (report == null || report.StaffId != staffId)
                return false;

            // Chỉ cho phép xóa nếu status là Pending
            if (report.Status != "Pending")
                return false;

            _context.Reports.Remove(report);
            await _context.SaveChangesAsync();
            return true;
        }

        // ==================== ADMIN REVIEW ====================

        public async Task<bool> ReviewReportAsync(int id, ReviewReportDto dto, string reviewedBy)
        {
            var report = await _context.Reports.FindAsync(id);
            
            if (report == null)
                return false;

            report.Status = dto.Status; // "Reviewed" or "Rejected"
            report.AdminFeedback = dto.AdminFeedback;
            report.ReviewedBy = reviewedBy;
            report.ReviewedDate = DateTime.UtcNow;
            report.LastUpdated = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return true;
        }

        // ==================== AUTO GENERATED REPORTS ====================

        public async Task<ReportDto> GenerateOccupancyReportAsync()
        {
            var totalRooms = await _context.Rooms.CountAsync();
            var occupiedRooms = await _context.Rooms.CountAsync(r => r.Status == "Occupied");
            var occupancyRate = totalRooms == 0 ? 0 : (double)occupiedRooms / totalRooms * 100;

            var report = new Report
            {
                Title = "Báo cáo tỷ lệ phòng sử dụng",
                GeneratedDate = DateTime.UtcNow,
                CreatedBy = "System",
                Content = $"Tổng số phòng: {totalRooms}\nPhòng đang sử dụng: {occupiedRooms}\nTỷ lệ sử dụng: {occupancyRate:F2}%",
                Status = "Reviewed",
                LastUpdated = DateTime.UtcNow
            };

            _context.Reports.Add(report);
            await _context.SaveChangesAsync();

            return MapToDto(report);
        }

        public async Task<ReportDto> GenerateServiceUsageReportAsync()
        {
            var totalRequests = await _context.ServiceRequests.CountAsync();
            var completedRequests = await _context.ServiceRequests.CountAsync(r => r.Status == "Completed");
            var pendingRequests = await _context.ServiceRequests.CountAsync(r => r.Status == "Pending");

            var report = new Report
            {
                Title = "Báo cáo sử dụng dịch vụ",
                GeneratedDate = DateTime.UtcNow,
                CreatedBy = "System",
                Content = $"Tổng yêu cầu: {totalRequests}\nĐã hoàn thành: {completedRequests}\nĐang chờ: {pendingRequests}",
                Status = "Reviewed",
                LastUpdated = DateTime.UtcNow
            };

            _context.Reports.Add(report);
            await _context.SaveChangesAsync();

            return MapToDto(report);
        }

        public async Task<ReportDto> GenerateRevenueReportAsync()
        {
            var paidRevenue = await _context.Invoices
                .Where(i => i.Status == "Paid")
                .SumAsync(i => (decimal?)i.Amount) ?? 0m;

            var pendingRevenue = await _context.Invoices
                .Where(i => i.Status == "Pending" || i.Status == "Created" || i.Status == "Processing")
                .SumAsync(i => (decimal?)i.Amount) ?? 0m;

            var cancelledRevenue = await _context.Invoices
                .Where(i => i.Status == "Cancelled")
                .SumAsync(i => (decimal?)i.Amount) ?? 0m;

            var totalInvoices = await _context.Invoices.CountAsync();
            var paidInvoices = await _context.Invoices.CountAsync(i => i.Status == "Paid");

            var report = new Report
            {
                Title = "Báo cáo doanh thu",
                GeneratedDate = DateTime.UtcNow,
                CreatedBy = "System",
                Content =
                    $"Tổng hóa đơn: {totalInvoices}\n" +
                    $"Hóa đơn đã thanh toán: {paidInvoices}\n" +
                    $"Tổng doanh thu đã thu: {paidRevenue:N0} VND\n" +
                    $"Doanh thu chờ thanh toán: {pendingRevenue:N0} VND\n" +
                    $"Doanh thu đã hủy: {cancelledRevenue:N0} VND\n" +
                    $"Tổng giá trị hóa đơn (đã thu + chờ thu): {(paidRevenue + pendingRevenue):N0} VND",
                Status = "Reviewed",
                LastUpdated = DateTime.UtcNow
            };

            _context.Reports.Add(report);
            await _context.SaveChangesAsync();

            return MapToDto(report);
        }

        // ==================== HELPER ====================

        private ReportDto MapToDto(Report report)
        {
            return new ReportDto
            {
                Id = report.Id,
                Title = report.Title,
                Content = report.Content,
                GeneratedDate = report.GeneratedDate,
                CreatedBy = report.CreatedBy,
                StaffId = report.StaffId,
                Status = report.Status,
                AdminFeedback = report.AdminFeedback,
                ReviewedBy = report.ReviewedBy,
                ReviewedDate = report.ReviewedDate,
                LastUpdated = report.LastUpdated
            };
        }
    }
}
