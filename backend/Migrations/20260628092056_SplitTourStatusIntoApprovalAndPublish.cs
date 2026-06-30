using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TurTour.Migrations
{
    /// <inheritdoc />
    public partial class SplitTourStatusIntoApprovalAndPublish : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "Status",
                table: "Tours",
                newName: "PublishStatus");

            migrationBuilder.AddColumn<int>(
                name: "ApprovalStatus",
                table: "Tours",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            // Backfill từ giá trị TourStatus cũ (lúc này vẫn còn nguyên trong cột "PublishStatus"
            // do bước RenameColumn ở trên chỉ đổi tên, chưa đổi giá trị) — phải đọc ApprovalStatus
            // TRƯỚC khi ghi đè PublishStatus, vì cả 2 câu lệnh đều dựa vào giá trị cũ này.
            // Cũ: Upcoming=0, Open=1, Closed=2, Cancelled=3, Completed=4, PendingApproval=5.
            migrationBuilder.Sql(
                """
                UPDATE "Tours" SET "ApprovalStatus" = CASE
                    WHEN "PublishStatus" = 5 THEN 1  -- PendingApproval -> Pending
                    ELSE 2                            -- còn lại -> Approved
                END;
                """);

            migrationBuilder.Sql(
                """
                UPDATE "Tours" SET "PublishStatus" = CASE
                    WHEN "PublishStatus" = 5 THEN 0           -- PendingApproval -> Hidden
                    WHEN "PublishStatus" IN (0, 1, 2) THEN 1  -- Upcoming/Open/Closed -> Published
                    WHEN "PublishStatus" IN (3, 4) THEN 3     -- Cancelled/Completed -> Archived
                    ELSE 0
                END;
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ApprovalStatus",
                table: "Tours");

            migrationBuilder.RenameColumn(
                name: "PublishStatus",
                table: "Tours",
                newName: "Status");
        }
    }
}
