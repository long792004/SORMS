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
                .Where(r => r.IsActive)
                .ToListAsync();

            return residents.Select(r => new ResidentDto
            {
                Id = r.Id,
                UserId = r.UserId,
                FullName = r.FullName,
                Email = r.Email,
                Phone = r.Phone,
                IdentityNumber = r.IdentityNumber,
                Role = r.Role,
                RoomId = r.RoomId,
                RoomNumber = r.Room?.RoomNumber,
                CheckInDate = r.CheckInDate,
                CheckOutDate = r.CheckOutDate,
                Address = r.Address,
                EmergencyContact = r.EmergencyContact,
                Notes = r.Notes,
                IsActive = r.IsActive
            });
        }

        public async Task<ResidentDto> GetResidentByIdAsync(int id)
        {
            var resident = await _context.Residents
                .Include(r => r.Room)
                .Include(r => r.User)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (resident == null) return null;

            return new ResidentDto
            {
                Id = resident.Id,
                UserId = resident.UserId,
                FullName = resident.FullName,
                Email = resident.Email,
                Phone = resident.Phone,
                IdentityNumber = resident.IdentityNumber,
                Role = resident.Role,
                RoomId = resident.RoomId,
                RoomNumber = resident.Room?.RoomNumber,
                CheckInDate = resident.CheckInDate,
                CheckOutDate = resident.CheckOutDate,
                Address = resident.Address,
                EmergencyContact = resident.EmergencyContact,
                Notes = resident.Notes,
                IsActive = resident.IsActive
            };
        }

        public async Task<ResidentDto> CreateResidentAsync(ResidentDto residentDto)
        {
            var resident = new Resident
            {
                UserId = residentDto.UserId,
                FullName = residentDto.FullName,
                Email = residentDto.Email,
                Phone = residentDto.Phone,
                IdentityNumber = residentDto.IdentityNumber,
                Role = residentDto.Role,
                RoomId = residentDto.RoomId,
                CheckInDate = residentDto.CheckInDate.HasValue ? residentDto.CheckInDate.Value : DateTime.UtcNow,
                CheckOutDate = residentDto.CheckOutDate,
                Address = residentDto.Address,
                EmergencyContact = residentDto.EmergencyContact,
                Notes = residentDto.Notes,
                IsActive = residentDto.IsActive.HasValue ? residentDto.IsActive.Value : true
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
            resident.Phone = residentDto.Phone;
            resident.IdentityNumber = residentDto.IdentityNumber;
            resident.Role = residentDto.Role;
            resident.RoomId = residentDto.RoomId;
            
            if (residentDto.CheckInDate.HasValue)
                resident.CheckInDate = residentDto.CheckInDate.Value;
            
            resident.CheckOutDate = residentDto.CheckOutDate;
            resident.Address = residentDto.Address;
            resident.EmergencyContact = residentDto.EmergencyContact;
            resident.Notes = residentDto.Notes;
            
            if (residentDto.IsActive.HasValue)
                resident.IsActive = residentDto.IsActive.Value;

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteResidentAsync(int id)
        {
            var resident = await _context.Residents.FindAsync(id);
            if (resident == null) return false;

            // Find and delete the corresponding User account with the same email
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == resident.Email);
            if (user != null)
            {
                _context.Users.Remove(user);
            }

            // Delete the resident record
            _context.Residents.Remove(resident);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<IEnumerable<ResidentDto>> GetResidentsByRoomIdAsync(int roomId)
        {
            var residents = await _context.Residents
                .Where(r => r.RoomId == roomId && r.IsActive)
                .ToListAsync();

            return residents.Select(r => new ResidentDto
            {
                Id = r.Id,
                UserId = r.UserId,
                FullName = r.FullName,
                Email = r.Email,
                Phone = r.Phone,
                IdentityNumber = r.IdentityNumber,
                Role = r.Role,
                RoomId = r.RoomId,
                RoomNumber = r.Room?.RoomNumber,
                CheckInDate = r.CheckInDate,
                CheckOutDate = r.CheckOutDate,
                Address = r.Address,
                EmergencyContact = r.EmergencyContact,
                Notes = r.Notes,
                IsActive = r.IsActive
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
                .FirstOrDefaultAsync(r => r.UserId == userId && r.IsActive);

            if (resident == null) return null;

            return new ResidentDto
            {
                Id = resident.Id,
                UserId = resident.UserId,
                FullName = resident.FullName,
                Email = resident.Email,
                Phone = resident.Phone,
                IdentityNumber = resident.IdentityNumber,
                Role = resident.Role,
                RoomId = resident.RoomId,
                RoomNumber = resident.Room?.RoomNumber,
                CheckInDate = resident.CheckInDate,
                CheckOutDate = resident.CheckOutDate,
                Address = resident.Address,
                EmergencyContact = resident.EmergencyContact,
                Notes = resident.Notes,
                IsActive = resident.IsActive
            };
        }

        public async Task<bool> UpdateResidentAccountAsync(int userId, string email, string phone)
        {
            var resident = await _context.Residents
                .FirstOrDefaultAsync(r => r.UserId == userId && r.IsActive);

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

        public async Task<bool> UpdateResidentProfileAsync(int userId, string? address, string? emergencyContact, string? notes)
        {
            var resident = await _context.Residents
                .FirstOrDefaultAsync(r => r.UserId == userId && r.IsActive);

            if (resident == null) return false;

            resident.Address = address;
            resident.EmergencyContact = emergencyContact;
            resident.Notes = notes;

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
