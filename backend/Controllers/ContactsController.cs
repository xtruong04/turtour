using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TurTour.Data;
using TurTour.DTOs.Contact;
using TurTour.Helpers;
using TurTour.Models.Entities;
using TurTour.Services;

namespace TurTour.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ContactsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly RealtimeNotifier _realtime;

        public ContactsController(ApplicationDbContext context, RealtimeNotifier realtime)
        {
            _context = context;
            _realtime = realtime;
        }

        [HttpPost]
        [AllowAnonymous]
        public async Task<IActionResult> Create([FromBody] CreateContactRequest request)
        {
            var contact = new Contact
            {
                FullName = request.FullName,
                Email = request.Email,
                Subject = request.Subject,
                Message = request.Message,
            };

            _context.Contacts.Add(contact);
            await _context.SaveChangesAsync();

            await NotifyAdminsAsync(contact);

            // Nếu người gửi đang đăng nhập, tạo notification xác nhận cho họ
            var submitterId = CurrentUserHelper.GetUserId(User);
            if (submitterId != null)
            {
                await NotifySubmitterAsync(submitterId.Value, contact);
            }

            return Ok(new { message = "Liên hệ của bạn đã được gửi thành công." });
        }

        [HttpGet]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAll()
        {
            var contacts = await _context.Contacts
                .OrderByDescending(c => c.CreatedAt)
                .ToListAsync();

            return Ok(contacts);
        }

        [HttpPatch("{id:guid}/read")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> MarkRead(Guid id)
        {
            var contact = await _context.Contacts.FindAsync(id);
            if (contact == null) return NotFound();

            contact.IsRead = true;
            contact.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Đã đánh dấu đã đọc." });
        }

        private async Task NotifyAdminsAsync(Contact contact)
        {
            var adminIds = await _context.UserRoles
                .Where(ur => ur.Role!.Name == "Admin")
                .Select(ur => ur.UserId)
                .ToListAsync();

            if (adminIds.Count == 0) return;

            var notifications = adminIds.Select(adminId => new Notification
            {
                UserId = adminId,
                Title = "Liên hệ mới từ " + contact.FullName,
                Content = contact.Subject,
                Type = "Contact",
                IsRead = false,
            }).ToList();

            _context.Notifications.AddRange(notifications);
            await _context.SaveChangesAsync();

            await Task.WhenAll(notifications.Select(n => _realtime.NotifyUserAsync(n)));
        }

        private async Task NotifySubmitterAsync(Guid userId, Contact contact)
        {
            var notification = new Notification
            {
                UserId = userId,
                Title = "Liên hệ đã được gửi",
                Content = $"Chúng tôi đã nhận được tin nhắn của bạn về \"{contact.Subject}\". Chúng tôi sẽ phản hồi sớm nhất có thể.",
                Type = "Contact",
                IsRead = false,
            };

            _context.Notifications.Add(notification);
            await _context.SaveChangesAsync();
            await _realtime.NotifyUserAsync(notification);
        }
    }
}
