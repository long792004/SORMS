using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SORMS.API.Migrations
{
    /// <inheritdoc />
    public partial class AddBookingFormFieldsAndHotelPayment : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "PaymentMethod",
                table: "Invoices",
                type: "character varying(30)",
                maxLength: 30,
                nullable: false,
                defaultValue: "PayOS");

            migrationBuilder.AddColumn<string>(
                name: "BedPreference",
                table: "CheckInRecords",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "BookerEmail",
                table: "CheckInRecords",
                type: "character varying(120)",
                maxLength: 120,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "BookerFullName",
                table: "CheckInRecords",
                type: "character varying(120)",
                maxLength: 120,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "BookerIdentityNumber",
                table: "CheckInRecords",
                type: "character varying(30)",
                maxLength: 30,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "BookerPhone",
                table: "CheckInRecords",
                type: "character varying(30)",
                maxLength: 30,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "EarlyCheckInRequested",
                table: "CheckInRecords",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "GuestList",
                table: "CheckInRecords",
                type: "character varying(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SmokingPreference",
                table: "CheckInRecords",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PaymentMethod",
                table: "Invoices");

            migrationBuilder.DropColumn(
                name: "BedPreference",
                table: "CheckInRecords");

            migrationBuilder.DropColumn(
                name: "BookerEmail",
                table: "CheckInRecords");

            migrationBuilder.DropColumn(
                name: "BookerFullName",
                table: "CheckInRecords");

            migrationBuilder.DropColumn(
                name: "BookerIdentityNumber",
                table: "CheckInRecords");

            migrationBuilder.DropColumn(
                name: "BookerPhone",
                table: "CheckInRecords");

            migrationBuilder.DropColumn(
                name: "EarlyCheckInRequested",
                table: "CheckInRecords");

            migrationBuilder.DropColumn(
                name: "GuestList",
                table: "CheckInRecords");

            migrationBuilder.DropColumn(
                name: "SmokingPreference",
                table: "CheckInRecords");
        }
    }
}
