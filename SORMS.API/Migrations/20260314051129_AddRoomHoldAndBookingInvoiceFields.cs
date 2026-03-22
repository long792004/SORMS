using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SORMS.API.Migrations
{
    /// <inheritdoc />
    public partial class AddRoomHoldAndBookingInvoiceFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "HoldExpiresAt",
                table: "Rooms",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "BookingCheckInDate",
                table: "Invoices",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "BookingCheckOutDate",
                table: "Invoices",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "BookingNumberOfResidents",
                table: "Invoices",
                type: "integer",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "HoldExpiresAt",
                table: "Rooms");

            migrationBuilder.DropColumn(
                name: "BookingCheckInDate",
                table: "Invoices");

            migrationBuilder.DropColumn(
                name: "BookingCheckOutDate",
                table: "Invoices");

            migrationBuilder.DropColumn(
                name: "BookingNumberOfResidents",
                table: "Invoices");
        }
    }
}
