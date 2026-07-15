using Microsoft.EntityFrameworkCore;
using TurTour.Data;
using TurTour.Models.Enums;

namespace TurTour.Services
{
    // Chạy nền mỗi giờ, tự động chuyển trạng thái tour theo thời gian:
    //   Published  → OnGoing   khi BookingCloseAt đã qua nhưng EndDate chưa tới
    //   Published/OnGoing → Completed khi EndDate đã qua (tour hoàn thành tự nhiên, không phải huỷ)
    //   Registration CheckedIn → Completed khi tour.EndDate đã qua (sinh viên chỉ đánh giá được
    //   sau khi tour thực sự kết thúc, không phải ngay khi partner quét check-in)
    public class TourLifecycleService : BackgroundService
    {
        private static readonly TimeSpan Interval = TimeSpan.FromHours(1);
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<TourLifecycleService> _logger;

        public TourLifecycleService(IServiceScopeFactory scopeFactory, ILogger<TourLifecycleService> logger)
        {
            _scopeFactory = scopeFactory;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            // Chạy ngay khi khởi động để đồng bộ trạng thái trước khi nhận request
            await TickAsync(stoppingToken);

            using var timer = new PeriodicTimer(Interval);
            while (!stoppingToken.IsCancellationRequested && await timer.WaitForNextTickAsync(stoppingToken))
            {
                await TickAsync(stoppingToken);
            }
        }

        private async Task TickAsync(CancellationToken ct)
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

                // EndDate/BookingCloseAt đã được Npgsql quy đổi sang UTC thật khi ghi DB (xem
                // ToursController.VietnamNow) — so sánh thẳng với UtcNow, không cộng thêm giờ.
                var now = DateTime.UtcNow;

                // 1. Published → Completed (tour đã kết thúc tự nhiên)
                var finishedCount = await db.Tours
                    .Where(t => t.PublishStatus == PublishStatus.Published
                             && t.EndDate < now)
                    .ExecuteUpdateAsync(s => s.SetProperty(t => t.PublishStatus, PublishStatus.Completed), ct);

                // 2. OnGoing → Completed (tour đã kết thúc, bước trung gian)
                var finishedOnGoingCount = await db.Tours
                    .Where(t => t.PublishStatus == PublishStatus.OnGoing
                             && t.EndDate < now)
                    .ExecuteUpdateAsync(s => s.SetProperty(t => t.PublishStatus, PublishStatus.Completed), ct);

                // 3. Published → OnGoing (booking đóng nhưng tour vẫn đang diễn ra)
                var onGoingCount = await db.Tours
                    .Where(t => t.PublishStatus == PublishStatus.Published
                             && t.BookingCloseAt < now
                             && t.EndDate >= now)
                    .ExecuteUpdateAsync(s => s.SetProperty(t => t.PublishStatus, PublishStatus.OnGoing), ct);

                // 4. Registration CheckedIn → Completed khi tour đã kết thúc (mở khoá đánh giá)
                var completedRegistrationsCount = await db.Registrations
                    .Where(r => r.Status == RegistrationStatus.CheckedIn && r.Tour.EndDate < now)
                    .ExecuteUpdateAsync(s => s.SetProperty(r => r.Status, RegistrationStatus.Completed), ct);

                var totalChanged = finishedCount + finishedOnGoingCount + onGoingCount + completedRegistrationsCount;
                if (totalChanged > 0)
                    _logger.LogInformation("[TourLifecycle] {Completed} completed, {OnGoing} → OnGoing, {RegCompleted} registrations completed at {Now:HH:mm} UTC",
                        finishedCount + finishedOnGoingCount, onGoingCount, completedRegistrationsCount, now);
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                _logger.LogError(ex, "[TourLifecycle] Error during lifecycle tick");
            }
        }
    }
}
