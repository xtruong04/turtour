using Microsoft.EntityFrameworkCore;
using TurTour.Data;
using TurTour.Models.Entities;

namespace TurTour.Services
{
    public static class CheckInQrHelper
    {
        // Trả về mã QR hiện có nếu chưa check-in (giữ nguyên mã đã gửi email cho sinh viên).
        // Chỉ tạo mã mới khi chưa từng có, hoặc mã cũ đã được dùng để check-in rồi.
        public static async Task<CheckIn> GenerateOrRefreshAsync(ApplicationDbContext context, Guid registrationId)
        {
            var checkIn = await context.CheckIns.FirstOrDefaultAsync(c => c.RegistrationId == registrationId);
            if (checkIn == null)
            {
                checkIn = new CheckIn
                {
                    RegistrationId = registrationId,
                    QrCode = Guid.NewGuid().ToString("N"),
                    IsCheckedIn = false
                };
                context.CheckIns.Add(checkIn);
            }
            else if (checkIn.IsCheckedIn)
            {
                checkIn.QrCode = Guid.NewGuid().ToString("N");
                checkIn.IsCheckedIn = false;
                checkIn.CheckedInAt = null;
                checkIn.CheckedInBy = null;
                checkIn.UpdatedAt = DateTime.UtcNow;
            }

            return checkIn;
        }
    }
}
