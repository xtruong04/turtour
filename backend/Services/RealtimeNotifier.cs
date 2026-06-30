using Microsoft.AspNetCore.SignalR;
using TurTour.Hubs;
using TurTour.Models.Entities;

namespace TurTour.Services
{
    // Bọc IHubContext<AppHub> để các controller gọi push real-time mà không cần biết chi tiết
    // tên group/event — tránh lặp code SignalR ở nhiều nơi.
    public class RealtimeNotifier
    {
        private readonly IHubContext<AppHub> _hub;

        public RealtimeNotifier(IHubContext<AppHub> hub)
        {
            _hub = hub;
        }

        public Task NotifyUserAsync(Notification notification)
        {
            return _hub.Clients.Group(AppHub.UserGroup(notification.UserId)).SendAsync("ReceiveNotification", notification);
        }

        public Task NotifyTourUpdatedAsync(Guid tourId, string approvalStatus, string publishStatus)
        {
            return _hub.Clients.Group(AppHub.ToursGroup).SendAsync("TourUpdated", new { tourId, approvalStatus, publishStatus });
        }

        public Task NotifyAdminBoardAsync(Guid tourId, string reason)
        {
            return _hub.Clients.Group(AppHub.AdminBoardGroup).SendAsync("AdminBoardUpdated", new { tourId, reason });
        }
    }
}
