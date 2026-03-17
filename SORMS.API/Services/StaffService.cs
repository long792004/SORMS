using Microsoft.EntityFrameworkCore;
using SORMS.API.Data;
using SORMS.API.DTOs;
using SORMS.API.Interfaces;
using SORMS.API.Models;

namespace SORMS.API.Services
{
    public class StaffService : IStaffService
    {
        private readonly SormsDbContext _context;

        public StaffService(SormsDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<StaffDto>> GetAllStaffAsync()
        {
            return await _context.Staffs
                .Select(s => new StaffDto
                {
                    Id = s.Id,
                    FullName = s.FullName,
                    Email = s.Email,
                    Phone = s.Phone,
                    IdentityNumber = s.IdentityNumber,
                    Gender = s.Gender,
                    DateOfBirth = s.DateOfBirth
                })
                .ToListAsync();
        }

        public async Task<StaffDto> GetStaffByIdAsync(int id)
        {
            var staff = await _context.Staffs.FindAsync(id);
            if (staff == null) return null;

            return new StaffDto
            {
                Id = staff.Id,
                FullName = staff.FullName,
                Email = staff.Email,
                Phone = staff.Phone,
                IdentityNumber = staff.IdentityNumber,
                Gender = staff.Gender,
                DateOfBirth = staff.DateOfBirth
            };
        }

        public async Task<bool> UpdateStaffAsync(int id, StaffDto staffDto)
        {
            var staff = await _context.Staffs.FindAsync(id);
            if (staff == null) return false;

            staff.FullName = staffDto.FullName;
            staff.Email = staffDto.Email;
            staff.Phone = staffDto.Phone;
            staff.IdentityNumber = staffDto.IdentityNumber;
            staff.Gender = staffDto.Gender;
            staff.DateOfBirth = staffDto.DateOfBirth;

            _context.Staffs.Update(staff);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteStaffAsync(int id)
        {
            var staff = await _context.Staffs.FindAsync(id);
            if (staff == null) return false;

            // Find and delete the corresponding User account with the same email
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == staff.Email);
            if (user != null)
            {
                _context.Users.Remove(user);
            }

            // Delete the staff record
            _context.Staffs.Remove(staff);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
