using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TurTour.Data;
using TurTour.DTOs.Tour;
using TurTour.Helpers;
using TurTour.Models.Entities;
using TurTour.Models.Enums;
using TurTour.Services;

namespace TurTour.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ToursController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly RealtimeNotifier _realtime;

        public ToursController(ApplicationDbContext context, RealtimeNotifier realtime)
        {
            _context = context;
            _realtime = realtime;
        }

        // Tour đã qua ngày kết thúc thì hiển thị là "Đã đóng", trừ khi đã bị hủy hoặc
        // đã đánh dấu hoàn thành thủ công — không ghi xuống DB, chỉ áp cho dữ liệu trả về.
        internal static TourStatus ComputeEffectiveStatus(Tour tour)
        {
            if (tour.Status == TourStatus.Cancelled || tour.Status == TourStatus.Completed)
            {
                return tour.Status;
            }

            return DateTime.UtcNow > tour.EndDate ? TourStatus.Closed : tour.Status;
        }

        // Vai trò quản lý (Admin/Organizator/Company) được thấy cả tour đang chờ duyệt —
        // người ngoài (khách/sinh viên) thì không, vì tour chưa được Admin duyệt công khai.
        private bool CanSeePendingTours()
        {
            return User.IsInRole("Admin") || User.IsInRole("Organizator") || User.IsInRole("Company");
        }

        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> GetAll()
        {
            var tours = await _context.Tours
                .Include(t => t.Company)
                .Include(t => t.TourSchedules.OrderBy(s => s.OrderIndex))
                .Include(t => t.TourImages.OrderBy(i => i.DisplayOrder))
                .OrderByDescending(t => t.StartDate)
                .ToListAsync();

            foreach (var tour in tours)
            {
                tour.Status = ComputeEffectiveStatus(tour);
            }

            if (!CanSeePendingTours())
            {
                tours = tours.Where(t => t.Status != TourStatus.PendingApproval).ToList();
            }

            await ApplyInterestFlagAsync(tours);

            return Ok(tours);
        }

        [HttpGet("{id:guid}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetById(Guid id)
        {
            var tour = await _context.Tours
                .Include(t => t.Company)
                .Include(t => t.TourSchedules.OrderBy(s => s.OrderIndex))
                .Include(t => t.TourImages.OrderBy(i => i.DisplayOrder))
                .FirstOrDefaultAsync(t => t.Id == id);

            if (tour == null)
            {
                return NotFound();
            }

            tour.Status = ComputeEffectiveStatus(tour);

            if (tour.Status == TourStatus.PendingApproval && !CanSeePendingTours())
            {
                return NotFound();
            }

            await ApplyInterestFlagAsync(new[] { tour });
            return Ok(tour);
        }

        // Sinh viên đang đăng nhập có thể đánh dấu "Quan tâm" tour đang Sắp diễn ra, để được
        // báo khi tour mở đăng ký. Bấm lại lần nữa để bỏ quan tâm.
        [HttpPost("{id:guid}/interest")]
        [Authorize(Roles = "Student")]
        public async Task<IActionResult> MarkInterest(Guid id)
        {
            var studentId = CurrentUserHelper.GetUserId(User);
            if (studentId == null)
            {
                return Unauthorized();
            }

            var tour = await _context.Tours.FirstOrDefaultAsync(t => t.Id == id);
            if (tour == null)
            {
                return NotFound(new { message = "Tour not found." });
            }

            if (ComputeEffectiveStatus(tour) != TourStatus.Upcoming)
            {
                return BadRequest(new { message = "Chỉ có thể đánh dấu quan tâm tour đang ở trạng thái sắp diễn ra." });
            }

            var existed = await _context.TourInterests
                .FirstOrDefaultAsync(ti => ti.TourId == id && ti.StudentId == studentId);
            if (existed != null)
            {
                return Ok(new { interested = true });
            }

            _context.TourInterests.Add(new TourInterest { TourId = id, StudentId = studentId.Value });
            await _context.SaveChangesAsync();
            return Ok(new { interested = true });
        }

        [HttpDelete("{id:guid}/interest")]
        [Authorize(Roles = "Student")]
        public async Task<IActionResult> RemoveInterest(Guid id)
        {
            var studentId = CurrentUserHelper.GetUserId(User);
            if (studentId == null)
            {
                return Unauthorized();
            }

            var existed = await _context.TourInterests
                .FirstOrDefaultAsync(ti => ti.TourId == id && ti.StudentId == studentId);
            if (existed != null)
            {
                _context.TourInterests.Remove(existed);
                await _context.SaveChangesAsync();
            }

            return Ok(new { interested = false });
        }

        private async Task ApplyInterestFlagAsync(IReadOnlyCollection<Tour> tours)
        {
            var studentId = CurrentUserHelper.GetUserId(User);
            if (studentId == null || tours.Count == 0)
            {
                return;
            }

            var tourIds = tours.Select(t => t.Id).ToList();
            var interestedTourIds = await _context.TourInterests
                .Where(ti => ti.StudentId == studentId && tourIds.Contains(ti.TourId))
                .Select(ti => ti.TourId)
                .ToListAsync();

            var interestedSet = interestedTourIds.ToHashSet();
            foreach (var tour in tours)
            {
                tour.IsInterested = interestedSet.Contains(tour.Id);
            }
        }

        [HttpPost]
        [Authorize(Roles = "Admin,Organizator,Company")]
        public async Task<IActionResult> Create(TourUpsertRequest request)
        {
            var createdBy = CurrentUserHelper.GetUserId(User);
            if (createdBy == null)
            {
                return Unauthorized();
            }

            // Doanh nghiệp tự đăng nhập tạo tour cho chính mình — không cho chọn công ty khác.
            Company? company;
            if (User.IsInRole("Company"))
            {
                company = await _context.Companies.FirstOrDefaultAsync(c => c.UserId == createdBy && c.IsActive);
                if (company == null)
                {
                    return BadRequest(new { message = "Không tìm thấy doanh nghiệp gắn với tài khoản của bạn." });
                }
            }
            else
            {
                company = await ResolveCompanyAsync(request.CompanyId, request.CompanyName);
                if (company == null)
                {
                    return BadRequest(new { message = "Không tìm thấy doanh nghiệp đang hoạt động với tên đã nhập." });
                }
            }

            if (request.EndDate < request.StartDate)
            {
                return BadRequest(new { message = "EndDate must be greater than StartDate." });
            }

            // Chỉ Admin tạo tour mới được xuất bản ngay theo trạng thái yêu cầu — Organizator/Company
            // tạo tour luôn vào "Chờ duyệt", chờ Admin xét duyệt trước khi hiển thị công khai.
            var initialStatus = User.IsInRole("Admin") ? request.Status : TourStatus.PendingApproval;

            var tour = new Tour
            {
                Code = request.Code,
                Tittle = request.Tittle,
                Decriptions = request.Decriptions,
                Location = request.Location,
                StartDate = request.StartDate,
                EndDate = request.EndDate,
                MaxParticipants = request.MaxParticipants,
                CurrentParticipants = 0,
                Fee = request.Fee,
                Status = initialStatus,
                Requirement = request.Requirement,
                CompanyId = company.Id,
                CreatedBy = createdBy.Value
            };

            if (!string.IsNullOrWhiteSpace(request.ThumbnailUrl))
            {
                tour.TourImages.Add(new TourImage
                {
                    ImageUrl = request.ThumbnailUrl.Trim(),
                    Isthumbnail = true,
                    DisplayOrder = 0
                });
            }

            // Validate lịch trình trước khi đụng tới DB — sai ở lịch trình nào thì báo lỗi
            // ngay, chưa tạo gì cả, không cần phải rollback.
            var schedules = new List<TourSchedule>();
            foreach (var scheduleRequest in request.Schedules ?? new List<CreateTourScheduleRequest>())
            {
                var scheduleRangeError = ValidateScheduleRange(tour, scheduleRequest.StartDate, scheduleRequest.EndDate);
                if (scheduleRangeError != null)
                {
                    return BadRequest(new { message = scheduleRangeError });
                }

                schedules.Add(new TourSchedule
                {
                    Tittle = scheduleRequest.Tittle,
                    Description = scheduleRequest.Description,
                    StartDate = scheduleRequest.StartDate,
                    EndDate = scheduleRequest.EndDate,
                    OrderIndex = scheduleRequest.OrderIndex
                });
            }

            // Tạo tour + toàn bộ lịch trình trong 1 transaction — lỗi bất kỳ đâu (kể cả lỗi
            // DB như trùng Code) sẽ rollback toàn bộ, không lưu tour mà thiếu lịch trình.
            await using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                tour.TourSchedules = schedules;
                _context.Tours.Add(tour);
                await _context.SaveChangesAsync();

                await transaction.CommitAsync();
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }

            if (initialStatus == TourStatus.PendingApproval)
            {
                await NotifyAdminsOfPendingTourAsync(tour, company.Name);
            }

            return CreatedAtAction(nameof(GetById), new { id = tour.Id }, tour);
        }

        // Báo cho mọi Admin biết có tour mới đang chờ duyệt.
        private async Task NotifyAdminsOfPendingTourAsync(Tour tour, string? companyName)
        {
            var adminIds = await _context.UserRoles
                .Where(ur => ur.Role!.Name == "Admin")
                .Select(ur => ur.UserId)
                .ToListAsync();

            if (adminIds.Count == 0)
            {
                return;
            }

            var notifications = adminIds.Select(adminId => new Notification
            {
                UserId = adminId,
                Title = "Có tour mới đang chờ duyệt",
                Content = $"Tour \"{tour.Tittle}\" của doanh nghiệp \"{companyName}\" đang chờ bạn duyệt.",
                Type = "Tour",
                IsRead = false
            }).ToList();

            _context.Notifications.AddRange(notifications);
            await _context.SaveChangesAsync();

            foreach (var notification in notifications)
            {
                await _realtime.NotifyUserAsync(notification);
            }
        }

        [HttpPut("{id:guid}")]
        [Authorize(Roles = "Admin,Organizator,Company")]
        public async Task<IActionResult> Update(Guid id, TourUpsertRequest request)
        {
            var tour = await _context.Tours
                .Include(t => t.TourImages)
                .FirstOrDefaultAsync(t => t.Id == id);

            if (tour == null)
            {
                return NotFound();
            }

            var ownershipError = await CheckCompanyOwnershipAsync(tour);
            if (ownershipError != null)
            {
                return ownershipError;
            }

            if (request.EndDate < request.StartDate)
            {
                return BadRequest(new { message = "EndDate must be greater than StartDate." });
            }

            if (request.MaxParticipants < tour.CurrentParticipants)
            {
                return BadRequest(new { message = "MaxParticipants cannot be less than CurrentParticipants." });
            }

            Company? company;
            if (User.IsInRole("Company"))
            {
                company = await _context.Companies.FindAsync(tour.CompanyId);
            }
            else
            {
                company = await ResolveCompanyAsync(request.CompanyId, request.CompanyName);
            }
            if (company == null)
            {
                return BadRequest(new { message = "Không tìm thấy doanh nghiệp đang hoạt động với tên đã nhập." });
            }

            if (IsLockedAsCompleted(tour) && request.Status != TourStatus.Completed)
            {
                return BadRequest(new { message = "Tour đã hoàn thành và qua ngày kết thúc, không thể đổi trạng thái." });
            }

            var previousStatus = tour.Status;

            tour.Code = request.Code;
            tour.Tittle = request.Tittle;
            tour.Decriptions = request.Decriptions;
            tour.Location = request.Location;
            tour.StartDate = request.StartDate;
            tour.EndDate = request.EndDate;
            tour.MaxParticipants = request.MaxParticipants;
            tour.Fee = request.Fee;
            // Chỉ Admin được đổi trạng thái thoát khỏi "Chờ duyệt" — Organizator/Company sửa tour
            // đang chờ duyệt thì trạng thái vẫn giữ nguyên là Chờ duyệt (không thể tự duyệt cho mình).
            tour.Status = (previousStatus == TourStatus.PendingApproval && !User.IsInRole("Admin"))
                ? TourStatus.PendingApproval
                : request.Status;
            tour.Requirement = request.Requirement;
            tour.CompanyId = company.Id;
            tour.UpdatedAt = DateTime.UtcNow;

            SyncThumbnail(tour, request.ThumbnailUrl);
            var interestNotifications = await NotifyInterestedStudentsIfNowOpenAsync(tour, previousStatus);

            await _context.SaveChangesAsync();

            if (tour.Status != previousStatus)
            {
                await _realtime.NotifyTourUpdatedAsync(tour.Id, tour.Status.ToString());
                await NotifyCreatorIfApprovedAsync(tour, previousStatus);
            }
            foreach (var notification in interestNotifications)
            {
                await _realtime.NotifyUserAsync(notification);
            }

            return Ok(tour);
        }

        [HttpPatch("{id:guid}/status")]
        [Authorize(Roles = "Admin,Organizator,Company")]
        public async Task<IActionResult> UpdateStatus(Guid id, UpdateTourStatusRequest request)
        {
            var tour = await _context.Tours
                .Include(t => t.Company)
                .Include(t => t.TourSchedules.OrderBy(s => s.OrderIndex))
                .Include(t => t.TourImages.OrderBy(i => i.DisplayOrder))
                .FirstOrDefaultAsync(t => t.Id == id);

            if (tour == null)
            {
                return NotFound();
            }

            var ownershipError = await CheckCompanyOwnershipAsync(tour);
            if (ownershipError != null)
            {
                return ownershipError;
            }

            if (IsLockedAsCompleted(tour) && request.Status != TourStatus.Completed)
            {
                return BadRequest(new { message = "Tour đã hoàn thành và qua ngày kết thúc, không thể đổi trạng thái." });
            }

            // Chỉ Admin được duyệt tour ra khỏi trạng thái "Chờ duyệt".
            if (tour.Status == TourStatus.PendingApproval && !User.IsInRole("Admin"))
            {
                return Forbid();
            }

            var previousStatus = tour.Status;
            tour.Status = request.Status;
            tour.UpdatedAt = DateTime.UtcNow;

            var interestNotifications = await NotifyInterestedStudentsIfNowOpenAsync(tour, previousStatus);

            await _context.SaveChangesAsync();

            if (tour.Status != previousStatus)
            {
                await _realtime.NotifyTourUpdatedAsync(tour.Id, tour.Status.ToString());
                await NotifyCreatorIfApprovedAsync(tour, previousStatus);
            }
            foreach (var notification in interestNotifications)
            {
                await _realtime.NotifyUserAsync(notification);
            }

            return Ok(tour);
        }

        // Tour đã đánh dấu Hoàn thành và đã qua ngày kết thúc thì khóa trạng thái, không cho
        // đổi sang trạng thái khác nữa (tránh sửa nhầm sau khi tour đã xong thật).
        private static bool IsLockedAsCompleted(Tour tour)
        {
            return tour.Status == TourStatus.Completed && DateTime.UtcNow > tour.EndDate;
        }

        // Doanh nghiệp (role Company) chỉ được quản lý tour của chính công ty mình —
        // Admin/Organizator không bị giới hạn theo công ty.
        private async Task<IActionResult?> CheckCompanyOwnershipAsync(Tour tour)
        {
            if (!User.IsInRole("Company"))
            {
                return null;
            }

            var userId = CurrentUserHelper.GetUserId(User);
            if (userId == null)
            {
                return Unauthorized();
            }

            var ownCompany = await _context.Companies.FirstOrDefaultAsync(c => c.UserId == userId);
            if (ownCompany == null || ownCompany.Id != tour.CompanyId)
            {
                return Forbid();
            }

            return null;
        }

        // Khi tour vừa được Admin duyệt ra khỏi "Chờ duyệt", báo cho người đã tạo tour đó.
        private async Task NotifyCreatorIfApprovedAsync(Tour tour, TourStatus previousStatus)
        {
            if (previousStatus != TourStatus.PendingApproval)
            {
                return;
            }

            var notification = new Notification
            {
                UserId = tour.CreatedBy,
                Title = "Tour của bạn đã được duyệt",
                Content = $"Tour \"{tour.Tittle}\" đã được Admin duyệt và chuyển sang trạng thái \"{tour.Status}\".",
                Type = "Tour",
                IsRead = false
            };
            _context.Notifications.Add(notification);
            await _context.SaveChangesAsync();
            await _realtime.NotifyUserAsync(notification);
        }

        // Tour vừa mở đăng ký — báo cho các sinh viên đã đánh dấu "Quan tâm" lúc tour còn Sắp
        // diễn ra, rồi xoá danh sách quan tâm (đã báo xong, tránh báo lại lần sau).
        private async Task<List<Notification>> NotifyInterestedStudentsIfNowOpenAsync(Tour tour, TourStatus previousStatus)
        {
            var notifications = new List<Notification>();
            if (previousStatus == TourStatus.Open || tour.Status != TourStatus.Open)
            {
                return notifications;
            }

            var interests = await _context.TourInterests.Where(ti => ti.TourId == tour.Id).ToListAsync();
            foreach (var interest in interests)
            {
                var notification = new Notification
                {
                    UserId = interest.StudentId,
                    Title = "Tour bạn quan tâm đã mở đăng ký",
                    Content = $"Tour \"{tour.Tittle}\" mà bạn đánh dấu quan tâm đã mở đăng ký, hãy đăng ký ngay!",
                    Type = "Tour",
                    IsRead = false
                };
                _context.Notifications.Add(notification);
                notifications.Add(notification);
            }
            _context.TourInterests.RemoveRange(interests);
            return notifications;
        }

        [HttpDelete("{id:guid}")]
        [Authorize(Roles = "Admin,Organizator,Company")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var tour = await _context.Tours.FindAsync(id);
            if (tour == null)
            {
                return NotFound();
            }

            var ownershipError = await CheckCompanyOwnershipAsync(tour);
            if (ownershipError != null)
            {
                return ownershipError;
            }

            _context.Tours.Remove(tour);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpPost("{id:guid}/schedules")]
        [Authorize(Roles = "Admin,Organizator,Company")]
        public async Task<IActionResult> AddSchedule(Guid id, CreateTourScheduleRequest request)
        {
            var tour = await _context.Tours.FirstOrDefaultAsync(t => t.Id == id);
            if (tour == null)
            {
                return NotFound(new { message = "Tour not found." });
            }

            var ownershipError = await CheckCompanyOwnershipAsync(tour);
            if (ownershipError != null)
            {
                return ownershipError;
            }

            var scheduleRangeError = ValidateScheduleRange(tour, request.StartDate, request.EndDate);
            if (scheduleRangeError != null)
            {
                return BadRequest(new { message = scheduleRangeError });
            }

            var schedule = new TourSchedule
            {
                TourId = id,
                Tittle = request.Tittle,
                Description = request.Description,
                StartDate = request.StartDate,
                EndDate = request.EndDate,
                OrderIndex = request.OrderIndex
            };

            _context.Add(schedule);
            await _context.SaveChangesAsync();
            return Ok(schedule);
        }

        [HttpPut("{id:guid}/schedules/{scheduleId:guid}")]
        [Authorize(Roles = "Admin,Organizator,Company")]
        public async Task<IActionResult> UpdateSchedule(Guid id, Guid scheduleId, CreateTourScheduleRequest request)
        {
            var tour = await _context.Tours.FirstOrDefaultAsync(t => t.Id == id);
            if (tour == null)
            {
                return NotFound(new { message = "Tour not found." });
            }

            var ownershipError = await CheckCompanyOwnershipAsync(tour);
            if (ownershipError != null)
            {
                return ownershipError;
            }

            var schedule = await _context.ToursSchedules.FirstOrDefaultAsync(s => s.Id == scheduleId && s.TourId == id);
            if (schedule == null)
            {
                return NotFound(new { message = "Schedule not found." });
            }

            var scheduleRangeError = ValidateScheduleRange(tour, request.StartDate, request.EndDate);
            if (scheduleRangeError != null)
            {
                return BadRequest(new { message = scheduleRangeError });
            }

            schedule.Tittle = request.Tittle;
            schedule.Description = request.Description;
            schedule.StartDate = request.StartDate;
            schedule.EndDate = request.EndDate;
            schedule.OrderIndex = request.OrderIndex;
            schedule.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return Ok(schedule);
        }

        [HttpDelete("{id:guid}/schedules/{scheduleId:guid}")]
        [Authorize(Roles = "Admin,Organizator,Company")]
        public async Task<IActionResult> DeleteSchedule(Guid id, Guid scheduleId)
        {
            var tour = await _context.Tours.FirstOrDefaultAsync(t => t.Id == id);
            if (tour == null)
            {
                return NotFound(new { message = "Tour not found." });
            }

            var ownershipError = await CheckCompanyOwnershipAsync(tour);
            if (ownershipError != null)
            {
                return ownershipError;
            }

            var schedule = await _context.ToursSchedules.FirstOrDefaultAsync(s => s.Id == scheduleId && s.TourId == id);
            if (schedule == null)
            {
                return NotFound(new { message = "Schedule not found." });
            }

            _context.ToursSchedules.Remove(schedule);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        private static string? ValidateScheduleRange(Tour tour, DateTime startDate, DateTime endDate)
        {
            if (endDate < startDate)
            {
                return "EndDate must be greater than StartDate.";
            }

            var tourStartOfDay = tour.StartDate.Date;
            var tourEndOfDay = tour.EndDate.Date.AddDays(1).AddTicks(-1);

            if (startDate < tourStartOfDay || endDate > tourEndOfDay)
            {
                return $"Thời gian lịch trình phải nằm trong khoảng thời gian của tour ({tour.StartDate:yyyy-MM-dd} → {tour.EndDate:yyyy-MM-dd}).";
            }

            return null;
        }

        [HttpPost("{id:guid}/images")]
        [Authorize(Roles = "Admin,Organizator,Company")]
        public async Task<IActionResult> AddImage(Guid id, CreateTourImageRequest request)
        {
            var tour = await _context.Tours.FirstOrDefaultAsync(t => t.Id == id);
            if (tour == null)
            {
                return NotFound(new { message = "Tour not found." });
            }

            var ownershipError = await CheckCompanyOwnershipAsync(tour);
            if (ownershipError != null)
            {
                return ownershipError;
            }

            var image = new TourImage
            {
                TourId = id,
                ImageUrl = request.ImageUrl,
                Isthumbnail = request.Isthumbnail,
                DisplayOrder = request.DisplayOrder
            };

            _context.Add(image);
            await _context.SaveChangesAsync();
            return Ok(image);
        }

        private async Task<Company?> ResolveCompanyAsync(Guid? companyId, string? companyName)
        {
            if (companyId.HasValue && companyId.Value != Guid.Empty)
            {
                return await _context.Companies
                    .FirstOrDefaultAsync(c => c.Id == companyId.Value && c.IsActive);
            }

            if (string.IsNullOrWhiteSpace(companyName))
            {
                return null;
            }

            var normalizedCompanyName = companyName.Trim();

            return await _context.Companies
                .FirstOrDefaultAsync(c => c.IsActive && c.Name != null && c.Name.ToLower() == normalizedCompanyName.ToLower());
        }

        private void SyncThumbnail(Tour tour, string? thumbnailUrl)
        {
            var thumbnailImages = tour.TourImages
                .Where(image => image.Isthumbnail)
                .OrderBy(image => image.DisplayOrder)
                .ThenBy(image => image.CreatedAt)
                .ToList();

            if (string.IsNullOrWhiteSpace(thumbnailUrl))
            {
                foreach (var image in thumbnailImages)
                {
                    _context.TourImages.Remove(image);
                }

                return;
            }

            var normalizedThumbnailUrl = thumbnailUrl.Trim();
            var primaryThumbnail = thumbnailImages.FirstOrDefault();

            if (primaryThumbnail == null)
            {
                tour.TourImages.Add(new TourImage
                {
                    ImageUrl = normalizedThumbnailUrl,
                    Isthumbnail = true,
                    DisplayOrder = 0
                });

                return;
            }

            primaryThumbnail.ImageUrl = normalizedThumbnailUrl;
            primaryThumbnail.Isthumbnail = true;
            primaryThumbnail.DisplayOrder = 0;
            primaryThumbnail.UpdatedAt = DateTime.UtcNow;

            foreach (var duplicateThumbnail in thumbnailImages.Skip(1))
            {
                _context.TourImages.Remove(duplicateThumbnail);
            }
        }
    }
}
