using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TurTour.Migrations
{
    /// <inheritdoc />
    public partial class WipeTestTourData : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Xoá toàn bộ tour test (và Registrations/Payments/CheckIns/Feedbacks/TourSchedules/
            // TourImages/TourInterests liên quan, cascade theo cấu hình FK) — dữ liệu này bị sai
            // lệch do 2 migration trước áp dụng trước khi backfill SQL được thêm vào (các process
            // dotnet watch tự rebuild/migrate trước khi file migration được sửa xong). Không có
            // cascade tới Notifications nên xoá riêng các thông báo liên quan tới tour.
            migrationBuilder.Sql("""DELETE FROM "Notifications" WHERE "TourId" IS NOT NULL;""");
            migrationBuilder.Sql("""DELETE FROM "Tours";""");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {

        }
    }
}
