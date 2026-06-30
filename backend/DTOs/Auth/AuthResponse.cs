namespace TurTour.DTOs.Auth
{
    public class AuthResponse
    {
        public Guid UserId { get; set; }
        public string Token { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public List<string> Roles { get; set; } = new();
    }
}
