using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TurTour.Migrations
{
    /// <inheritdoc />
    public partial class AddFeedbackPhotos : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "PhotoUrlsJson",
                table: "Feedbacks",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PhotoUrlsJson",
                table: "Feedbacks");
        }
    }
}
