using SORMS.API.DTOs;

namespace SORMS.API.Interfaces
{
    public interface IRoomInspectionService
    {
        Task<RoomInspectionDto> CreateInspectionAsync(int staffUserId, CreateRoomInspectionDto dto);
        Task<RoomInspectionDto?> GetByCheckInRecordIdAsync(int checkInRecordId);
    }
}
