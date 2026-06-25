using System.Security.Claims;

namespace TurTour.Helpers
{
    public static class CurrentUserHelper
    {
        public static Guid? GetUserId(ClaimsPrincipal user)
        {
            var userId = user.FindFirstValue(ClaimTypes.NameIdentifier);
            return Guid.TryParse(userId, out var id) ? id : null;
        }
    }
}
