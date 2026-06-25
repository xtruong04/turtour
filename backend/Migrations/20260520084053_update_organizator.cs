using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TurTour.Migrations
{
    /// <inheritdoc />
    public partial class update_organizator : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Tours_Companies_CompanyId",
                table: "Tours");

            migrationBuilder.DropIndex(
                name: "IX_UserRoles_UserId",
                table: "UserRoles");

            migrationBuilder.DropIndex(
                name: "IX_Registrations_TourId",
                table: "Registrations");

            migrationBuilder.DropIndex(
                name: "IX_Feedbacks_TourId",
                table: "Feedbacks");

            migrationBuilder.AlterColumn<decimal>(
                name: "Fee",
                table: "Tours",
                type: "numeric(18,2)",
                precision: 18,
                scale: 2,
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric");

            migrationBuilder.AddColumn<Guid>(
                name: "OrganizatorId",
                table: "Tours",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Status",
                table: "Tours",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AlterColumn<decimal>(
                name: "Amount",
                table: "Payments",
                type: "numeric(18,2)",
                precision: 18,
                scale: 2,
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric");

            migrationBuilder.CreateTable(
                name: "Organizators",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: true),
                    Address = table.Column<string>(type: "text", nullable: false),
                    Website = table.Column<string>(type: "text", nullable: true),
                    Email = table.Column<string>(type: "text", nullable: true),
                    Phone = table.Column<string>(type: "text", nullable: true),
                    LogoUrl = table.Column<string>(type: "text", nullable: true),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Organizators", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Organizators_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Users_Email",
                table: "Users",
                column: "Email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_UserRoles_UserId_RoleId",
                table: "UserRoles",
                columns: new[] { "UserId", "RoleId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Tours_OrganizatorId",
                table: "Tours",
                column: "OrganizatorId");

            migrationBuilder.CreateIndex(
                name: "IX_Roles_Name",
                table: "Roles",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Registrations_TourId_StudentId",
                table: "Registrations",
                columns: new[] { "TourId", "StudentId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Feedbacks_TourId_StudentId",
                table: "Feedbacks",
                columns: new[] { "TourId", "StudentId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Organizators_Name",
                table: "Organizators",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Organizators_UserId",
                table: "Organizators",
                column: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_Tours_Companies_CompanyId",
                table: "Tours",
                column: "CompanyId",
                principalTable: "Companies",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Tours_Organizators_OrganizatorId",
                table: "Tours",
                column: "OrganizatorId",
                principalTable: "Organizators",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Tours_Companies_CompanyId",
                table: "Tours");

            migrationBuilder.DropForeignKey(
                name: "FK_Tours_Organizators_OrganizatorId",
                table: "Tours");

            migrationBuilder.DropTable(
                name: "Organizators");

            migrationBuilder.DropIndex(
                name: "IX_Users_Email",
                table: "Users");

            migrationBuilder.DropIndex(
                name: "IX_UserRoles_UserId_RoleId",
                table: "UserRoles");

            migrationBuilder.DropIndex(
                name: "IX_Tours_OrganizatorId",
                table: "Tours");

            migrationBuilder.DropIndex(
                name: "IX_Roles_Name",
                table: "Roles");

            migrationBuilder.DropIndex(
                name: "IX_Registrations_TourId_StudentId",
                table: "Registrations");

            migrationBuilder.DropIndex(
                name: "IX_Feedbacks_TourId_StudentId",
                table: "Feedbacks");

            migrationBuilder.DropColumn(
                name: "OrganizatorId",
                table: "Tours");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "Tours");

            migrationBuilder.AlterColumn<decimal>(
                name: "Fee",
                table: "Tours",
                type: "numeric",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric(18,2)",
                oldPrecision: 18,
                oldScale: 2);

            migrationBuilder.AlterColumn<decimal>(
                name: "Amount",
                table: "Payments",
                type: "numeric",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric(18,2)",
                oldPrecision: 18,
                oldScale: 2);

            migrationBuilder.CreateIndex(
                name: "IX_UserRoles_UserId",
                table: "UserRoles",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_Registrations_TourId",
                table: "Registrations",
                column: "TourId");

            migrationBuilder.CreateIndex(
                name: "IX_Feedbacks_TourId",
                table: "Feedbacks",
                column: "TourId");

            migrationBuilder.AddForeignKey(
                name: "FK_Tours_Companies_CompanyId",
                table: "Tours",
                column: "CompanyId",
                principalTable: "Companies",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
