using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TurTour.Data;
using TurTour.DTOs.Registration;
using TurTour.Helpers;
using TurTour.Models.Entities;
using TurTour.Models.Enums;
using TurTour.Services;

namespace TurTour.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class RegistrationsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly RealtimeNotifier _realtime;

        public RegistrationsController(ApplicationDbContext context, RealtimeNotifier realtime)
        {
            _context = context;
            _realtime = realtime;
        }

        [HttpGet("my")]
        [Authorize(Roles = "Student")]
        public async Task<IActionResult> GetMyRegistrations()
        {
            var userId = CurrentUserHelper.GetUserId(User);
            if (userId == null)
            {
                return Unauthorized();
            }

            var items = await _context.Registrations
                .Where(r => r.StudentId == userId)
                .Include(r => r.Tour)
                .Include(r => r.Payment)
                .OrderByDescending(r => r.RegistrationDate)
                .ToListAsync();

            var ratedTourIds = await _context.Feedbacks
                .Where(f => f.StudentId == userId)
                .Select(f => f.TourId)
                .ToListAsync();

            foreach (var item in items)
            {
                item.HasFeedback = ratedTourIds.Contains(item.TourId);
            }

            return Ok(items);
        }

        [HttpGet("tour/{tourId:guid}")]
        [Authorize(Roles = "Admin,Organizator,Company")]
        public async Task<IActionResult> GetByTour(Guid tourId)
        {
            var items = await _context.Registrations
                .Where(r => r.TourId == tourId)
                .Include(r => r.Student)
                .Include(r => r.Payment)
                .OrderByDescending(r => r.RegistrationDate)
                .ToListAsync();

            return Ok(items);
        }

        [HttpPost]
        [Authorize(Roles = "Student")]
        public async Task<IActionResult> Register(CreateRegistrationRequest request)
        {
            var userId = CurrentUserHelper.GetUserId(User);
            if (userId == null)
            {
                return Unauthorized();
            }

            var tour = await _context.Tours.FirstOrDefaultAsync(t => t.Id == request.TourId);
            if (tour == null)
            {
                return NotFound(new { message = "Tour not found." });
            }

            var effectiveStatus = ToursController.ComputeEffectiveStatus(tour);
            if (effectiveStatus != TourStatus.Open)
            {
                var message = effectiveStatus == TourStatus.Upcoming
                    ? "Tour chưa mở đăng ký."
                    : "Tour đã đóng đăng ký.";
                return BadRequest(new { message });
            }

            var existed = await _context.Registrations
                .AnyAsync(r => r.TourId == request.TourId && r.StudentId == userId);
            if (existed)
            {
                return BadRequest(new { message = "You already registered this tour." });
            }

            var approvedCount = await _context.Registrations
                .CountAsync(r => r.TourId == request.TourId &&
                    (r.Status == RegistrationStatus.Approved ||
                     r.Status == RegistrationStatus.Paid ||
                     r.Status == RegistrationStatus.CheckedIn ||
                     r.Status == RegistrationStatus.Completed));

            var status = approvedCount >= tour.MaxParticipants
                ? RegistrationStatus.Waitinglisted
                : RegistrationStatus.Pending;

            var registration = new Registration
            {
                TourId = request.TourId,
                StudentId = userId.Value,
                Notes = request.Notes,
                Status = status,
                RegistrationDate = DateTime.UtcNow
            };

            _context.Registrations.Add(registration);
            await _context.SaveChangesAsync();

            await _realtime.NotifyAdminBoardAsync(tour.Id, "new-registration");

            return Ok(registration);
        }

        [HttpDelete("{id:guid}")]
        [Authorize(Roles = "Student")]
        public async Task<IActionResult> Cancel(Guid id)
        {
            var userId = CurrentUserHelper.GetUserId(User);
            if (userId == null)
            {
                return Unauthorized();
            }

            var registration = await _context.Registrations
                .Include(r => r.Tour)
                .FirstOrDefaultAsync(r => r.Id == id);
            if (registration == null)
            {
                return NotFound();
            }

            if (registration.StudentId != userId.Value)
            {
                return Forbid();
            }

            if (registration.Status == RegistrationStatus.CheckedIn || registration.Status == RegistrationStatus.Completed)
            {
                return BadRequest(new { message = "Không thể hủy đăng ký sau khi đã check-in hoặc hoàn thành tour." });
            }

            if (registration.Status == RegistrationStatus.Rejected)
            {
                return BadRequest(new { message = "Đăng ký này đã bị từ chối/hủy trước đó." });
            }

            var wasCountedInSlots = registration.Status == RegistrationStatus.Approved || registration.Status == RegistrationStatus.Paid;

            if (registration.Status == RegistrationStatus.Pending || registration.Status == RegistrationStatus.Waitinglisted)
            {
                _context.Registrations.Remove(registration);
            }
            else
            {
                registration.Status = RegistrationStatus.Rejected;
                registration.RejectionReason = "Cancelled by student";
                registration.UpdatedAt = DateTime.UtcNow;
            }

            Notification? promotedNotification = null;
            if (wasCountedInSlots && registration.Tour != null && registration.Tour.CurrentParticipants > 0)
            {
                registration.Tour.CurrentParticipants -= 1;
                registration.Tour.UpdatedAt = DateTime.UtcNow;
                promotedNotification = await PromoteFromWaitlistAsync(registration.Tour);
            }

            await _context.SaveChangesAsync();

            await _realtime.NotifyAdminBoardAsync(registration.TourId, "registration-cancelled");
            if (promotedNotification != null)
            {
                await _realtime.NotifyUserAsync(promotedNotification);
            }

            return Ok(new { message = "Đã hủy đăng ký." });
        }

        [HttpPost("{id:guid}/notify-payment")]
        [Authorize(Roles = "Student")]
        public async Task<IActionResult> NotifyPayment(Guid id)
        {
            var userId = CurrentUserHelper.GetUserId(User);
            if (userId == null)
            {
                return Unauthorized();
            }

            var registration = await _context.Registrations
                .Include(r => r.Tour)
                .Include(r => r.Student)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (registration == null)
            {
                return NotFound();
            }

            if (registration.StudentId != userId.Value)
            {
                return Forbid();
            }

            if (registration.Status == RegistrationStatus.Rejected)
            {
                return BadRequest(new { message = "Đăng ký này đã bị từ chối." });
            }

            if (registration.Tour == null)
            {
                return BadRequest(new { message = "Tour data missing." });
            }

            var notification = new Notification
            {
                UserId = registration.Tour.CreatedBy,
                Title = "Sinh viên báo đã chuyển khoản",
                Content = $"{registration.Student?.FullName ?? "Một sinh viên"} báo đã chuyển khoản cho tour \"{registration.Tour.Tittle}\". Vui lòng kiểm tra và xác nhận thanh toán.",
                Type = "Payment",
                IsRead = false
            };

            _context.Notifications.Add(notification);
            await _context.SaveChangesAsync();

            await _realtime.NotifyUserAsync(notification);
            await _realtime.NotifyAdminBoardAsync(registration.TourId, "payment-notified");

            return Ok(new { message = "Đã gửi thông báo cho doanh nghiệp/tổ chức." });
        }

        [HttpPut("{id:guid}/approve")]
        [Authorize(Roles = "Admin,Organizator")]
        public async Task<IActionResult> Approve(Guid id)
        {
            var approverId = CurrentUserHelper.GetUserId(User);
            if (approverId == null)
            {
                return Unauthorized();
            }

            var registration = await _context.Registrations
                .Include(r => r.Tour)
                .FirstOrDefaultAsync(r => r.Id == id);
            if (registration == null)
            {
                return NotFound();
            }

            if (registration.Tour == null)
            {
                return BadRequest(new { message = "Tour data missing." });
            }

            if (registration.Status == RegistrationStatus.Rejected || registration.Status == RegistrationStatus.Completed)
            {
                return BadRequest(new { message = "Cannot approve this registration state." });
            }

            var approvedCount = await _context.Registrations
                .CountAsync(r => r.TourId == registration.TourId &&
                    (r.Status == RegistrationStatus.Approved ||
                     r.Status == RegistrationStatus.Paid ||
                     r.Status == RegistrationStatus.CheckedIn ||
                     r.Status == RegistrationStatus.Completed));

            if (approvedCount >= registration.Tour.MaxParticipants)
            {
                registration.Status = RegistrationStatus.Waitinglisted;
                registration.ApprovedBy = approverId;
                registration.ApprovedDate = DateTime.UtcNow;
                registration.UpdatedAt = DateTime.UtcNow;

                var waitlistNotification = new Notification
                {
                    UserId = registration.StudentId,
                    Title = "Tour đã đầy chỗ",
                    Content = $"Tour \"{registration.Tour.Tittle}\" đã đủ số lượng. Đăng ký của bạn được chuyển vào danh sách chờ, bạn sẽ được duyệt tự động nếu có người hủy.",
                    Type = "Registration",
                    IsRead = false
                };
                _context.Notifications.Add(waitlistNotification);

                await _context.SaveChangesAsync();

                await _realtime.NotifyUserAsync(waitlistNotification);
                await _realtime.NotifyAdminBoardAsync(registration.TourId, "registration-updated");

                return Ok(new { message = "Tour is full. Registration moved to waiting list.", registration });
            }

            registration.Status = RegistrationStatus.Approved;
            registration.ApprovedBy = approverId;
            registration.ApprovedDate = DateTime.UtcNow;
            registration.UpdatedAt = DateTime.UtcNow;

            registration.Tour.CurrentParticipants = approvedCount + 1;
            registration.Tour.UpdatedAt = DateTime.UtcNow;

            var approvedNotification = new Notification
            {
                UserId = registration.StudentId,
                Title = "Đăng ký tour đã được duyệt",
                Content = $"Đăng ký tham gia tour \"{registration.Tour.Tittle}\" của bạn đã được duyệt.",
                Type = "Registration",
                IsRead = false
            };
            _context.Notifications.Add(approvedNotification);

            await _context.SaveChangesAsync();

            await _realtime.NotifyUserAsync(approvedNotification);
            await _realtime.NotifyAdminBoardAsync(registration.TourId, "registration-updated");

            return Ok(registration);
        }

        [HttpPut("{id:guid}/reject")]
        [Authorize(Roles = "Admin,Organizator")]
        public async Task<IActionResult> Reject(Guid id, RejectRegistrationRequest request)
        {
            var approverId = CurrentUserHelper.GetUserId(User);
            if (approverId == null)
            {
                return Unauthorized();
            }

            var registration = await _context.Registrations
                .Include(r => r.Tour)
                .FirstOrDefaultAsync(r => r.Id == id);
            if (registration == null)
            {
                return NotFound();
            }

            if (registration.Status == RegistrationStatus.Paid ||
                registration.Status == RegistrationStatus.CheckedIn ||
                registration.Status == RegistrationStatus.Completed)
            {
                return BadRequest(new { message = "Không thể từ chối đăng ký đã thanh toán hoặc đã tham gia tour." });
            }

            var wasCountedInSlots = registration.Status == RegistrationStatus.Approved;

            registration.Status = RegistrationStatus.Rejected;
            registration.RejectionReason = request.Reason;
            registration.ApprovedBy = approverId;
            registration.ApprovedDate = DateTime.UtcNow;
            registration.UpdatedAt = DateTime.UtcNow;

            Notification? promotedNotification = null;
            if (wasCountedInSlots && registration.Tour != null && registration.Tour.CurrentParticipants > 0)
            {
                registration.Tour.CurrentParticipants -= 1;
                registration.Tour.UpdatedAt = DateTime.UtcNow;
                promotedNotification = await PromoteFromWaitlistAsync(registration.Tour);
            }

            var rejectedNotification = new Notification
            {
                UserId = registration.StudentId,
                Title = "Đăng ký tour bị từ chối",
                Content = $"Đăng ký tham gia tour \"{registration.Tour?.Tittle}\" của bạn đã bị từ chối. Lý do: {request.Reason}",
                Type = "Registration",
                IsRead = false
            };
            _context.Notifications.Add(rejectedNotification);

            await _context.SaveChangesAsync();

            await _realtime.NotifyUserAsync(rejectedNotification);
            await _realtime.NotifyAdminBoardAsync(registration.TourId, "registration-updated");
            if (promotedNotification != null)
            {
                await _realtime.NotifyUserAsync(promotedNotification);
            }

            return Ok(registration);
        }

        private async Task<Notification?> PromoteFromWaitlistAsync(Tour tour)
        {
            if (tour.CurrentParticipants >= tour.MaxParticipants)
            {
                return null;
            }

            var nextInLine = await _context.Registrations
                .Where(r => r.TourId == tour.Id && r.Status == RegistrationStatus.Waitinglisted)
                .OrderBy(r => r.RegistrationDate)
                .FirstOrDefaultAsync();

            if (nextInLine == null)
            {
                return null;
            }

            nextInLine.Status = RegistrationStatus.Approved;
            nextInLine.ApprovedDate = DateTime.UtcNow;
            nextInLine.UpdatedAt = DateTime.UtcNow;

            tour.CurrentParticipants += 1;
            tour.UpdatedAt = DateTime.UtcNow;

            var notification = new Notification
            {
                UserId = nextInLine.StudentId,
                Title = "Bạn đã được duyệt từ danh sách chờ",
                Content = $"Đã có chỗ trống cho tour \"{tour.Tittle}\". Đăng ký của bạn được tự động duyệt từ danh sách chờ.",
                Type = "Registration",
                IsRead = false
            };
            _context.Notifications.Add(notification);
            return notification;
        }

        [HttpPut("{id:guid}/complete")]
        [Authorize(Roles = "Admin,Organizator")]
        public async Task<IActionResult> Complete(Guid id)
        {
            var registration = await _context.Registrations.FindAsync(id);
            if (registration == null)
            {
                return NotFound();
            }

            if (registration.Status != RegistrationStatus.CheckedIn)
            {
                return BadRequest(new { message = "Only checked-in registrations can be completed." });
            }

            registration.Status = RegistrationStatus.Completed;
            registration.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return Ok(registration);
        }
    }
}
