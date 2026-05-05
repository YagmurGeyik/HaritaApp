using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace HaritaApp.API.Migrations
{
    /// <inheritdoc />
    public partial class AddUserAndAuthSchema : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // 1. Önce Users tablosunu oluştur
            migrationBuilder.CreateTable(
                name: "Users",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Username = table.Column<string>(type: "text", nullable: false),
                    PasswordHash = table.Column<string>(type: "text", nullable: false),
                    Email = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Users", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Users_Username",
                table: "Users",
                column: "Username",
                unique: true);

            // 2. Mevcut anonim geometrileri temizle (UserId olmayan kayıtlar FK'yı ihlal eder)
            migrationBuilder.Sql("DELETE FROM \"Geometries\";");

            // 3. UserId sütununu ekle
            migrationBuilder.AddColumn<int>(
                name: "UserId",
                table: "Geometries",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_Geometries_UserId",
                table: "Geometries",
                column: "UserId");

            // 4. FK kısıtını ekle
            migrationBuilder.AddForeignKey(
                name: "FK_Geometries_Users_UserId",
                table: "Geometries",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Geometries_Users_UserId",
                table: "Geometries");

            migrationBuilder.DropTable(
                name: "Users");

            migrationBuilder.DropIndex(
                name: "IX_Geometries_UserId",
                table: "Geometries");

            migrationBuilder.DropColumn(
                name: "UserId",
                table: "Geometries");
        }
    }
}
