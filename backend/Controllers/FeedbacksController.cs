using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TurTour.Data;
using TurTour.DTOs.Feedback;
using TurTour.Helpers;
using TurTour.Models.Entities;
using TurTour.Models.Enums;

namespace TurTour.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class FeedbacksController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public FeedbacksController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpPost]
        [Authorize(Roles = "Student")]
        public async Task<IActionResult> Create(CreateFeedbackRequest request)
        {
            var userId = CurrentUserHelper.GetUserId(User);
            if (userId == null)
            {
                return Unauthorized();
            }

            if (request.Rating < 1 || request.Rating > 5)
            {
                return BadRequest(new { message = "Rating must be between 1 and 5." });
            }

            var registration = await _context.Registrations
                .Include(r => r.Payment)
                .Include(r => r.Tour)
                .FirstOrDefaultAsync(r => r.TourId == request.TourId && r.StudentId == userId);
            if (registration == null)
            {
                return BadRequest(new { message = "You are not registered for this tour." });
            }

            if (registration.Payment == null || registration.Payment.PaymentStatus != PaymentStatus.Paid)
            {
                return BadRequest(new { message = "Chỉ có thể đánh giá sau khi đã thanh toán tour." });
            }

            // Dùng RegistrationStatus.Completed (đánh dấu riêng cho từng lượt đăng ký, qua
            // CompleteRegistration) thay vì tour.Status cũ — chính xác hơn vì không gộp lẫn
            // với tour bị huỷ (giờ cùng PublishStatus.Archived với tour hoàn thành thật).
            if (registration.Status != RegistrationStatus.Completed)
            {
                return BadRequest(new { message = "Chỉ có thể đánh giá khi tour đã hoàn thành." });
            }

            var existed = await _context.Feedbacks.AnyAsync(f => f.TourId == request.TourId && f.StudentId == userId);
            if (existed)
            {
                return BadRequest(new { message = "Feedback already exists for this tour." });
            }

            var feedback = new Models.Entities.Feedback
            {
                TourId = request.TourId,
                StudentId = userId.Value,
                Rating = request.Rating,
                Comment = request.Comment,
                PhotoUrls = request.PhotoUrls
            };

            _context.Feedbacks.Add(feedback);
            await _context.SaveChangesAsync();

            return Ok(feedback);
        }

        [HttpGet("tour/{tourId:guid}")]
        [Authorize(Roles = "Admin,Organizator,Company")]
        public async Task<IActionResult> GetByTour(Guid tourId)
        {
            var feedbacks = await _context.Feedbacks
                .Where(f => f.TourId == tourId)
                .Include(f => f.Student)
                .OrderByDescending(f => f.CreatedAt)
                .ToListAsync();

            var avg = feedbacks.Count == 0 ? 0 : feedbacks.Average(f => f.Rating);

            return Ok(new
            {
                averageRating = avg,
                total = feedbacks.Count,
                feedbacks
            });
        }
    }
}
