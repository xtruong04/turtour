using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TurTour.Migrations
{
    /// <inheritdoc />
    public partial class AddTourIdToNotification : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "TourId",
                table: "Notifications",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Notifications_TourId",
                table: "Notifications",
                column: "TourId");

            migrationBuilder.AddForeignKey(
                name: "FK_Notifications_Tours_TourId",
                table: "Notifications",
                column: "TourId",
                principalTable: "Tours",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Notifications_Tours_TourId",
                table: "Notifications");

            migrationBuilder.DropIndex(
                name: "IX_Notifications_TourId",
                table: "Notifications");

            migrationBuilder.DropColumn(
                name: "TourId",
                table: "Notifications");
        }
    }
}
