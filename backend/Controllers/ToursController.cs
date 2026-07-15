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

        // Frontend gửi StartDate/EndDate/BookingOpenAt/BookingCloseAt dưới dạng giờ VN không kèm
        // offset (xem create.jsx), nhưng cột DB là timestamptz và Npgsql (legacy timestamp mode,
        // theo timezone của container — đã đặt UTC+7) tự quy đổi giá trị này sang UTC thật khi
        // ghi xuống DB. Vì vậy giá trị đọc lại từ DB đã là UTC chuẩn — so sánh thẳng với
        // DateTime.UtcNow, KHÔNG cộng thêm 7 giờ nữa (cộng thêm sẽ lệch giờ, tour bị coi là hoàn
        // thành sớm hơn thực tế 7 tiếng).
        internal static DateTime VietnamNow => DateTime.UtcNow;

        // Tính trạng thái hiển thị hiệu lực ở runtime — không ghi DB, chỉ đọc.
        // TourLifecycleService ghi DB không đồng bộ (mỗi giờ); hàm này bù khoảng trễ đó.
        internal static PublishStatus ComputeEffectivePublishStatus(Tour tour)
        {
            // Archived (bị huỷ thủ công) và Completed (đã hoàn thành tự nhiên) đều là trạng thái
            // chấm hết, không tính lại theo thời gian — giữ nguyên giá trị đã lưu.
            if (tour.PublishStatus == PublishStatus.Archived) return PublishStatus.Archived;
            if (tour.PublishStatus == PublishStatus.Completed) return PublishStatus.Completed;
            if (tour.ApprovalStatus != ApprovalStatus.Approved) return PublishStatus.Hidden;

            // Published / OnGoing / Expired đã lưu → tính lại theo mốc thời gian thực tế
            var now = VietnamNow;
            if (now > tour.EndDate)        return PublishStatus.Completed;
            if (now > tour.BookingCloseAt) return PublishStatus.OnGoing;
            return PublishStatus.Published;
        }

        // Quyết định trạng thái DB lúc duyệt tour hoặc company đổi lịch — TourLifecycleService sẽ
        // tinh chỉnh tiếp theo giờ; hàm này chỉ đặt giá trị hợp lý ngay tại thời điểm gọi.
        private static PublishStatus DecidePublishStatusOnApproval(Tour tour)
        {
            var now = VietnamNow;
            if (now > tour.EndDate)        return PublishStatus.Completed;
            if (now > tour.BookingCloseAt) return PublishStatus.OnGoing;
            return PublishStatus.Published;
        }

        // Vai trò quản lý (Admin/Organizator/Company) được thấy cả tour chưa duyệt/bị từ chối —
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
                tour.PublishStatus = ComputeEffectivePublishStatus(tour);
            }

            if (!CanSeePendingTours())
            {
                tours = tours.Where(t => t.ApprovalStatus == ApprovalStatus.Approved).ToList();
            }

            await ApplyInterestFlagAsync(tours);

            return Ok(tours);
        }

        // Tour của riêng tài khoản đang đăng nhập — dùng cho dashboard đối tác (Company/Organizator),
        // tách biệt với GetAll (vốn trả về toàn bộ tour, dùng cho Admin).
        [HttpGet("mine")]
        [Authorize(Roles = "Organizator,Company")]
        public async Task<IActionResult> GetMine()
        {
            var userId = CurrentUserHelper.GetUserId(User);
            if (userId == null)
            {
                return Unauthorized();
            }

            var query = _context.Tours
                .Include(t => t.Company)
                .Include(t => t.TourSchedules.OrderBy(s => s.OrderIndex))
                .Include(t => t.TourImages.OrderBy(i => i.DisplayOrder));

            IQueryable<Tour> scoped;
            if (User.IsInRole("Company"))
            {
                var company = await _context.Companies.FirstOrDefaultAsync(c => c.UserId == userId);
                if (company == null)
                {
                    return Ok(Array.Empty<Tour>());
                }
                scoped = query.Where(t => t.CompanyId == company.Id);
            }
            else
            {
                scoped = query.Where(t => t.CreatedBy == userId);
            }

            var tours = await scoped.OrderByDescending(t => t.StartDate).ToListAsync();
            foreach (var tour in tours)
            {
                tour.PublishStatus = ComputeEffectivePublishStatus(tour);
            }

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

            tour.PublishStatus = ComputeEffectivePublishStatus(tour);

            if (tour.ApprovalStatus != ApprovalStatus.Approved && !CanSeePendingTours())
            {
                return NotFound();
            }

            await ApplyInterestFlagAsync(new[] { tour });
            return Ok(tour);
        }

        // Sinh viên đang đăng nhập có thể đánh dấu "Quan tâm" tour đang mở (Published), để
        // tiện theo dõi/nhắc bản thân đăng ký. Bấm lại lần nữa để bỏ quan tâm.
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

            if (ComputeEffectivePublishStatus(tour) != PublishStatus.Published)
            {
                return BadRequest(new { message = "Chỉ có thể đánh dấu quan tâm tour đang mở đăng ký." });
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

        [HttpGet("interested")]
        [Authorize(Roles = "Student")]
        public async Task<IActionResult> GetInterested()
        {
            var studentId = CurrentUserHelper.GetUserId(User);
            if (studentId == null)
            {
                return Unauthorized();
            }

            var tours = await _context.TourInterests
                .Where(ti => ti.StudentId == studentId)
                .Include(ti => ti.Tour).ThenInclude(t => t!.Company)
                .Include(ti => ti.Tour).ThenInclude(t => t!.TourImages.OrderBy(i => i.DisplayOrder))
                .Select(ti => ti.Tour!)
                .OrderByDescending(t => t.StartDate)
                .ToListAsync();

            foreach (var tour in tours)
            {
                tour.PublishStatus = ComputeEffectivePublishStatus(tour);
                tour.IsInterested = true;
            }

            return Ok(tours);
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

            var myRegistrations = await _context.Registrations
                .Where(r => r.StudentId == studentId && tourIds.Contains(r.TourId))
                .Select(r => new { r.TourId, r.Status })
                .ToListAsync();

            var interestedSet = interestedTourIds.ToHashSet();
            var regDict = myRegistrations.ToDictionary(r => r.TourId, r => r.Status.ToString());

            foreach (var tour in tours)
            {
                tour.IsInterested = interestedSet.Contains(tour.Id);
                if (regDict.TryGetValue(tour.Id, out var status))
                {
                    tour.IsRegistered = true;
                    tour.MyRegistrationStatus = status;
                }
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

            // Chỉ Admin tạo tour mới được duyệt ngay (và xuất bản tự động theo ngày khởi hành) —
            // Organizator/Company tạo tour luôn vào "Chờ duyệt", chờ Admin xét duyệt trước khi
            // hiển thị công khai.
            var isAdmin = User.IsInRole("Admin");
            var approvalStatus = isAdmin ? ApprovalStatus.Approved : ApprovalStatus.Pending;

            var tour = new Tour
            {
                Code = request.Code,
                Tittle = request.Tittle,
                Decriptions = request.Decriptions,
                Location = request.Location,
                StartDate = request.StartDate,
                EndDate = request.EndDate,
                BookingOpenAt = request.BookingOpenAt,
                BookingCloseAt = request.BookingCloseAt,
                MaxParticipants = request.MaxParticipants,
                CurrentParticipants = 0,
                Fee = request.Fee,
                ApprovalStatus = approvalStatus,
                PublishStatus = PublishStatus.Hidden,
                Requirement = request.Requirement,
                CompanyId = company.Id,
                CreatedBy = createdBy.Value
            };
            // Admin tạo tour là duyệt ngay — quyết định Published/Expired ngay tại đây theo
            // StartDate, không phải tính decay (tour vừa tạo chưa từng Published).
            if (approvalStatus == ApprovalStatus.Approved)
            {
                tour.PublishStatus = DecidePublishStatusOnApproval(tour);
            }

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

            if (approvalStatus == ApprovalStatus.Pending)
            {
                await NotifyAdminsOfPendingTourAsync(tour, company.Name);
                await NotifyCreatorTourSubmittedAsync(tour);
            }

            return CreatedAtAction(nameof(GetById), new { id = tour.Id }, tour);
        }

        // Báo cho chính người tạo tour biết tour đã được tạo và đang chờ Admin xét duyệt.
        private async Task NotifyCreatorTourSubmittedAsync(Tour tour)
        {
            var notification = new Notification
            {
                UserId = tour.CreatedBy,
                Title = "Tour đã được tạo",
                Content = $"Tour \"{tour.Tittle}\" đã được tạo và đang chờ Admin xét duyệt.",
                Type = "Tour",
                TourId = tour.Id,
                IsRead = false
            };
            _context.Notifications.Add(notification);
            await _context.SaveChangesAsync();
            await _realtime.NotifyUserAsync(notification);
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
                TourId = tour.Id,
                IsRead = false
            }).ToList();

            _context.Notifications.AddRange(notifications);
            await _context.SaveChangesAsync();

            foreach (var notification in notifications)
            {
                await _realtime.NotifyUserAsync(notification);
            }
        }

        // Chỉ Organizator/Company được sửa nội dung tour — Admin chỉ Duyệt/Từ chối/Huỷ, không
        // trực tiếp sửa nội dung (nội dung sai thì Reject kèm lý do, để company tự sửa và nộp lại).
        [HttpPut("{id:guid}")]
        [Authorize(Roles = "Organizator,Company")]
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

            if (tour.PublishStatus == PublishStatus.Archived)
            {
                return BadRequest(new { message = "Tour đã bị huỷ, không thể chỉnh sửa." });
            }

            if (tour.PublishStatus == PublishStatus.Completed)
            {
                return BadRequest(new { message = "Tour đã hoàn thành, không thể chỉnh sửa." });
            }

            var previousApproval = tour.ApprovalStatus;
            var previousPublish = tour.PublishStatus;
            // Phải so sánh nội dung TRƯỚC khi gán giá trị mới — chỉ sửa ngày khởi hành (không đổi
            // nội dung cần kiểm duyệt) thì tour đã Approved không phải duyệt lại từ đầu.
            var hasContentChanges = HasContentChanges(tour, request);

            tour.Code = request.Code;
            tour.Tittle = request.Tittle;
            tour.Decriptions = request.Decriptions;
            tour.Location = request.Location;
            tour.StartDate = request.StartDate;
            tour.EndDate = request.EndDate;
            tour.BookingOpenAt = request.BookingOpenAt;
            tour.BookingCloseAt = request.BookingCloseAt;
            tour.MaxParticipants = request.MaxParticipants;
            tour.Fee = request.Fee;
            tour.Requirement = request.Requirement;
            tour.CompanyId = company.Id;
            tour.UpdatedAt = DateTime.UtcNow;

            SyncThumbnail(tour, request.ThumbnailUrl);

            if (hasContentChanges || previousApproval != ApprovalStatus.Approved)
            {
                // Sửa nội dung cần kiểm duyệt (lịch trình/giá/điểm đến/mô tả...), hoặc tour chưa
                // từng được duyệt (đang Pending/Rejected) → về lại Chờ duyệt.
                tour.ApprovalStatus = ApprovalStatus.Pending;
                tour.PublishStatus = PublishStatus.Hidden;
            }
            else
            {
                // Chỉ đổi ngày khởi hành/kết thúc, nội dung đã được duyệt từ trước — đây là đường
                // hồi phục Expired -> Published khi company sửa lại ngày, nên tái đánh giá từ đầu
                // theo StartDate mới (không phải decay).
                tour.PublishStatus = DecidePublishStatusOnApproval(tour);
            }

            var interestNotifications = await NotifyInterestedStudentsIfNowPublishedAsync(tour, previousPublish);

            await _context.SaveChangesAsync();

            if (tour.ApprovalStatus != previousApproval || tour.PublishStatus != previousPublish)
            {
                await _realtime.NotifyTourUpdatedAsync(tour.Id, tour.ApprovalStatus.ToString(), tour.PublishStatus.ToString());

                if (tour.ApprovalStatus == ApprovalStatus.Pending)
                {
                    // Tour vừa được nộp lại (mới tạo, hoặc bị đẩy lại Pending do sửa nội dung) —
                    // báo Admin xét duyệt.
                    await NotifyAdminsOfPendingTourAsync(tour, company.Name);
                }
            }
            foreach (var notification in interestNotifications)
            {
                await _realtime.NotifyUserAsync(notification);
            }

            return Ok(tour);
        }

        // "Nội dung cần kiểm duyệt" theo workflow đề ra: tiêu đề, mô tả, địa điểm, giá, yêu cầu,
        // ảnh đại diện — đổi ngày khởi hành/kết thúc hoặc sức chứa không tính, vì không ảnh hưởng
        // nội dung tour mà Admin đã duyệt.
        private static bool HasContentChanges(Tour tour, TourUpsertRequest request)
        {
            var currentThumbnail = tour.TourImages
                .Where(image => image.Isthumbnail)
                .OrderBy(image => image.DisplayOrder)
                .Select(image => image.ImageUrl)
                .FirstOrDefault() ?? "";
            var requestedThumbnail = request.ThumbnailUrl?.Trim() ?? "";

            return tour.Code != request.Code
                || tour.Tittle != request.Tittle
                || tour.Decriptions != request.Decriptions
                || tour.Location != request.Location
                || tour.Fee != request.Fee
                || (tour.Requirement ?? "") != (request.Requirement ?? "")
                || currentThumbnail != requestedThumbnail;
        }

        // Admin duyệt tour đang Chờ duyệt — Published ngay nếu chưa quá ngày khởi hành, ngược
        // lại Expired (nội dung đã duyệt nhưng không hiển thị/không đặt được, chờ company sửa
        // lại ngày khởi hành).
        [HttpPatch("{id:guid}/approve")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Approve(Guid id)
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

            if (tour.ApprovalStatus != ApprovalStatus.Pending)
            {
                return BadRequest(new { message = "Chỉ duyệt được tour đang ở trạng thái Chờ duyệt." });
            }

            var previousPublish = tour.PublishStatus;
            tour.ApprovalStatus = ApprovalStatus.Approved;
            tour.PublishStatus = DecidePublishStatusOnApproval(tour);
            tour.UpdatedAt = DateTime.UtcNow;

            var interestNotifications = await NotifyInterestedStudentsIfNowPublishedAsync(tour, previousPublish);
            await _context.SaveChangesAsync();

            await _realtime.NotifyTourUpdatedAsync(tour.Id, tour.ApprovalStatus.ToString(), tour.PublishStatus.ToString());
            await NotifyCreatorOfApprovalDecisionAsync(tour, isRejected: false, reason: null);
            foreach (var notification in interestNotifications)
            {
                await _realtime.NotifyUserAsync(notification);
            }

            return Ok(tour);
        }

        // Admin từ chối tour đang Chờ duyệt — kèm lý do tuỳ chọn, báo cho người tạo tour.
        [HttpPatch("{id:guid}/reject")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Reject(Guid id, RejectTourRequest request)
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

            if (tour.ApprovalStatus != ApprovalStatus.Pending)
            {
                return BadRequest(new { message = "Chỉ từ chối được tour đang ở trạng thái Chờ duyệt." });
            }

            tour.ApprovalStatus = ApprovalStatus.Rejected;
            tour.PublishStatus = PublishStatus.Hidden;
            tour.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            await _realtime.NotifyTourUpdatedAsync(tour.Id, tour.ApprovalStatus.ToString(), tour.PublishStatus.ToString());
            await NotifyCreatorOfApprovalDecisionAsync(tour, isRejected: true, reason: request.Reason);

            return Ok(tour);
        }

        // Company/Organizator tự huỷ tour của mình (sau khi đã Published), hoặc Admin lưu trữ
        // tour bất kỳ — Archived là trạng thái chấm hết do HUỶ, không có đường quay lại (phải
        // tạo tour mới nếu muốn mở lại). Không huỷ được tour đã Completed (đã hoàn thành tự
        // nhiên) — 2 trạng thái chấm hết này tách biệt, không gộp chung.
        [HttpPatch("{id:guid}/archive")]
        [Authorize(Roles = "Admin,Organizator,Company")]
        public async Task<IActionResult> Archive(Guid id)
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

            if (tour.PublishStatus == PublishStatus.Archived)
            {
                return Ok(tour);
            }

            if (tour.PublishStatus == PublishStatus.Completed)
            {
                return BadRequest(new { message = "Tour đã hoàn thành, không thể huỷ." });
            }

            tour.PublishStatus = PublishStatus.Archived;
            tour.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            await _realtime.NotifyTourUpdatedAsync(tour.Id, tour.ApprovalStatus.ToString(), tour.PublishStatus.ToString());
            return Ok(tour);
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

        // Báo cho người tạo tour biết kết quả xét duyệt — duyệt thì kèm Publish hiện tại
        // (Published nếu còn hạn, Expired nếu đã quá ngày khởi hành), từ chối thì kèm lý do nếu có.
        private async Task NotifyCreatorOfApprovalDecisionAsync(Tour tour, bool isRejected, string? reason)
        {
            var notification = new Notification
            {
                UserId = tour.CreatedBy,
                Title = isRejected ? "Tour của bạn đã bị từ chối" : "Tour của bạn đã được duyệt",
                Content = isRejected
                    ? $"Tour \"{tour.Tittle}\" đã bị Admin từ chối." + (string.IsNullOrWhiteSpace(reason) ? "" : $" Lý do: {reason.Trim()}")
                    : $"Tour \"{tour.Tittle}\" đã được Admin duyệt, hiện đang ở trạng thái \"{tour.PublishStatus}\".",
                Type = "Tour",
                TourId = tour.Id,
                IsRead = false
            };
            _context.Notifications.Add(notification);
            await _context.SaveChangesAsync();
            await _realtime.NotifyUserAsync(notification);
        }

        // Tour vừa chuyển sang Published (mới duyệt xong còn hạn, hoặc company sửa lại ngày
        // khởi hành cho 1 tour đã Expired) — báo cho các sinh viên đã đánh dấu "Quan tâm", rồi
        // xoá khỏi danh sách quan tâm (đã báo xong, tránh báo lại lần sau).
        private async Task<List<Notification>> NotifyInterestedStudentsIfNowPublishedAsync(Tour tour, PublishStatus previousPublish)
        {
            var notifications = new List<Notification>();
            if (previousPublish == PublishStatus.Published || tour.PublishStatus != PublishStatus.Published)
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
                    TourId = tour.Id,
                    IsRead = false
                };
                _context.Notifications.Add(notification);
                notifications.Add(notification);
            }
            _context.TourInterests.RemoveRange(interests);
            return notifications;
        }

        // Chỉ Organizator/Company xoá tour của mình — Admin không xoá tour của doanh nghiệp/tổ
        // chức, chỉ Duyệt/Từ chối/Huỷ (Archive). Tour vi phạm thì Reject hoặc Archive, không xoá hẳn.
        [HttpDelete("{id:guid}")]
        [Authorize(Roles = "Organizator,Company")]
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
        [Authorize(Roles = "Organizator,Company")]
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
            var demoted = DemoteToPendingForContentChange(tour);
            await _context.SaveChangesAsync();
            await NotifyIfDemotedAsync(tour, demoted);
            return Ok(schedule);
        }

        [HttpPut("{id:guid}/schedules/{scheduleId:guid}")]
        [Authorize(Roles = "Organizator,Company")]
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

            var demoted = DemoteToPendingForContentChange(tour);
            await _context.SaveChangesAsync();
            await NotifyIfDemotedAsync(tour, demoted);
            return Ok(schedule);
        }

        [HttpDelete("{id:guid}/schedules/{scheduleId:guid}")]
        [Authorize(Roles = "Organizator,Company")]
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
            var demoted = DemoteToPendingForContentChange(tour);
            await _context.SaveChangesAsync();
            await NotifyIfDemotedAsync(tour, demoted);
            return NoContent();
        }

        // Company/Organizator sửa lịch trình (thêm/sửa/xoá) của 1 tour đã Approved tính là sửa
        // nội dung cần kiểm duyệt theo workflow — phải duyệt lại.
        private bool DemoteToPendingForContentChange(Tour tour)
        {
            if (tour.ApprovalStatus != ApprovalStatus.Approved)
            {
                return false;
            }

            tour.ApprovalStatus = ApprovalStatus.Pending;
            tour.PublishStatus = PublishStatus.Hidden;
            tour.UpdatedAt = DateTime.UtcNow;
            return true;
        }

        private async Task NotifyIfDemotedAsync(Tour tour, bool demoted)
        {
            if (!demoted)
            {
                return;
            }

            await _realtime.NotifyTourUpdatedAsync(tour.Id, tour.ApprovalStatus.ToString(), tour.PublishStatus.ToString());
            var company = await _context.Companies.FindAsync(tour.CompanyId);
            await NotifyAdminsOfPendingTourAsync(tour, company?.Name);
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
        [Authorize(Roles = "Organizator,Company")]
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
