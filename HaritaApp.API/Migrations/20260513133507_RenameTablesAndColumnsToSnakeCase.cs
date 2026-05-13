using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HaritaApp.API.Migrations
{
    /// <inheritdoc />
    public partial class RenameTablesAndColumnsToSnakeCase : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Geometries_Users_UserId",
                table: "Geometries");

            migrationBuilder.DropForeignKey(
                name: "FK_Routes_Users_UserId",
                table: "Routes");

            migrationBuilder.DropForeignKey(
                name: "FK_RouteStops_Routes_RouteId",
                table: "RouteStops");

            migrationBuilder.DropForeignKey(
                name: "FK_RouteStops_Stops_StopId",
                table: "RouteStops");

            migrationBuilder.DropForeignKey(
                name: "FK_Stops_Users_UserId",
                table: "Stops");

            migrationBuilder.DropPrimaryKey(
                name: "PK_Users",
                table: "Users");

            migrationBuilder.DropPrimaryKey(
                name: "PK_Stops",
                table: "Stops");

            migrationBuilder.DropPrimaryKey(
                name: "PK_RouteStops",
                table: "RouteStops");

            migrationBuilder.DropPrimaryKey(
                name: "PK_Routes",
                table: "Routes");

            migrationBuilder.DropPrimaryKey(
                name: "PK_Geometries",
                table: "Geometries");

            migrationBuilder.RenameTable(
                name: "Users",
                newName: "tbl_users");

            migrationBuilder.RenameTable(
                name: "Stops",
                newName: "tbl_stops");

            migrationBuilder.RenameTable(
                name: "RouteStops",
                newName: "tbl_route_stops");

            migrationBuilder.RenameTable(
                name: "Routes",
                newName: "tbl_routes");

            migrationBuilder.RenameTable(
                name: "Geometries",
                newName: "tbl_geometries");

            migrationBuilder.RenameColumn(
                name: "Username",
                table: "tbl_users",
                newName: "username");

            migrationBuilder.RenameColumn(
                name: "Email",
                table: "tbl_users",
                newName: "email");

            migrationBuilder.RenameColumn(
                name: "Id",
                table: "tbl_users",
                newName: "id");

            migrationBuilder.RenameColumn(
                name: "PasswordHash",
                table: "tbl_users",
                newName: "password_hash");

            migrationBuilder.RenameColumn(
                name: "CreatedAt",
                table: "tbl_users",
                newName: "created_at");

            migrationBuilder.RenameIndex(
                name: "IX_Users_Username",
                table: "tbl_users",
                newName: "IX_tbl_users_username");

            migrationBuilder.RenameColumn(
                name: "Name",
                table: "tbl_stops",
                newName: "name");

            migrationBuilder.RenameColumn(
                name: "Longitude",
                table: "tbl_stops",
                newName: "longitude");

            migrationBuilder.RenameColumn(
                name: "Latitude",
                table: "tbl_stops",
                newName: "latitude");

            migrationBuilder.RenameColumn(
                name: "Id",
                table: "tbl_stops",
                newName: "id");

            migrationBuilder.RenameColumn(
                name: "UserId",
                table: "tbl_stops",
                newName: "user_id");

            migrationBuilder.RenameColumn(
                name: "UpdatedAt",
                table: "tbl_stops",
                newName: "updated_at");

            migrationBuilder.RenameColumn(
                name: "CreatedAt",
                table: "tbl_stops",
                newName: "created_at");

            migrationBuilder.RenameIndex(
                name: "IX_Stops_UserId",
                table: "tbl_stops",
                newName: "IX_tbl_stops_user_id");

            migrationBuilder.RenameColumn(
                name: "Id",
                table: "tbl_route_stops",
                newName: "id");

            migrationBuilder.RenameColumn(
                name: "UpdatedAt",
                table: "tbl_route_stops",
                newName: "updated_at");

            migrationBuilder.RenameColumn(
                name: "StopId",
                table: "tbl_route_stops",
                newName: "stop_id");

            migrationBuilder.RenameColumn(
                name: "RouteId",
                table: "tbl_route_stops",
                newName: "route_id");

            migrationBuilder.RenameColumn(
                name: "OrderIndex",
                table: "tbl_route_stops",
                newName: "order_index");

            migrationBuilder.RenameIndex(
                name: "IX_RouteStops_StopId",
                table: "tbl_route_stops",
                newName: "IX_tbl_route_stops_stop_id");

            migrationBuilder.RenameIndex(
                name: "IX_RouteStops_RouteId_StopId",
                table: "tbl_route_stops",
                newName: "IX_tbl_route_stops_route_id_stop_id");

            migrationBuilder.RenameColumn(
                name: "Waypoints",
                table: "tbl_routes",
                newName: "waypoints");

            migrationBuilder.RenameColumn(
                name: "Name",
                table: "tbl_routes",
                newName: "name");

            migrationBuilder.RenameColumn(
                name: "Geoloc",
                table: "tbl_routes",
                newName: "geoloc");

            migrationBuilder.RenameColumn(
                name: "Id",
                table: "tbl_routes",
                newName: "id");

            migrationBuilder.RenameColumn(
                name: "UserId",
                table: "tbl_routes",
                newName: "user_id");

            migrationBuilder.RenameColumn(
                name: "UpdatedAt",
                table: "tbl_routes",
                newName: "updated_at");

            migrationBuilder.RenameColumn(
                name: "GeometryType",
                table: "tbl_routes",
                newName: "geometry_type");

            migrationBuilder.RenameColumn(
                name: "CreatedAt",
                table: "tbl_routes",
                newName: "created_at");

            migrationBuilder.RenameIndex(
                name: "IX_Routes_UserId",
                table: "tbl_routes",
                newName: "IX_tbl_routes_user_id");

            migrationBuilder.RenameColumn(
                name: "Name",
                table: "tbl_geometries",
                newName: "name");

            migrationBuilder.RenameColumn(
                name: "Geoloc",
                table: "tbl_geometries",
                newName: "geoloc");

            migrationBuilder.RenameColumn(
                name: "Id",
                table: "tbl_geometries",
                newName: "id");

            migrationBuilder.RenameColumn(
                name: "UserId",
                table: "tbl_geometries",
                newName: "user_id");

            migrationBuilder.RenameColumn(
                name: "UpdatedAt",
                table: "tbl_geometries",
                newName: "updated_at");

            migrationBuilder.RenameColumn(
                name: "GeometryType",
                table: "tbl_geometries",
                newName: "geometry_type");

            migrationBuilder.RenameColumn(
                name: "CreatedAt",
                table: "tbl_geometries",
                newName: "created_at");

            migrationBuilder.RenameIndex(
                name: "IX_Geometries_UserId",
                table: "tbl_geometries",
                newName: "IX_tbl_geometries_user_id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_tbl_users",
                table: "tbl_users",
                column: "id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_tbl_stops",
                table: "tbl_stops",
                column: "id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_tbl_route_stops",
                table: "tbl_route_stops",
                column: "id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_tbl_routes",
                table: "tbl_routes",
                column: "id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_tbl_geometries",
                table: "tbl_geometries",
                column: "id");

            migrationBuilder.AddForeignKey(
                name: "FK_tbl_geometries_tbl_users_user_id",
                table: "tbl_geometries",
                column: "user_id",
                principalTable: "tbl_users",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_tbl_route_stops_tbl_routes_route_id",
                table: "tbl_route_stops",
                column: "route_id",
                principalTable: "tbl_routes",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_tbl_route_stops_tbl_stops_stop_id",
                table: "tbl_route_stops",
                column: "stop_id",
                principalTable: "tbl_stops",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_tbl_routes_tbl_users_user_id",
                table: "tbl_routes",
                column: "user_id",
                principalTable: "tbl_users",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_tbl_stops_tbl_users_user_id",
                table: "tbl_stops",
                column: "user_id",
                principalTable: "tbl_users",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_tbl_geometries_tbl_users_user_id",
                table: "tbl_geometries");

            migrationBuilder.DropForeignKey(
                name: "FK_tbl_route_stops_tbl_routes_route_id",
                table: "tbl_route_stops");

            migrationBuilder.DropForeignKey(
                name: "FK_tbl_route_stops_tbl_stops_stop_id",
                table: "tbl_route_stops");

            migrationBuilder.DropForeignKey(
                name: "FK_tbl_routes_tbl_users_user_id",
                table: "tbl_routes");

            migrationBuilder.DropForeignKey(
                name: "FK_tbl_stops_tbl_users_user_id",
                table: "tbl_stops");

            migrationBuilder.DropPrimaryKey(
                name: "PK_tbl_users",
                table: "tbl_users");

            migrationBuilder.DropPrimaryKey(
                name: "PK_tbl_stops",
                table: "tbl_stops");

            migrationBuilder.DropPrimaryKey(
                name: "PK_tbl_routes",
                table: "tbl_routes");

            migrationBuilder.DropPrimaryKey(
                name: "PK_tbl_route_stops",
                table: "tbl_route_stops");

            migrationBuilder.DropPrimaryKey(
                name: "PK_tbl_geometries",
                table: "tbl_geometries");

            migrationBuilder.RenameTable(
                name: "tbl_users",
                newName: "Users");

            migrationBuilder.RenameTable(
                name: "tbl_stops",
                newName: "Stops");

            migrationBuilder.RenameTable(
                name: "tbl_routes",
                newName: "Routes");

            migrationBuilder.RenameTable(
                name: "tbl_route_stops",
                newName: "RouteStops");

            migrationBuilder.RenameTable(
                name: "tbl_geometries",
                newName: "Geometries");

            migrationBuilder.RenameColumn(
                name: "username",
                table: "Users",
                newName: "Username");

            migrationBuilder.RenameColumn(
                name: "email",
                table: "Users",
                newName: "Email");

            migrationBuilder.RenameColumn(
                name: "id",
                table: "Users",
                newName: "Id");

            migrationBuilder.RenameColumn(
                name: "password_hash",
                table: "Users",
                newName: "PasswordHash");

            migrationBuilder.RenameColumn(
                name: "created_at",
                table: "Users",
                newName: "CreatedAt");

            migrationBuilder.RenameIndex(
                name: "IX_tbl_users_username",
                table: "Users",
                newName: "IX_Users_Username");

            migrationBuilder.RenameColumn(
                name: "name",
                table: "Stops",
                newName: "Name");

            migrationBuilder.RenameColumn(
                name: "longitude",
                table: "Stops",
                newName: "Longitude");

            migrationBuilder.RenameColumn(
                name: "latitude",
                table: "Stops",
                newName: "Latitude");

            migrationBuilder.RenameColumn(
                name: "id",
                table: "Stops",
                newName: "Id");

            migrationBuilder.RenameColumn(
                name: "user_id",
                table: "Stops",
                newName: "UserId");

            migrationBuilder.RenameColumn(
                name: "updated_at",
                table: "Stops",
                newName: "UpdatedAt");

            migrationBuilder.RenameColumn(
                name: "created_at",
                table: "Stops",
                newName: "CreatedAt");

            migrationBuilder.RenameIndex(
                name: "IX_tbl_stops_user_id",
                table: "Stops",
                newName: "IX_Stops_UserId");

            migrationBuilder.RenameColumn(
                name: "waypoints",
                table: "Routes",
                newName: "Waypoints");

            migrationBuilder.RenameColumn(
                name: "name",
                table: "Routes",
                newName: "Name");

            migrationBuilder.RenameColumn(
                name: "geoloc",
                table: "Routes",
                newName: "Geoloc");

            migrationBuilder.RenameColumn(
                name: "id",
                table: "Routes",
                newName: "Id");

            migrationBuilder.RenameColumn(
                name: "user_id",
                table: "Routes",
                newName: "UserId");

            migrationBuilder.RenameColumn(
                name: "updated_at",
                table: "Routes",
                newName: "UpdatedAt");

            migrationBuilder.RenameColumn(
                name: "geometry_type",
                table: "Routes",
                newName: "GeometryType");

            migrationBuilder.RenameColumn(
                name: "created_at",
                table: "Routes",
                newName: "CreatedAt");

            migrationBuilder.RenameIndex(
                name: "IX_tbl_routes_user_id",
                table: "Routes",
                newName: "IX_Routes_UserId");

            migrationBuilder.RenameColumn(
                name: "id",
                table: "RouteStops",
                newName: "Id");

            migrationBuilder.RenameColumn(
                name: "updated_at",
                table: "RouteStops",
                newName: "UpdatedAt");

            migrationBuilder.RenameColumn(
                name: "stop_id",
                table: "RouteStops",
                newName: "StopId");

            migrationBuilder.RenameColumn(
                name: "route_id",
                table: "RouteStops",
                newName: "RouteId");

            migrationBuilder.RenameColumn(
                name: "order_index",
                table: "RouteStops",
                newName: "OrderIndex");

            migrationBuilder.RenameIndex(
                name: "IX_tbl_route_stops_stop_id",
                table: "RouteStops",
                newName: "IX_RouteStops_StopId");

            migrationBuilder.RenameIndex(
                name: "IX_tbl_route_stops_route_id_stop_id",
                table: "RouteStops",
                newName: "IX_RouteStops_RouteId_StopId");

            migrationBuilder.RenameColumn(
                name: "name",
                table: "Geometries",
                newName: "Name");

            migrationBuilder.RenameColumn(
                name: "geoloc",
                table: "Geometries",
                newName: "Geoloc");

            migrationBuilder.RenameColumn(
                name: "id",
                table: "Geometries",
                newName: "Id");

            migrationBuilder.RenameColumn(
                name: "user_id",
                table: "Geometries",
                newName: "UserId");

            migrationBuilder.RenameColumn(
                name: "updated_at",
                table: "Geometries",
                newName: "UpdatedAt");

            migrationBuilder.RenameColumn(
                name: "geometry_type",
                table: "Geometries",
                newName: "GeometryType");

            migrationBuilder.RenameColumn(
                name: "created_at",
                table: "Geometries",
                newName: "CreatedAt");

            migrationBuilder.RenameIndex(
                name: "IX_tbl_geometries_user_id",
                table: "Geometries",
                newName: "IX_Geometries_UserId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_Users",
                table: "Users",
                column: "Id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_Stops",
                table: "Stops",
                column: "Id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_Routes",
                table: "Routes",
                column: "Id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_RouteStops",
                table: "RouteStops",
                column: "Id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_Geometries",
                table: "Geometries",
                column: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Geometries_Users_UserId",
                table: "Geometries",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Routes_Users_UserId",
                table: "Routes",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_RouteStops_Routes_RouteId",
                table: "RouteStops",
                column: "RouteId",
                principalTable: "Routes",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_RouteStops_Stops_StopId",
                table: "RouteStops",
                column: "StopId",
                principalTable: "Stops",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Stops_Users_UserId",
                table: "Stops",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
