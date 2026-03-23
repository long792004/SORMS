using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SORMS.API.Migrations
{
    /// <inheritdoc />
    public partial class AddCheckInReservationLink : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ReservationId",
                table: "CheckInRecords",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_CheckInRecords_ReservationId",
                table: "CheckInRecords",
                column: "ReservationId");

            migrationBuilder.AddForeignKey(
                name: "FK_CheckInRecords_Reservations_ReservationId",
                table: "CheckInRecords",
                column: "ReservationId",
                principalTable: "Reservations",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_CheckInRecords_Reservations_ReservationId",
                table: "CheckInRecords");

            migrationBuilder.DropIndex(
                name: "IX_CheckInRecords_ReservationId",
                table: "CheckInRecords");

            migrationBuilder.DropColumn(
                name: "ReservationId",
                table: "CheckInRecords");
        }
    }
}
