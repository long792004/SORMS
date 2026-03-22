using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using SORMS.API.Data;
using SORMS.API.DTOs;
using SORMS.API.Interfaces;
using SORMS.API.Models;

namespace SORMS.API.Services
{
    public class VoucherService : IVoucherService
    {
        private readonly SormsDbContext _context;
        private readonly ILogger<VoucherService> _logger;

        public VoucherService(SormsDbContext context, ILogger<VoucherService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<List<VoucherResponseDto>> GetAllVouchersAsync()
        {
            try
            {
                var vouchers = await _context.Vouchers
                    .OrderByDescending(v => v.CreatedAt)
                    .ToListAsync();

                return vouchers.Select(MapToDto).ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting vouchers");
                throw;
            }
        }

        public async Task<VoucherResponseDto?> GetVoucherByIdAsync(int id)
        {
            try
            {
                var voucher = await _context.Vouchers.FirstOrDefaultAsync(v => v.Id == id);
                return voucher == null ? null : MapToDto(voucher);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting voucher {VoucherId}", id);
                throw;
            }
        }

        public async Task<VoucherResponseDto> CreateVoucherAsync(VoucherCreateDto voucherDto)
        {
            try
            {
                ValidateVoucherPayload(voucherDto.DiscountType, voucherDto.Value, voucherDto.MinInvoiceAmount, voucherDto.MaxDiscountAmount, voucherDto.UsageLimit, voucherDto.StartDate, voucherDto.EndDate);

                var normalizedCode = NormalizeCode(voucherDto.Code);
                var exists = await _context.Vouchers.AnyAsync(v => v.Code == normalizedCode);
                if (exists)
                {
                    throw new InvalidOperationException("Voucher code already exists.");
                }

                var voucher = new Voucher
                {
                    Code = normalizedCode,
                    Description = voucherDto.Description?.Trim(),
                    DiscountType = NormalizeDiscountType(voucherDto.DiscountType),
                    Value = voucherDto.Value,
                    MinInvoiceAmount = voucherDto.MinInvoiceAmount,
                    MaxDiscountAmount = voucherDto.MaxDiscountAmount,
                    UsageLimit = voucherDto.UsageLimit,
                    UsedCount = 0,
                    StartDate = DateTime.SpecifyKind(voucherDto.StartDate, DateTimeKind.Utc),
                    EndDate = DateTime.SpecifyKind(voucherDto.EndDate, DateTimeKind.Utc),
                    IsActive = voucherDto.IsActive,
                    CreatedAt = DateTime.UtcNow
                };

                _context.Vouchers.Add(voucher);
                await _context.SaveChangesAsync();

                return MapToDto(voucher);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating voucher");
                throw;
            }
        }

        public async Task<VoucherResponseDto> UpdateVoucherAsync(int id, VoucherUpdateDto voucherDto)
        {
            try
            {
                ValidateVoucherPayload(voucherDto.DiscountType, voucherDto.Value, voucherDto.MinInvoiceAmount, voucherDto.MaxDiscountAmount, voucherDto.UsageLimit, voucherDto.StartDate, voucherDto.EndDate);

                var voucher = await _context.Vouchers.FirstOrDefaultAsync(v => v.Id == id);
                if (voucher == null)
                {
                    throw new KeyNotFoundException("Voucher not found.");
                }

                var normalizedCode = NormalizeCode(voucherDto.Code);
                var duplicateCode = await _context.Vouchers.AnyAsync(v => v.Id != id && v.Code == normalizedCode);
                if (duplicateCode)
                {
                    throw new InvalidOperationException("Voucher code already exists.");
                }

                if (voucherDto.UsageLimit < voucher.UsedCount)
                {
                    throw new InvalidOperationException("Usage limit cannot be less than the number of times the voucher has already been used.");
                }

                voucher.Code = normalizedCode;
                voucher.Description = voucherDto.Description?.Trim();
                voucher.DiscountType = NormalizeDiscountType(voucherDto.DiscountType);
                voucher.Value = voucherDto.Value;
                voucher.MinInvoiceAmount = voucherDto.MinInvoiceAmount;
                voucher.MaxDiscountAmount = voucherDto.MaxDiscountAmount;
                voucher.UsageLimit = voucherDto.UsageLimit;
                voucher.StartDate = DateTime.SpecifyKind(voucherDto.StartDate, DateTimeKind.Utc);
                voucher.EndDate = DateTime.SpecifyKind(voucherDto.EndDate, DateTimeKind.Utc);
                voucher.IsActive = voucherDto.IsActive;
                voucher.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();
                return MapToDto(voucher);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating voucher {VoucherId}", id);
                throw;
            }
        }

        public async Task<bool> DeleteVoucherAsync(int id)
        {
            try
            {
                var voucher = await _context.Vouchers.FirstOrDefaultAsync(v => v.Id == id);
                if (voucher == null)
                {
                    return false;
                }

                var hasInvoices = await _context.Invoices.AnyAsync(i => i.VoucherId == id);
                if (hasInvoices)
                {
                    throw new InvalidOperationException("Cannot delete a voucher that has already been applied to an invoice.");
                }

                _context.Vouchers.Remove(voucher);
                await _context.SaveChangesAsync();
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting voucher {VoucherId}", id);
                throw;
            }
        }

        public async Task<VoucherResponseDto> ToggleActiveAsync(int id)
        {
            try
            {
                var voucher = await _context.Vouchers.FirstOrDefaultAsync(v => v.Id == id);
                if (voucher == null)
                {
                    throw new KeyNotFoundException("Voucher not found.");
                }

                voucher.IsActive = !voucher.IsActive;
                voucher.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();
                return MapToDto(voucher);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error toggling voucher {VoucherId}", id);
                throw;
            }
        }

        private static string NormalizeCode(string code)
        {
            if (string.IsNullOrWhiteSpace(code))
            {
                throw new ArgumentException("Voucher code is required.");
            }

            return code.Trim().ToUpperInvariant();
        }

        private static string NormalizeDiscountType(string discountType)
        {
            if (string.Equals(discountType, "FixedAmount", StringComparison.OrdinalIgnoreCase))
            {
                return "FixedAmount";
            }

            if (string.Equals(discountType, "Percentage", StringComparison.OrdinalIgnoreCase))
            {
                return "Percentage";
            }

            throw new InvalidOperationException("Discount type must be either FixedAmount or Percentage.");
        }

        private static void ValidateVoucherPayload(string discountType, decimal value, decimal minInvoiceAmount, decimal? maxDiscountAmount, int usageLimit, DateTime startDate, DateTime endDate)
        {
            var normalizedDiscountType = NormalizeDiscountType(discountType);

            if (value <= 0)
            {
                throw new InvalidOperationException("Voucher value must be greater than 0.");
            }

            if (normalizedDiscountType == "Percentage" && value > 100)
            {
                throw new InvalidOperationException("Percentage vouchers cannot exceed 100%.");
            }

            if (minInvoiceAmount < 0)
            {
                throw new InvalidOperationException("Minimum invoice amount cannot be negative.");
            }

            if (maxDiscountAmount.HasValue && maxDiscountAmount.Value < 0)
            {
                throw new InvalidOperationException("Max discount amount cannot be negative.");
            }

            if (usageLimit <= 0)
            {
                throw new InvalidOperationException("Usage limit must be greater than 0.");
            }

            if (endDate < startDate)
            {
                throw new InvalidOperationException("Voucher end date must be greater than or equal to the start date.");
            }
        }

        private static VoucherResponseDto MapToDto(Voucher voucher)
        {
            return new VoucherResponseDto
            {
                Id = voucher.Id,
                Code = voucher.Code,
                Description = voucher.Description,
                DiscountType = voucher.DiscountType,
                Value = voucher.Value,
                MinInvoiceAmount = voucher.MinInvoiceAmount,
                MaxDiscountAmount = voucher.MaxDiscountAmount,
                UsageLimit = voucher.UsageLimit,
                UsedCount = voucher.UsedCount,
                RemainingUsage = Math.Max(0, voucher.UsageLimit - voucher.UsedCount),
                StartDate = voucher.StartDate,
                EndDate = voucher.EndDate,
                IsActive = voucher.IsActive,
                CreatedAt = voucher.CreatedAt,
                UpdatedAt = voucher.UpdatedAt
            };
        }
    }
}