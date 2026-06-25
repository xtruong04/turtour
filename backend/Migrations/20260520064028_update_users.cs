using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TurTour.Migrations
{
    /// <inheritdoc />
    public partial class update_users : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Feedbacks_Users_StudentId",
                table: "Feedbacks");

            migrationBuilder.DropForeignKey(
                name: "FK_Registrations_Users_StudentId",
                table: "Registrations");

            migrationBuilder.AddForeignKey(
                name: "FK_Feedbacks_Users_StudentId",
                table: "Feedbacks",
                column: "StudentId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Registrations_Users_StudentId",
                table: "Registrations",
                column: "StudentId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Feedbacks_Users_StudentId",
                table: "Feedbacks");

            migrationBuilder.DropForeignKey(
                name: "FK_Registrations_Users_StudentId",
                table: "Registrations");

            migrationBuilder.AddForeignKey(
                name: "FK_Feedbacks_Users_StudentId",
                table: "Feedbacks",
                column: "StudentId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Registrations_Users_StudentId",
                table: "Registrations",
                column: "StudentId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
