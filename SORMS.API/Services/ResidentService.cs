namespace SORMS.API.Services
{
    using Microsoft.EntityFrameworkCore;
    using SORMS.API.Data;
    using SORMS.API.DTOs;
    using SORMS.API.Models;

    public class ResidentService : IResidentService
    {
        private readonly SormsDbContext _context;

        public ResidentService(SormsDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<ResidentDto>> GetAllResidentsAsync()
        {
            var residents = await _context.Residents
                .Include(r => r.Room)
                .Include(r => r.User)
                .ToListAsync();

            return residents.Select(r => new ResidentDto
            {
                Id = r.Id,
                UserId = r.UserId,
                UserName = r.User?.UserName,
                FullName = r.FullName,
                Email = r.Email,
                Phone = r.Phone,
                IdentityNumber = r.IdentityNumber,
                IdentityDocumentUrl = r.IdentityDocumentUrl,
                IdentityVerified = r.IdentityVerified,
                Role = r.Role,
                RoomId = r.RoomId,
                RoomNumber = r.Room?.RoomNumber,
                CheckInDate = r.CheckInDate,
                CheckOutDate = r.CheckOutDate,
                Address = r.Address,
                EmergencyContact = r.EmergencyContact,
                Notes = r.Notes,
                IsActive = r.IsActive,
                Gender = r.Gender,
                DateOfBirth = r.DateOfBirth
            });
        }

        public async Task<ResidentDto> GetResidentByIdAsync(int id)
        {
            var resident = await _context.Residents
                .Include(r => r.Room)
                .Include(r => r.User)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (resident == null) return null!;

            return new ResidentDto
            {
                Id = resident.Id,
                UserId = resident.UserId,
                UserName = resident.User?.UserName,
                FullName = resident.FullName,
                Email = resident.Email,
                Phone = resident.Phone,
                IdentityNumber = resident.IdentityNumber,
                IdentityDocumentUrl = resident.IdentityDocumentUrl,
                IdentityVerified = resident.IdentityVerified,
                Role = resident.Role,
                RoomId = resident.RoomId,
                RoomNumber = resident.Room?.RoomNumber,
                CheckInDate = resident.CheckInDate,
                CheckOutDate = resident.CheckOutDate,
                Address = resident.Address,
                EmergencyContact = resident.EmergencyContact,
                Notes = resident.Notes,
                IsActive = resident.IsActive,
                Gender = resident.Gender,
                DateOfBirth = resident.DateOfBirth
            };
        }

        public async Task<ResidentDto> CreateResidentAsync(ResidentDto residentDto)
        {
            User? createdUser = null;

            if (!string.IsNullOrWhiteSpace(residentDto.Password))
            {
                var requestedUserName = string.IsNullOrWhiteSpace(residentDto.UserName)
                    ? residentDto.Email
                    : residentDto.UserName;

                if (string.IsNullOrWhiteSpace(requestedUserName))
                    throw new InvalidOperationException("Username is required when creating resident account.");

                var hasDuplicateUser = await _context.Users.AnyAsync(u => u.UserName == requestedUserName || u.Email == residentDto.Email);
                if (hasDuplicateUser)
                    throw new InvalidOperationException("Username or email already exists.");

                createdUser = new User
                {
                    UserName = requestedUserName,
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword(residentDto.Password),
                    RoleId = 3,
                    IsActive = true,
                    Email = residentDto.Email
                };

                _context.Users.Add(createdUser);
                await _context.SaveChangesAsync();
            }

            var resident = new Resident
            {
                UserId = createdUser?.Id ?? residentDto.UserId,
                FullName = residentDto.FullName,
                Email = residentDto.Email,
                Phone = string.IsNullOrWhiteSpace(residentDto.Phone) ? residentDto.PhoneNumber : residentDto.Phone,
                IdentityNumber = residentDto.IdentityNumber,
                Role = residentDto.Role,
                RoomId = residentDto.RoomId,
                CheckInDate = residentDto.CheckInDate.HasValue ? residentDto.CheckInDate.Value : DateTime.UtcNow,
                CheckOutDate = residentDto.CheckOutDate,
                Address = residentDto.Address,
                EmergencyContact = residentDto.EmergencyContact,
                Notes = residentDto.Notes,
                IsActive = residentDto.IsActive.HasValue ? residentDto.IsActive.Value : true,
                Gender = residentDto.Gender,
                DateOfBirth = residentDto.DateOfBirth
            };

            _context.Residents.Add(resident);
            await _context.SaveChangesAsync();

            residentDto.Id = resident.Id;
            return residentDto;
        }

        public async Task<bool> UpdateResidentAsync(int id, ResidentDto residentDto)
        {
            var resident = await _context.Residents.FindAsync(id);
            if (resident == null) return false;

            resident.UserId = residentDto.UserId;
            resident.FullName = residentDto.FullName;
            resident.Email = residentDto.Email;
            resident.Phone = string.IsNullOrWhiteSpace(residentDto.Phone) ? residentDto.PhoneNumber : residentDto.Phone;
            resident.IdentityNumber = residentDto.IdentityNumber;
            if (residentDto.IdentityDocumentUrl != null) 
            {
                resident.IdentityDocumentUrl = residentDto.IdentityDocumentUrl;
                resident.IdentityVerified = residentDto.IdentityVerified;
            }
            resident.Role = residentDto.Role;
            resident.RoomId = residentDto.RoomId;
            
            if (residentDto.CheckInDate.HasValue)
                resident.CheckInDate = residentDto.CheckInDate.Value;
            
            resident.CheckOutDate = residentDto.CheckOutDate;
            resident.Address = residentDto.Address;
            resident.EmergencyContact = residentDto.EmergencyContact;
            resident.Notes = residentDto.Notes;
            resident.Gender = residentDto.Gender;
            resident.DateOfBirth = residentDto.DateOfBirth;
            
            if (residentDto.IsActive.HasValue)
                resident.IsActive = residentDto.IsActive.Value;

            if (resident.UserId.HasValue)
            {
                var linkedUser = await _context.Users.FindAsync(resident.UserId.Value);
                if (linkedUser != null)
                {
                    linkedUser.Email = residentDto.Email;

                    if (!string.IsNullOrWhiteSpace(residentDto.UserName))
                        linkedUser.UserName = residentDto.UserName;

                    if (!string.IsNullOrWhiteSpace(residentDto.Password))
                        linkedUser.PasswordHash = BCrypt.Net.BCrypt.HashPassword(residentDto.Password);
                }
            }

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteResidentAsync(int id)
        {
            var resident = await _context.Residents
                .Include(r => r.User)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (resident == null) return false;

            await using var transaction = await _context.Database.BeginTransactionAsync();

            try
            {
                var residentCheckInIds = await _context.CheckInRecords
                    .Where(record => record.ResidentId == id)
                    .Select(record => record.Id)
                    .ToListAsync();

                var reviews = await _context.Reviews
                    .Where(review => review.ResidentId == id || residentCheckInIds.Contains(review.CheckInId))
                    .ToListAsync();
                if (reviews.Count > 0)
                {
                    _context.Reviews.RemoveRange(reviews);
                }

                var checkInRecords = await _context.CheckInRecords
                    .Where(record => record.ResidentId == id)
                    .ToListAsync();
                if (checkInRecords.Count > 0)
                {
                    _context.CheckInRecords.RemoveRange(checkInRecords);
                }

                var invoices = await _context.Invoices
                    .Where(invoice => invoice.ResidentId == id)
                    .ToListAsync();
                if (invoices.Count > 0)
                {
                    _context.Invoices.RemoveRange(invoices);
                }

                var serviceRequests = await _context.ServiceRequests
                    .Where(request => request.ResidentId == id)
                    .ToListAsync();
                if (serviceRequests.Count > 0)
                {
                    _context.ServiceRequests.RemoveRange(serviceRequests);
                }

                var notifications = await _context.Notifications
                    .Where(notification => notification.ResidentId == id)
                    .ToListAsync();
                if (notifications.Count > 0)
                {
                    _context.Notifications.RemoveRange(notifications);
                }

                _context.Residents.Remove(resident);

                if (resident.User != null)
                {
                    _context.Users.Remove(resident.User);
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return true;
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }

        }

        public async Task<IEnumerable<ResidentDto>> GetResidentsByRoomIdAsync(int roomId)
        {
            var residents = await _context.Residents
                .Where(r => r.RoomId == roomId)
                .ToListAsync();

            return residents.Select(r => new ResidentDto
            {
                Id = r.Id,
                UserId = r.UserId,
                FullName = r.FullName,
                Email = r.Email,
                Phone = r.Phone,
                IdentityNumber = r.IdentityNumber,
                IdentityDocumentUrl = r.IdentityDocumentUrl,
                IdentityVerified = r.IdentityVerified,
                Role = r.Role,
                RoomId = r.RoomId,
                RoomNumber = r.Room?.RoomNumber,
                CheckInDate = r.CheckInDate,
                CheckOutDate = r.CheckOutDate,
                Address = r.Address,
                EmergencyContact = r.EmergencyContact,
                Notes = r.Notes,
                IsActive = r.IsActive,
                Gender = r.Gender,
                DateOfBirth = r.DateOfBirth
            });
        }

        public async Task<bool> CheckInAsync(int residentId, DateTime checkInDate)
        {
            var resident = await _context.Residents.FindAsync(residentId);
            if (resident == null || resident.CheckInDate != default)
                return false;

            resident.CheckInDate = checkInDate;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> CheckOutAsync(int residentId, DateTime checkOutDate)
        {
            var resident = await _context.Residents.FindAsync(residentId);
            if (resident == null || resident.CheckOutDate != null)
                return false;

            resident.CheckOutDate = checkOutDate;
            await _context.SaveChangesAsync();
            return true;
        }

        // =================== Settings Methods ===================

        public async Task<ResidentDto> GetResidentByUserIdAsync(int userId)
        {
            var resident = await _context.Residents
                .Include(r => r.Room)
                .Include(r => r.User)
                .FirstOrDefaultAsync(r => r.UserId == userId);

            if (resident == null) return null!;

            return new ResidentDto
            {
                Id = resident.Id,
                UserId = resident.UserId,
                UserName = resident.User?.UserName,
                FullName = resident.FullName,
                Email = resident.Email,
                Phone = resident.Phone,
                IdentityNumber = resident.IdentityNumber,
                IdentityDocumentUrl = resident.IdentityDocumentUrl,
                IdentityVerified = resident.IdentityVerified,
                Role = resident.Role,
                RoomId = resident.RoomId,
                RoomNumber = resident.Room?.RoomNumber,
                CheckInDate = resident.CheckInDate,
                CheckOutDate = resident.CheckOutDate,
                Address = resident.Address,
                EmergencyContact = resident.EmergencyContact,
                Notes = resident.Notes,
                IsActive = resident.IsActive,
                Gender = resident.Gender,
                DateOfBirth = resident.DateOfBirth
            };
        }

        public async Task<bool> UpdateResidentAccountAsync(int userId, string email, string phone)
        {
            var resident = await _context.Residents
                .FirstOrDefaultAsync(r => r.UserId == userId);

            if (resident == null) return false;

            var user = await _context.Users.FindAsync(userId);
            if (user != null)
            {
                var emailInUse = await _context.Users.AnyAsync(u => u.Email == email && u.Id != userId);
                if (emailInUse)
                    return false;

                user.Email = email;
            }

            resident.Email = email;
            resident.Phone = phone ?? "";

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> UpdateResidentProfileAsync(int userId, string? address, string? emergencyContact, string? notes, string? identityDocumentUrl)
        {
            var resident = await _context.Residents
                .FirstOrDefaultAsync(r => r.UserId == userId);

            if (resident == null) return false;

            resident.Address = address;
            resident.EmergencyContact = emergencyContact;
            resident.Notes = notes;

            if (!string.IsNullOrWhiteSpace(identityDocumentUrl))
            {
                resident.IdentityDocumentUrl = identityDocumentUrl;
                // Nếu resident upload giấy tờ mới, reset trạng thái xác minh
                resident.IdentityVerified = false;
                resident.IdentityVerifiedAt = null;
                resident.IdentityVerifiedByUserId = null;
            }

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> VerifyIdentityAsync(int residentId, int verifiedByUserId, bool isVerified, string? identityDocumentUrl)
        {
            var resident = await _context.Residents.FirstOrDefaultAsync(r => r.Id == residentId && r.IsActive);
            if (resident == null)
                return false;

            resident.IdentityVerified = isVerified;
            resident.IdentityVerifiedAt = DateTime.UtcNow;
            resident.IdentityVerifiedByUserId = verifiedByUserId;

            if (!string.IsNullOrWhiteSpace(identityDocumentUrl))
            {
                resident.IdentityDocumentUrl = identityDocumentUrl.Trim();
            }

            await _context.SaveChangesAsync();
            return true;
        }
    }

}
