using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SORMS.API.Migrations
{
    /// <inheritdoc />
    public partial class AddRoomAmenitiesForChatbot : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string[]>(
                name: "Amenities",
                table: "Rooms",
                type: "text[]",
                nullable: false,
                defaultValueSql: "ARRAY[]::text[]");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Amenities",
                table: "Rooms");
        }
    }
}
