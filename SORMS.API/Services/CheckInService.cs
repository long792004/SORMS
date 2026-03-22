namespace SORMS.API.Services
{
    using Microsoft.EntityFrameworkCore;
    using SORMS.API.Data;
    using SORMS.API.DTOs;
    using SORMS.API.Interfaces;
    using SORMS.API.Models;

    public class CheckInService : ICheckInService
    {
        private readonly SormsDbContext _context;
        private readonly INotificationService _notificationService;

        public CheckInService(SormsDbContext context, INotificationService notificationService)
        {
            _context = context;
            _notificationService = notificationService;
        }

        // Resident tạo yêu cầu check-in vào phòng
        public async Task<CheckInRecordDto> CreateCheckInRequestAsync(int residentId, int roomId, DateTime expectedCheckInDate, DateTime expectedCheckOutDate, int numberOfResidents)
        {
            var requestedCheckIn = NormalizeUtcDate(expectedCheckInDate);
            var requestedCheckOut = NormalizeUtcDate(expectedCheckOutDate);
            var numberOfNights = (requestedCheckOut - requestedCheckIn).Days;
            
            Console.WriteLine($"[CheckInService] CreateCheckInRequest DEBUG:");
            Console.WriteLine($"  Input expectedCheckInDate: {expectedCheckInDate:yyyy-MM-dd HH:mm:ss} (Kind={expectedCheckInDate.Kind})");
            Console.WriteLine($"  Input expectedCheckOutDate: {expectedCheckOutDate:yyyy-MM-dd HH:mm:ss} (Kind={expectedCheckOutDate.Kind})");
            Console.WriteLine($"  After Normalize requestedCheckIn: {requestedCheckIn:yyyy-MM-dd HH:mm:ss}");
            Console.WriteLine($"  After Normalize requestedCheckOut: {requestedCheckOut:yyyy-MM-dd HH:mm:ss}");
            Console.WriteLine($"  Difference in days: {numberOfNights}");

            if (requestedCheckOut <= requestedCheckIn)
                throw new Exception("Check-out phải lớn hơn Check-in.");

            if (numberOfResidents <= 0)
                throw new Exception("Số lượng người ở phải lớn hơn 0.");

            // Kiểm tra resident có tồn tại không
            var resident = await _context.Residents.FindAsync(residentId);
            if (resident == null)
                throw new Exception("Resident không tồn tại");

            var activeBookingStatuses = new[] { "PendingCheckIn", "CheckedIn", "PendingCheckOut" };

            // Kiểm tra resident có booking trùng lịch hay không
            var residentOverlap = await _context.CheckInRecords
                .AnyAsync(r =>
                    r.ResidentId == residentId &&
                    activeBookingStatuses.Contains(r.Status) &&
                    requestedCheckIn < r.ExpectedCheckOutDate &&
                    requestedCheckOut > r.ExpectedCheckInDate);

            if (residentOverlap)
                throw new Exception("Bạn đã có booking trùng trong khoảng thời gian này.");

            // Kiểm tra phòng có tồn tại
            var room = await _context.Rooms.FindAsync(roomId);
            if (room == null)
                throw new Exception("Phòng không tồn tại");

            if (!room.IsActive)
                throw new Exception("Phòng này hiện không hoạt động.");

            if (room.Status == "Maintenance" && (!room.MaintenanceEndDate.HasValue || room.MaintenanceEndDate.Value.Date > requestedCheckIn))
                throw new Exception("Phòng đang bảo trì trong khoảng thời gian bạn chọn.");

            var effectiveMaxCapacity = room.MaxCapacity > 0 ? room.MaxCapacity : 1;
            if (numberOfResidents > effectiveMaxCapacity)
                throw new Exception($"Số lượng người ở không được vượt quá sức chứa tối đa của phòng ({effectiveMaxCapacity}).");

            var pricing = await _context.RoomPricingConfigs
                .Where(p => p.RoomId == roomId && p.IsActive)
                .OrderByDescending(p => p.EffectiveFrom)
                .FirstOrDefaultAsync();

            var dailyRate = ResolveDailyRate(room, pricing);
            if (dailyRate <= 0)
                throw new Exception("Phòng này chưa được cấu hình giá thuê theo ngày.");

            // Kiểm tra phòng có bị trùng lịch đặt không
            var roomOverlap = await _context.CheckInRecords
                .AnyAsync(r =>
                    r.RoomId == roomId &&
                    activeBookingStatuses.Contains(r.Status) &&
                    requestedCheckIn < r.ExpectedCheckOutDate &&
                    requestedCheckOut > r.ExpectedCheckInDate);

            if (roomOverlap)
                throw new Exception("Phòng này đã có người đặt trong khoảng thời gian bạn chọn.");

            // Tạo yêu cầu check-in
            var checkInRequest = new CheckInRecord
            {
                ResidentId = residentId,
                RoomId = roomId,
                RequestTime = DateTime.UtcNow,
                ExpectedCheckInDate = requestedCheckIn,
                ExpectedCheckOutDate = requestedCheckOut,
                NumberOfResidents = numberOfResidents,
                Status = "PendingCheckIn",
                RequestType = "CheckIn"
            };

            await using var transaction = await _context.Database.BeginTransactionAsync();

            _context.CheckInRecords.Add(checkInRequest);
            await _context.SaveChangesAsync();

            var openInvoices = await _context.Invoices
                .Where(i => i.ResidentId == residentId &&
                            i.RoomId == roomId &&
                            (i.Status == "Pending" || i.Status == "Created"))
                .ToListAsync();

            foreach (var openInvoice in openInvoices)
            {
                openInvoice.Status = "Cancelled";
            }

            var invoice = new Invoice
            {
                ResidentId = residentId,
                RoomId = roomId,
                Amount = dailyRate * numberOfNights,
                Status = "Pending",
                Description = $"Booking fee for room {room.RoomNumber}: {numberOfNights} night(s) x {dailyRate:N0}/day",
                CreatedAt = DateTime.UtcNow
            };
            
            Console.WriteLine($"[CheckInService] Invoice created:");
            Console.WriteLine($"  DailyRate: {dailyRate}");
            Console.WriteLine($"  NumberOfNights: {numberOfNights}");
            Console.WriteLine($"  Amount: {invoice.Amount} (= {dailyRate} x {numberOfNights})");
            Console.WriteLine($"  Description: {invoice.Description}");

            _context.Invoices.Add(invoice);
            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            // Gửi thông báo cho tất cả Staff và Admin
            await SendNotificationToStaffAndAdminAsync(
                $"Yêu cầu check-in mới từ {resident.FullName} vào phòng {room.RoomNumber}",
                checkInRequest.Id
            );

            return await MapToDto(checkInRequest);
        }

        private static DateTime NormalizeUtcDate(DateTime value)
        {
            return DateTime.SpecifyKind(value.Date, DateTimeKind.Utc);
        }

        private static decimal ResolveDailyRate(Room room, RoomPricingConfig? pricing)
        {
            if (pricing?.MonthlyRent > 0)
            {
                return pricing.MonthlyRent;
            }

            return room.MonthlyRent;
        }

        // Resident tạo yêu cầu check-out khỏi phòng
        public async Task<CheckInRecordDto> CreateCheckOutRequestAsync(int residentId, int checkInRecordId)
        {
            // Kiểm tra record có tồn tại và thuộc về resident này không
            var record = await _context.CheckInRecords
                .Include(r => r.Room)
                .Include(r => r.Resident)
                .FirstOrDefaultAsync(r => r.Id == checkInRecordId && r.ResidentId == residentId);

            if (record == null)
                throw new Exception("Không tìm thấy thông tin check-in");

            if (record.Status != "CheckedIn")
                throw new Exception("Bạn chưa check-in vào phòng này");

            // Kiểm tra đã có yêu cầu check-out chưa
            if (record.Status == "PendingCheckOut")
                throw new Exception("Đã có yêu cầu check-out đang chờ xử lý");

            // Cập nhật trạng thái sang PendingCheckOut
            record.CheckOutRequestTime = DateTime.UtcNow;
            record.Status = "PendingCheckOut";
            record.RequestType = "CheckOut";

            await _context.SaveChangesAsync();

            // Gửi thông báo cho Staff và Admin
            await SendNotificationToStaffAndAdminAsync(
                $"Yêu cầu check-out từ {record.Resident.FullName} khỏi phòng {record.Room.RoomNumber}",
                record.Id
            );

            return await MapToDto(record);
        }

        public async Task<bool> CancelPendingCheckInRequestAsync(int residentId, int checkInRecordId)
        {
            var record = await _context.CheckInRecords
                .Include(r => r.Room)
                .Include(r => r.Resident)
                .FirstOrDefaultAsync(r => r.Id == checkInRecordId && r.ResidentId == residentId);

            if (record == null)
                throw new Exception("Không tìm thấy yêu cầu check-in để hủy.");

            if (record.Status != "PendingCheckIn")
                throw new Exception("Chỉ có thể hủy yêu cầu check-in đang chờ phê duyệt.");

            record.Status = "Cancelled";
            record.RejectReason = "Customer cancelled booking request.";

            var pendingInvoice = await _context.Invoices
                .Where(i => i.ResidentId == residentId && i.RoomId == record.RoomId && (i.Status == "Pending" || i.Status == "Created"))
                .OrderByDescending(i => i.CreatedAt)
                .FirstOrDefaultAsync();

            if (pendingInvoice != null)
            {
                pendingInvoice.Status = "Cancelled";
            }

            await _context.SaveChangesAsync();
            return true;
        }

        // Staff/Admin phê duyệt yêu cầu check-in
        public async Task<bool> ApproveCheckInRequestAsync(int requestId, int approverId, bool isApproved, string? rejectReason)
        {
            var record = await _context.CheckInRecords
                .Include(r => r.Room)
                .Include(r => r.Resident)
                .FirstOrDefaultAsync(r => r.Id == requestId);

            if (record == null)
                throw new Exception("Không tìm thấy yêu cầu");

            if (record.Status != "PendingCheckIn")
                throw new Exception("Yêu cầu này không ở trạng thái chờ phê duyệt");

            record.ApprovedBy = approverId;
            record.ApprovedTime = DateTime.UtcNow;

            if (isApproved)
            {
                if (!record.Resident.IdentityVerified)
                    throw new Exception("Cư dân chưa hoàn tất xác minh CCCD. Không thể phê duyệt check-in.");

                var invoice = await _context.Invoices
                    .Where(i => i.ResidentId == record.ResidentId && i.RoomId == record.RoomId)
                    .OrderByDescending(i => i.CreatedAt)
                    .FirstOrDefaultAsync();

                if (invoice == null)
                    throw new Exception("Resident has not been billed for this check-in request.");

                if (!string.Equals(invoice.Status, "Paid", StringComparison.OrdinalIgnoreCase))
                    throw new Exception("Payment has not been completed for this check-in request.");

                // Phê duyệt - cho phép check-in
                record.Status = "CheckedIn";
                record.CheckInTime = DateTime.UtcNow;
                
                // Cập nhật trạng thái phòng
                record.Room.Status = "Occupied";
                record.Room.CurrentResident = record.Resident.FullName; // Cập nhật tên cư dân hiện tại
                
                // Cập nhật thông tin resident
                record.Resident.RoomId = record.RoomId;
                record.Resident.CheckInDate = DateTime.UtcNow;

                // Gửi thông báo cho resident
                await _notificationService.CreateNotificationAsync(new NotificationDto
                {
                    ResidentId = record.ResidentId,
                    Message = $"Yêu cầu check-in vào phòng {record.Room.RoomNumber} đã được phê duyệt",
                    CreatedAt = DateTime.UtcNow,
                    IsRead = false
                });
            }
            else
            {
                // Từ chối
                record.Status = "Rejected";
                record.RejectReason = rejectReason ?? "Không đủ điều kiện";

                var pendingInvoice = await _context.Invoices
                    .Where(i => i.ResidentId == record.ResidentId &&
                                i.RoomId == record.RoomId &&
                                (i.Status == "Pending" || i.Status == "Created"))
                    .OrderByDescending(i => i.CreatedAt)
                    .FirstOrDefaultAsync();

                if (pendingInvoice != null)
                {
                    pendingInvoice.Status = "Cancelled";
                }

                // Gửi thông báo cho resident
                await _notificationService.CreateNotificationAsync(new NotificationDto
                {
                    ResidentId = record.ResidentId,
                    Message = $"Yêu cầu check-in vào phòng {record.Room.RoomNumber} đã bị từ chối. Lý do: {record.RejectReason}",
                    CreatedAt = DateTime.UtcNow,
                    IsRead = false
                });
            }

            await _context.SaveChangesAsync();
            return true;
        }

        // Staff/Admin phê duyệt yêu cầu check-out
        public async Task<bool> ApproveCheckOutRequestAsync(int requestId, int approverId, bool isApproved, string? rejectReason)
        {
            var record = await _context.CheckInRecords
                .Include(r => r.Room)
                .Include(r => r.Resident)
                .FirstOrDefaultAsync(r => r.Id == requestId);

            if (record == null)
                throw new Exception("Không tìm thấy yêu cầu");

            if (record.Status != "PendingCheckOut")
                throw new Exception("Yêu cầu này không ở trạng thái chờ phê duyệt check-out");

            record.ApprovedBy = approverId;
            record.ApprovedTime = DateTime.UtcNow;

            if (isApproved)
            {
                var inspection = await _context.RoomInspections
                    .FirstOrDefaultAsync(x => x.CheckInRecordId == record.Id);

                if (inspection == null)
                    throw new Exception("Chưa có biên bản kiểm tra phòng. Vui lòng kiểm tra phòng trước khi phê duyệt checkout.");

                // Phê duyệt - cho phép check-out
                record.Status = "CheckedOut";
                record.CheckOutTime = DateTime.UtcNow;
                
                // Cập nhật trạng thái phòng
                record.Room.Status = "Available";
                record.Room.CurrentResident = null; // Xóa tên cư dân hiện tại
                
                // Cập nhật thông tin resident
                record.Resident.RoomId = null;
                record.Resident.CheckOutDate = DateTime.UtcNow;

                // Gửi thông báo cho resident
                await _notificationService.CreateNotificationAsync(new NotificationDto
                {
                    ResidentId = record.ResidentId,
                    Message = $"Yêu cầu check-out khỏi phòng {record.Room.RoomNumber} đã được phê duyệt",
                    CreatedAt = DateTime.UtcNow,
                    IsRead = false
                });
            }
            else
            {
                // Từ chối - giữ nguyên trạng thái CheckedIn
                record.Status = "CheckedIn";
                record.CheckOutRequestTime = null;
                record.RejectReason = rejectReason ?? "Không đủ điều kiện";

                // Gửi thông báo cho resident
                await _notificationService.CreateNotificationAsync(new NotificationDto
                {
                    ResidentId = record.ResidentId,
                    Message = $"Yêu cầu check-out khỏi phòng {record.Room.RoomNumber} đã bị từ chối. Lý do: {record.RejectReason}",
                    CreatedAt = DateTime.UtcNow,
                    IsRead = false
                });
            }

            await _context.SaveChangesAsync();
            return true;
        }

        // Lấy danh sách yêu cầu check-in chờ phê duyệt
        public async Task<IEnumerable<CheckInRecordDto>> GetPendingCheckInRequestsAsync()
        {
            var records = await _context.CheckInRecords
                .Include(r => r.Resident)
                .Include(r => r.Room)
                .Where(r => r.Status == "PendingCheckIn")
                .OrderByDescending(r => r.RequestTime)
                .ToListAsync();

            return records.Select(r => MapToDto(r).Result);
        }

        // Lấy danh sách yêu cầu check-out chờ phê duyệt
        public async Task<IEnumerable<CheckInRecordDto>> GetPendingCheckOutRequestsAsync()
        {
            var records = await _context.CheckInRecords
                .Include(r => r.Resident)
                .Include(r => r.Room)
                .Where(r => r.Status == "PendingCheckOut")
                .OrderByDescending(r => r.CheckOutRequestTime)
                .ToListAsync();

            return records.Select(r => MapToDto(r).Result);
        }

        // Lấy trạng thái check-in hiện tại của resident
        public async Task<CheckInRecordDto?> GetCurrentCheckInStatusAsync(int residentId)
        {
            var record = await _context.CheckInRecords
                .Include(r => r.Resident)
                .Include(r => r.Room)
                // ❌ Bỏ Include ApprovedByUser vì không có ForeignKey relationship
                .Where(r => r.ResidentId == residentId && 
                       (r.Status == "PendingCheckIn" || r.Status == "CheckedIn" || r.Status == "PendingCheckOut"))
                .OrderByDescending(r => r.RequestTime)
                .FirstOrDefaultAsync();

            if (record == null)
                return null;

            return await MapToDto(record);
        }

        // Lấy lịch sử check-in của resident
        public async Task<IEnumerable<CheckInRecordDto>> GetCheckInHistoryAsync(int residentId)
        {
            var records = await _context.CheckInRecords
                .Include(r => r.Resident)
                .Include(r => r.Room)
                // ❌ Bỏ Include ApprovedByUser vì không có ForeignKey relationship
                .Where(r => r.ResidentId == residentId)
                .OrderByDescending(r => r.RequestTime)
                .ToListAsync();

            return records.Select(r => MapToDto(r).Result);
        }

        // Lấy tất cả records (cho Staff/Admin)
        public async Task<IEnumerable<CheckInRecordDto>> GetAllCheckInRecordsAsync()
        {
            var records = await _context.CheckInRecords
                .Include(r => r.Resident)
                .Include(r => r.Room)
                // ❌ Bỏ Include ApprovedByUser vì không có ForeignKey relationship
                .OrderByDescending(r => r.RequestTime)
                .ToListAsync();

            return records.Select(r => MapToDto(r).Result);
        }

        // Helper method: Gửi thông báo cho tất cả Staff và Admin
        private async Task SendNotificationToStaffAndAdminAsync(string message, int checkInRecordId)
        {
            // Lấy tất cả Staff và Admin
            var staffAndAdmins = await _context.Users
                .Include(u => u.Role)
                .Where(u => u.Role.Name == "Admin" || u.Role.Name == "Staff")
                .ToListAsync();

            // Tìm Resident liên kết với mỗi User
            foreach (var user in staffAndAdmins)
            {
                var resident = await _context.Residents
                    .FirstOrDefaultAsync(r => r.UserId == user.Id);

                if (resident != null)
                {
                    await _notificationService.CreateNotificationAsync(new NotificationDto
                    {
                        ResidentId = resident.Id,
                        Message = message,
                        CreatedAt = DateTime.UtcNow,
                        IsRead = false
                    });
                }
            }
        }

        // Helper method: Map CheckInRecord sang DTO
        private async Task<CheckInRecordDto> MapToDto(CheckInRecord record)
        {
            if (record.Resident == null)
                record.Resident = await _context.Residents.FindAsync(record.ResidentId);
            
            if (record.Room == null)
                record.Room = await _context.Rooms.FindAsync(record.RoomId);

            // ✅ Query ApprovedByName trực tiếp từ Users table
            // Nếu ApprovedBy = 0 (Admin từ config), set name = "Admin"
            string? approvedByName = null;
            if (record.ApprovedBy.HasValue)
            {
                if (record.ApprovedBy.Value == 0)
                {
                    approvedByName = "Admin"; // Admin từ config không có trong database
                }
                else
                {
                    var approver = await _context.Users.FindAsync(record.ApprovedBy.Value);
                    approvedByName = approver?.UserName;
                }
            }

            return new CheckInRecordDto
            {
                Id = record.Id,
                ResidentId = record.ResidentId,
                ResidentName = record.Resident?.FullName ?? "N/A",
                RoomId = record.RoomId,
                RoomNumber = record.Room?.RoomNumber ?? "N/A",
                RequestTime = record.RequestTime,
                ExpectedCheckInDate = record.ExpectedCheckInDate,
                ExpectedCheckOutDate = record.ExpectedCheckOutDate,
                NumberOfResidents = record.NumberOfResidents,
                ApprovedTime = record.ApprovedTime,
                CheckInTime = record.CheckInTime,
                CheckOutRequestTime = record.CheckOutRequestTime,
                CheckOutTime = record.CheckOutTime,
                Status = record.Status,
                BookingStatus = MapToBusinessBookingStatus(record.Status),
                RejectReason = record.RejectReason,
                ApprovedBy = record.ApprovedBy,
                ApprovedByName = approvedByName,
                RequestType = record.RequestType
            };
        }

        private static string MapToBusinessBookingStatus(string workflowStatus)
        {
            return workflowStatus switch
            {
                "PendingCheckIn" => "Pending",
                "PendingCheckOut" => "Pending",
                "CheckedIn" => "Checked-in",
                "CheckedOut" => "Checked-out",
                "Rejected" => "Cancelled",
                "Cancelled" => "Cancelled",
                _ => "Pending"
            };
        }

        // Helper method: Lấy ResidentId từ UserId
        public async Task<int> GetResidentIdByUserIdAsync(int userId)
        {
            var resident = await _context.Residents
                .Where(r => r.UserId == userId)
                .Select(r => r.Id)
                .FirstOrDefaultAsync();
            
            return resident;
        }
    }
}
