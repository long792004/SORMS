using SORMS.API.DTOs;

public interface IResidentService
{
    Task<IEnumerable<ResidentDto>> GetAllResidentsAsync();
    Task<ResidentDto> GetResidentByIdAsync(int id);
    Task<ResidentDto> CreateResidentAsync(ResidentDto residentDto);
    Task<bool> UpdateResidentAsync(int id, ResidentDto residentDto);
    Task<bool> DeleteResidentAsync(int id);

    Task<IEnumerable<ResidentDto>> GetResidentsByRoomIdAsync(int roomId);
    Task<bool> CheckInAsync(int residentId, DateTime checkInDate);
    Task<bool> CheckOutAsync(int residentId, DateTime checkOutDate);

    Task<bool> UpdateResidentAccountAsync(int userId, string email, string phone);
    Task<bool> UpdateResidentProfileAsync(int userId, string? address, string? emergencyContact, string? notes);
    Task<ResidentDto> GetResidentByUserIdAsync(int userId);
}
