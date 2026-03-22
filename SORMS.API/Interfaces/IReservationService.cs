using SORMS.API.DTOs;

namespace SORMS.API.Interfaces
{
    public interface IReservationService
    {
        Task<ReservationDto> CreateReservationAsync(int userId, CreateReservationDto dto);
        Task<IEnumerable<ReservationDto>> GetMyReservationsAsync(int userId);
        Task<IEnumerable<ReservationDto>> GetAllReservationsAsync();
        Task<ReservationDto?> GetByIdAsync(int reservationId);
        Task<bool> CancelReservationAsync(int reservationId, int userId, string? reason);
        Task<bool> ConfirmPaymentAsync(int reservationId, long orderCode);
        Task<int> ExpireHeldReservationsAsync();
    }
}
