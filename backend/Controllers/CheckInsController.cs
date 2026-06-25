using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TurTour.Data;
using TurTour.DTOs.CheckIn;
using TurTour.Helpers;
using TurTour.Models.Enums;
using TurTour.Services;

namespace TurTour.Controllers
{
    [Route("api/check-ins")]
    [ApiController]
    [Authorize]
    public class CheckInsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public CheckInsController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpPost("generate/{registrationId:guid}")]
        [Authorize(Roles = "Admin,Organizator")]
        public async Task<IActionResult> Generate(Guid registrationId)
        {
            var registration = await _context.Registrations.FindAsync(registrationId);
            if (registration == null)
            {
                return NotFound(new { message = "Registration not found." });
            }

            if (registration.Status != RegistrationStatus.Paid && registration.Status != RegistrationStatus.Approved)
            {
                return BadRequest(new { message = "Registration must be approved or paid before generating QR." });
            }

            var checkIn = await CheckInQrHelper.GenerateOrRefreshAsync(_context, registrationId);

            await _context.SaveChangesAsync();
            return Ok(checkIn);
        }

        [HttpPost("scan")]
        [Authorize(Roles = "Admin,Organizator")]
        public async Task<IActionResult> Scan(ScanQrRequest request)
        {
            var userId = CurrentUserHelper.GetUserId(User);
            if (userId == null)
            {
                return Unauthorized();
            }

            var checkIn = await _context.CheckIns
                .Include(c => c.Registration)
                .FirstOrDefaultAsync(c => c.QrCode == request.QrCode);
            if (checkIn == null || checkIn.Registration == null)
            {
                return NotFound(new { message = "QR code not found." });
            }

            if (checkIn.IsCheckedIn)
            {
                return BadRequest(new { message = "This QR code was already used." });
            }

            checkIn.IsCheckedIn = true;
            checkIn.CheckedInAt = DateTime.UtcNow;
            checkIn.CheckedInBy = userId;
            checkIn.UpdatedAt = DateTime.UtcNow;

            checkIn.Registration.Status = RegistrationStatus.CheckedIn;
            checkIn.Registration.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Check-in successful.",
                registrationId = checkIn.RegistrationId,
                checkedInAt = checkIn.CheckedInAt
            });
        }
    }
}
