using Microsoft.EntityFrameworkCore;
using TurTour.Data;
using TurTour.Models.Enums;

namespace TurTour.Services
{
    // Chạy nền mỗi giờ, tự động chuyển trạng thái tour theo thời gian:
    //   Published  → OnGoing   khi BookingCloseAt đã qua nhưng EndDate chưa tới
    //   Published/OnGoing → Completed khi EndDate đã qua (tour hoàn thành tự nhiên, không phải huỷ)
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

                // Giờ VN (UTC+7) — khớp với ToursController.VietnamNow
                var now = DateTime.UtcNow.AddHours(7);

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

                var totalChanged = finishedCount + finishedOnGoingCount + onGoingCount;
                if (totalChanged > 0)
                    _logger.LogInformation("[TourLifecycle] {Completed} completed, {OnGoing} → OnGoing at {Now:HH:mm} VN",
                        finishedCount + finishedOnGoingCount, onGoingCount, now);
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                _logger.LogError(ex, "[TourLifecycle] Error during lifecycle tick");
            }
        }
    }
}
