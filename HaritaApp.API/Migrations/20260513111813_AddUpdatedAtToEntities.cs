using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HaritaApp.API.Migrations
{
    /// <inheritdoc />
    public partial class AddUpdatedAtToEntities : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "Stops",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "RouteStops",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "Routes",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "Geometries",
                type: "timestamp with time zone",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "Stops");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "RouteStops");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "Routes");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "Geometries");
        }
    }
}
