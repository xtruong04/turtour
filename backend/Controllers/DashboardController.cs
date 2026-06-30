using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TurTour.Data;
using TurTour.Helpers;
using TurTour.Models.Enums;

namespace TurTour.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class DashboardController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public DashboardController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet("overview")]
        [Authorize(Roles = "Admin,Organizator")]
        public async Task<IActionResult> Overview()
        {
            var totalTours = await _context.Tours.CountAsync();
            var totalStudents = await _context.UserRoles
                .Where(ur => ur.Role!.Name == "Student")
                .Select(ur => ur.UserId)
                .Distinct()
                .CountAsync();
            var totalRegistrations = await _context.Registrations.CountAsync();
            var completedRegistrations = await _context.Registrations.CountAsync(r => r.Status == RegistrationStatus.Completed);
            var completionRate = totalRegistrations == 0
                ? 0
                : (decimal)completedRegistrations / totalRegistrations * 100;

            var totalRevenue = await _context.Payments
                .Where(p => p.PaymentStatus == PaymentStatus.Paid)
                .SumAsync(p => p.Amount);

            var topCompanies = await _context.Registrations
                .Include(r => r.Tour)
                .ThenInclude(t => t!.Company)
                .Where(r => r.Tour != null && r.Tour.Company != null)
                .GroupBy(r => new { r.Tour!.CompanyId, r.Tour.Company!.Name })
                .Select(g => new
                {
                    companyId = g.Key.CompanyId,
                    companyName = g.Key.Name,
                    interestedCount = g.Count()
                })
                .OrderByDescending(x => x.interestedCount)
                .Take(10)
                .ToListAsync();

            return Ok(new
            {
                totalTours,
                totalStudents,
                totalRegistrations,
                completedRegistrations,
                completionRate,
                totalRevenue,
                topCompanies
            });
        }

        // Tổng quan dành cho Company/Organizator — chỉ tính trên tour của chính họ,
        // khác với "overview" (toàn hệ thống, chỉ Admin/Organizator xem được).
        [HttpGet("partner-overview")]
        [Authorize(Roles = "Organizator,Company")]
        public async Task<IActionResult> PartnerOverview()
        {
            var userId = CurrentUserHelper.GetUserId(User);
            if (userId == null)
            {
                return Unauthorized();
            }

            IQueryable<Models.Entities.Tour> tourQuery = _context.Tours;
            if (User.IsInRole("Company"))
            {
                var company = await _context.Companies.FirstOrDefaultAsync(c => c.UserId == userId);
                tourQuery = company == null
                    ? tourQuery.Where(t => false)
                    : tourQuery.Where(t => t.CompanyId == company.Id);
            }
            else
            {
                tourQuery = tourQuery.Where(t => t.CreatedBy == userId);
            }

            var myTours = await tourQuery.ToListAsync();
            var myTourIds = myTours.Select(t => t.Id).ToList();

            var pendingApprovalCount = myTours.Count(t => t.ApprovalStatus == ApprovalStatus.Pending);
            var openCount = myTours.Count(t => ToursController.ComputeEffectivePublishStatus(t) == PublishStatus.Published);

            var registrations = await _context.Registrations
                .Where(r => myTourIds.Contains(r.TourId))
                .ToListAsync();

            var totalRegistrations = registrations.Count;
            var totalRevenue = await _context.Payments
                .Where(p => p.PaymentStatus == PaymentStatus.Paid && registrations.Select(r => r.Id).Contains(p.RegistrationId))
                .SumAsync(p => p.Amount);

            return Ok(new
            {
                totalTours = myTours.Count,
                pendingApprovalCount,
                openCount,
                totalRegistrations,
                totalRevenue
            });
        }

        [HttpGet("reports")]
        [Authorize(Roles = "Admin,Organizator")]
        public async Task<IActionResult> Reports()
        {
            var result = await BuildReportAsync(_context.Tours);
            return Ok(result);
        }

        // Báo cáo dành cho Company/Organizator — cùng cấu trúc với "reports" (toàn hệ thống)
        // nhưng chỉ tính trên tour của chính họ, để vẽ chart/bảng riêng ở dashboard đối tác.
        [HttpGet("partner-reports")]
        [Authorize(Roles = "Organizator,Company")]
        public async Task<IActionResult> PartnerReports()
        {
            var userId = CurrentUserHelper.GetUserId(User);
            if (userId == null)
            {
                return Unauthorized();
            }

            IQueryable<Models.Entities.Tour> tourQuery = _context.Tours;
            if (User.IsInRole("Company"))
            {
                var company = await _context.Companies.FirstOrDefaultAsync(c => c.UserId == userId);
                tourQuery = company == null
                    ? tourQuery.Where(t => false)
                    : tourQuery.Where(t => t.CompanyId == company.Id);
            }
            else
            {
                tourQuery = tourQuery.Where(t => t.CreatedBy == userId);
            }

            var result = await BuildReportAsync(tourQuery);
            return Ok(result);
        }

        private async Task<object> BuildReportAsync(IQueryable<Models.Entities.Tour> tourQuery)
        {
            var tours = await tourQuery
                .Include(t => t.Company)
                .OrderByDescending(t => t.StartDate)
                .ToListAsync();

            var tourIds = tours.Select(t => t.Id).ToList();

            var registrations = await _context.Registrations
                .Where(r => tourIds.Contains(r.TourId))
                .ToListAsync();
            var registrationIds = registrations.Select(r => r.Id).ToList();
            var payments = await _context.Payments
                .Where(p => p.PaymentStatus == PaymentStatus.Paid && registrationIds.Contains(p.RegistrationId))
                .ToListAsync();

            var toursReport = tours.Select(tour =>
            {
                var tourRegistrations = registrations.Where(r => r.TourId == tour.Id).ToList();
                var approvedCount = tourRegistrations.Count(r =>
                    r.Status == RegistrationStatus.Approved ||
                    r.Status == RegistrationStatus.Paid ||
                    r.Status == RegistrationStatus.CheckedIn ||
                    r.Status == RegistrationStatus.Completed);
                var paidCount = tourRegistrations.Count(r =>
                    r.Status == RegistrationStatus.Paid ||
                    r.Status == RegistrationStatus.CheckedIn ||
                    r.Status == RegistrationStatus.Completed);
                var completedCount = tourRegistrations.Count(r => r.Status == RegistrationStatus.Completed);
                var totalRegs = tourRegistrations.Count;
                var revenue = payments
                    .Where(p => tourRegistrations.Any(r => r.Id == p.RegistrationId))
                    .Sum(p => p.Amount);

                return new
                {
                    tourId = tour.Id,
                    code = tour.Code,
                    title = tour.Tittle,
                    companyName = tour.Company?.Name ?? "",
                    approvalStatus = tour.ApprovalStatus,
                    publishStatus = ToursController.ComputeEffectivePublishStatus(tour),
                    startDate = tour.StartDate,
                    maxParticipants = tour.MaxParticipants,
                    totalRegistrations = totalRegs,
                    approvedCount,
                    paidCount,
                    completedCount,
                    participationRate = totalRegs == 0 ? 0 : Math.Round((decimal)completedCount / totalRegs * 100, 1),
                    revenue
                };
            }).ToList();

            var revenueByMonth = payments
                .GroupBy(p => new { p.PaidAt.Year, p.PaidAt.Month })
                .Select(g => new
                {
                    month = $"{g.Key.Year:0000}-{g.Key.Month:00}",
                    totalAmount = g.Sum(p => p.Amount)
                })
                .OrderBy(x => x.month)
                .ToList();

            var revenueByCompany = tours
                .GroupBy(t => t.Company?.Name ?? "")
                .Where(g => !string.IsNullOrEmpty(g.Key))
                .Select(g => new
                {
                    companyName = g.Key,
                    revenue = toursReport.Where(tr => g.Any(t => t.Id == tr.tourId)).Sum(tr => tr.revenue)
                })
                .OrderByDescending(x => x.revenue)
                .ToList();

            return new
            {
                toursReport,
                revenueByMonth,
                revenueByCompany
            };
        }
    }
}
