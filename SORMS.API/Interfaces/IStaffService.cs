using SORMS.API.DTOs;

namespace SORMS.API.Interfaces
{
    public interface IStaffService
    {
        Task<IEnumerable<StaffDto>> GetAllStaffAsync();
        Task<StaffDto> GetStaffByIdAsync(int id);
        Task<bool> UpdateStaffAsync(int id, StaffDto staffDto);
        Task<bool> DeleteStaffAsync(int id);
    }

}
