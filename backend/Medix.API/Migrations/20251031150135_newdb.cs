using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Medix.API.Migrations
{
    /// <inheritdoc />
    public partial class newdb : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "DegreeFilesUrl",
                table: "Doctors",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateTable(
                name: "DoctorRegistrationForms",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "(newid())"),
                    AvatarUrl = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    FullName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    UserNameNormalized = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: false),
                    DateOfBirth = table.Column<DateOnly>(type: "date", nullable: false),
                    GenderCode = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: false),
                    IdentificationNumber = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    IdentityCardImageUrl = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    EmailNormalized = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: false),
                    PhoneNumber = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    SpecializationId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    LicenseImageUrl = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    LicenseNumber = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    DegreeFilesUrl = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Bio = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Education = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    YearsOfExperience = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "(getutcdate())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__DoctorRe__3214EC078AFF2B65", x => x.Id);
                    table.ForeignKey(
                        name: "FK__DoctorReg__Speci__595B4002",
                        column: x => x.SpecializationId,
                        principalTable: "Specializations",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_DoctorRegistrationForms_SpecializationId",
                table: "DoctorRegistrationForms",
                column: "SpecializationId");

            migrationBuilder.CreateIndex(
                name: "UQ__DoctorRe__2CB5855F7E011DA4",
                table: "DoctorRegistrationForms",
                column: "UserNameNormalized",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "UQ__DoctorRe__85FB4E3875223BA8",
                table: "DoctorRegistrationForms",
                column: "PhoneNumber",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "UQ__DoctorRe__9CD14694DB6FF6E0",
                table: "DoctorRegistrationForms",
                column: "IdentificationNumber",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "UQ__DoctorRe__B5DB8137650358A8",
                table: "DoctorRegistrationForms",
                column: "EmailNormalized",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "UQ__DoctorRe__E889016606590140",
                table: "DoctorRegistrationForms",
                column: "LicenseNumber",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "DoctorRegistrationForms");

            migrationBuilder.DropColumn(
                name: "DegreeFilesUrl",
                table: "Doctors");
        }
    }
}
