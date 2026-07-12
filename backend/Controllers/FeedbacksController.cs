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
        private readonly ILogger<FeedbacksController> _logger;

        public FeedbacksController(ApplicationDbContext context, ILogger<FeedbacksController> logger)
        {
            _context = context;
            _logger = logger;
        }

        [HttpGet("my")]
        [Authorize(Roles = "Student")]
        public async Task<IActionResult> GetMy()
        {
            var userId = CurrentUserHelper.GetUserId(User);
            if (userId == null) return Unauthorized();

            var feedbacks = await _context.Feedbacks
                .Where(f => f.StudentId == userId)
                .Include(f => f.Tour).ThenInclude(t => t!.Company)
                .Include(f => f.Tour).ThenInclude(t => t!.TourImages)
                .OrderByDescending(f => f.CreatedAt)
                .ToListAsync();

            var result = feedbacks.Select(f =>
            {
                var thumbnail = f.Tour?.TourImages
                    .Where(i => i.Isthumbnail).OrderBy(i => i.DisplayOrder).FirstOrDefault()
                    ?? f.Tour?.TourImages.OrderBy(i => i.DisplayOrder).FirstOrDefault();
                return new
                {
                    id = f.Id,
                    tourId = f.TourId,
                    tourTitle = f.Tour?.Tittle ?? "",
                    companyName = f.Tour?.Company?.Name ?? "",
                    thumbnailUrl = thumbnail?.ImageUrl ?? "",
                    rating = f.Rating,
                    comment = f.Comment,
                    photoUrls = f.PhotoUrls,
                    createdAt = f.CreatedAt
                };
            }).ToList();

            return Ok(result);
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
            // CompleteRegistration) thay vì tour.PublishStatus — vì đăng ký hoàn thành theo
            // từng sinh viên, độc lập với PublishStatus.Completed/Archived của cả tour.
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

        // Public — tất cả đánh giá của mọi tour, dùng cho trang chủ.
        [HttpGet("all/public")]
        [AllowAnonymous]
        public async Task<IActionResult> GetAllPublic([FromQuery] int limit = 50)
        {
            limit = Math.Clamp(limit, 1, 200);

            try
            {
                var feedbacks = await _context.Feedbacks
                    .Include(f => f.Student)
                    .Include(f => f.Tour)
                    .OrderByDescending(f => f.CreatedAt)
                    .Take(limit)
                    .ToListAsync();

                var avg = feedbacks.Count == 0 ? 0 : Math.Round(feedbacks.Average(f => f.Rating), 1);
                var total = await _context.Feedbacks.CountAsync();

                var items = feedbacks.Select(f => new
                {
                    rating = f.Rating,
                    comment = f.Comment,
                    photoUrls = f.PhotoUrls,
                    studentName = f.Student?.FullName ?? "Sinh viên",
                    tourId = f.TourId,
                    tourTitle = f.Tour?.Tittle ?? "",
                    createdAt = f.CreatedAt
                }).ToList();

                return Ok(new { averageRating = avg, total, feedbacks = items });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi tải đánh giá công khai");
                return Ok(new { averageRating = 0, total = 0, feedbacks = Array.Empty<object>() });
            }
        }

        // Public — không cần đăng nhập, dùng để hiển thị đánh giá trên trang chi tiết tour.
        [HttpGet("tour/{tourId:guid}/public")]
        [AllowAnonymous]
        public async Task<IActionResult> GetPublicByTour(Guid tourId)
        {
            var feedbacks = await _context.Feedbacks
                .Where(f => f.TourId == tourId)
                .Include(f => f.Student)
                .OrderByDescending(f => f.CreatedAt)
                .Take(50)
                .ToListAsync();

            var avg = feedbacks.Count == 0 ? 0 : Math.Round(feedbacks.Average(f => f.Rating), 1);

            var items = feedbacks.Select(f => new
            {
                rating = f.Rating,
                comment = f.Comment,
                photoUrls = f.PhotoUrls,
                studentName = f.Student?.FullName ?? "Sinh viên",
                createdAt = f.CreatedAt
            }).ToList();

            return Ok(new { averageRating = avg, total = feedbacks.Count, feedbacks = items });
        }
    }
}
