using Microsoft.EntityFrameworkCore;
using SORMS.API.Data;
using SORMS.API.DTOs;
using SORMS.API.Interfaces;
using SORMS.API.Models;

namespace SORMS.API.Services
{
    public class RoomInspectionService : IRoomInspectionService
    {
        private readonly SormsDbContext _context;

        public RoomInspectionService(SormsDbContext context)
        {
            _context = context;
        }

        public async Task<RoomInspectionDto> CreateInspectionAsync(int staffUserId, CreateRoomInspectionDto dto)
        {
            var record = await _context.CheckInRecords
                .Include(x => x.Resident)
                .FirstOrDefaultAsync(x => x.Id == dto.CheckInRecordId);

            if (record == null)
                throw new Exception("Không tìm thấy bản ghi check-in/check-out.");

            if (record.Status != "PendingCheckOut")
                throw new Exception("Chỉ được kiểm tra phòng khi đang chờ checkout.");

            var existing = await _context.RoomInspections.FirstOrDefaultAsync(i => i.CheckInRecordId == dto.CheckInRecordId);
            if (existing != null)
                throw new Exception("Bản ghi kiểm tra phòng đã tồn tại.");

            var inspection = new RoomInspection
            {
                CheckInRecordId = dto.CheckInRecordId,
                InspectedByUserId = staffUserId,
                InspectedAt = DateTime.UtcNow,
                FurnitureStatus = dto.FurnitureStatus,
                EquipmentStatus = dto.EquipmentStatus,
                RoomConditionStatus = dto.RoomConditionStatus,
                Result = dto.Result,
                AdditionalFee = dto.AdditionalFee,
                Notes = dto.Notes
            };

            _context.RoomInspections.Add(inspection);

            if (inspection.AdditionalFee > 0)
            {
                var invoice = new Invoice
                {
                    ResidentId = record.ResidentId,
                    RoomId = record.RoomId,
                    Amount = inspection.AdditionalFee,
                    Status = "Pending",
                    Description = $"Additional checkout fee for room inspection (Record #{record.Id})",
                    CreatedAt = DateTime.UtcNow
                };
                _context.Invoices.Add(invoice);
            }

            await _context.SaveChangesAsync();
            return MapToDto(inspection);
        }

        public async Task<RoomInspectionDto?> GetByCheckInRecordIdAsync(int checkInRecordId)
        {
            var inspection = await _context.RoomInspections
                .FirstOrDefaultAsync(x => x.CheckInRecordId == checkInRecordId);

            return inspection == null ? null : MapToDto(inspection);
        }

        private static RoomInspectionDto MapToDto(RoomInspection inspection)
        {
            return new RoomInspectionDto
            {
                Id = inspection.Id,
                CheckInRecordId = inspection.CheckInRecordId,
                InspectedByUserId = inspection.InspectedByUserId,
                InspectedAt = inspection.InspectedAt,
                FurnitureStatus = inspection.FurnitureStatus,
                EquipmentStatus = inspection.EquipmentStatus,
                RoomConditionStatus = inspection.RoomConditionStatus,
                Result = inspection.Result,
                AdditionalFee = inspection.AdditionalFee,
                Notes = inspection.Notes
            };
        }
    }
}
