using Microsoft.AspNetCore.SignalR;
using TurTour.Helpers;

namespace TurTour.Hubs
{
    // Hub real-time dùng chung cho toàn hệ thống:
    // - Group "tours": mọi client (cả khách chưa đăng nhập) — nhận sự kiện đổi trạng thái tour.
    // - Group "user-{userId}": riêng từng user đã đăng nhập — nhận thông báo cá nhân (Notification).
    // - Group "admin-board": user có vai trò Admin/Organizator/Company — nhận sự kiện đăng ký/thanh toán mới để tự refresh bảng quản lý.
    public class AppHub : Hub
    {
        public const string ToursGroup = "tours";
        public const string AdminBoardGroup = "admin-board";

        public static string UserGroup(Guid userId) => $"user-{userId}";

        public override async Task OnConnectedAsync()
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, ToursGroup);

            var userId = CurrentUserHelper.GetUserId(Context.User ?? new System.Security.Claims.ClaimsPrincipal());
            if (userId != null)
            {
                await Groups.AddToGroupAsync(Context.ConnectionId, UserGroup(userId.Value));

                if (Context.User != null && (Context.User.IsInRole("Admin") || Context.User.IsInRole("Organizator") || Context.User.IsInRole("Company")))
                {
                    await Groups.AddToGroupAsync(Context.ConnectionId, AdminBoardGroup);
                }
            }

            await base.OnConnectedAsync();
        }
    }
}
