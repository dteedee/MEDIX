using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Medix.API.Migrations
{
    /// <inheritdoc />
    public partial class newdb1 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "OverrideType",
                table: "DoctorScheduleOverrides",
                type: "bit",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "OverrideType",
                table: "DoctorScheduleOverrides");
        }
    }
}
