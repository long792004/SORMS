using SORMS.API.DTOs;

namespace SORMS.API.Interfaces
{
    public interface IVoucherService
    {
        Task<List<VoucherResponseDto>> GetAllVouchersAsync();
        Task<VoucherResponseDto?> GetVoucherByIdAsync(int id);
        Task<VoucherResponseDto> CreateVoucherAsync(VoucherCreateDto voucherDto);
        Task<VoucherResponseDto> UpdateVoucherAsync(int id, VoucherUpdateDto voucherDto);
        Task<bool> DeleteVoucherAsync(int id);
        Task<VoucherResponseDto> ToggleActiveAsync(int id);
    }
}