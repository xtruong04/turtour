using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TurTour.Migrations
{
    /// <inheritdoc />
    public partial class AddBookingWindowToTour : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "BookingCloseAt",
                table: "Tours",
                type: "timestamp without time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<DateTime>(
                name: "BookingOpenAt",
                table: "Tours",
                type: "timestamp without time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            // Backfill tour cũ — chưa có khái niệm booking window, nên coi như "mở đăng ký từ rất
            // lâu, đóng đúng lúc khởi hành" để giữ hành vi cũ gần nhất (Published luôn đặt được
            // cho tới khi tour bắt đầu).
            migrationBuilder.Sql(
                """
                UPDATE "Tours" SET
                    "BookingOpenAt" = "CreatedAt",
                    "BookingCloseAt" = "StartDate";
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "BookingCloseAt",
                table: "Tours");

            migrationBuilder.DropColumn(
                name: "BookingOpenAt",
                table: "Tours");
        }
    }
}
