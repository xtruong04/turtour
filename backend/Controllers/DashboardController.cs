using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TurTour.Data;
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

        [HttpGet("reports")]
        [Authorize(Roles = "Admin,Organizator")]
        public async Task<IActionResult> Reports()
        {
            var tours = await _context.Tours
                .Include(t => t.Company)
                .OrderByDescending(t => t.StartDate)
                .ToListAsync();

            var registrations = await _context.Registrations.ToListAsync();
            var payments = await _context.Payments
                .Where(p => p.PaymentStatus == PaymentStatus.Paid)
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
                    status = tour.Status,
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

            return Ok(new
            {
                toursReport,
                revenueByMonth,
                revenueByCompany
            });
        }
    }
}
