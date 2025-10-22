using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Medix.API.Migrations
{
    /// <inheritdoc />
    public partial class TenMigration : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Role",
                table: "Users",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateTable(
                name: "HealthArticleLikes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ArticleId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_HealthArticleLikes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_HealthArticleLikes_HealthArticles_ArticleId",
                        column: x => x.ArticleId,
                        principalTable: "HealthArticles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_HealthArticleLikes_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_HealthArticleLikes_ArticleId",
                table: "HealthArticleLikes",
                column: "ArticleId");

            migrationBuilder.CreateIndex(
                name: "IX_HealthArticleLikes_UserId",
                table: "HealthArticleLikes",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "HealthArticleLikes");

            migrationBuilder.DropColumn(
                name: "Role",
                table: "Users");
        }
    }
}
