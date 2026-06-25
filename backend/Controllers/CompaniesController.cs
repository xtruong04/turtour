using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TurTour.Data;
using TurTour.DTOs.Company;
using TurTour.Helpers;
using TurTour.Models.Entities;

namespace TurTour.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class CompaniesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public CompaniesController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> GetAll()
        {
            var companies = await _context.Companies
                .OrderBy(c => c.Name)
                .ToListAsync();

            return Ok(companies);
        }

        [HttpGet("{id:guid}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetById(Guid id)
        {
            var company = await _context.Companies.FindAsync(id);
            return company == null ? NotFound() : Ok(company);
        }

        //[HttpPost]
        //[Authorize(Roles = "Admin")]
        //public async Task<IActionResult> Create(CompanyUpsertRequest request)
        //{
        //    var company = new Company
        //    {
        //        Name = request.Name,
        //        Description = request.Description,
        //        Address = request.Address,
        //        Website = request.Website,
        //        Email = request.Email,
        //        Phone = request.Phone,
        //        LogoUrl = request.LogoUrl,
        //        Industry = request.Industry,
        //        IsActive = request.IsActive
        //    };

        //    _context.Companies.Add(company);
        //    await _context.SaveChangesAsync();

        //    return CreatedAtAction(nameof(GetById), new { id = company.Id }, company);
        //}

        [HttpPut("{id:guid}")]
        [Authorize(Roles = "Admin,Company")]
        public async Task<IActionResult> Update(Guid id, CompanyUpsertRequest request)
        {
            var company = await _context.Companies.FirstOrDefaultAsync(c => c.Id == id);
            if (company == null)
            {
                return NotFound();
            }

            if (User.IsInRole("Company"))
            {
                var userId = CurrentUserHelper.GetUserId(User);
                if (userId == null || company.UserId != userId)
                {
                    return Forbid();
                }
            }

            company.Name = request.Name;
            company.Description = request.Description;
            company.Address = request.Address;
            company.Website = request.Website;
            company.Email = request.Email;
            company.Phone = request.Phone;
            company.LogoUrl = request.LogoUrl;
            company.Industry = request.Industry;
            company.IsActive = request.IsActive;
            company.UpdatedAt = DateTime.UtcNow;

            if (company.UserId.HasValue)
            {
                var user = await _context.Users.FindAsync(company.UserId.Value);
                if (user != null)
                {
                    user.FullName = request.Name;
                    user.Email = request.Email ?? user.Email;
                    user.PhoneNumber = request.Phone;
                    user.IsActive = request.IsActive;
                    user.UpdatedAt = DateTime.UtcNow;
                }
            }

            await _context.SaveChangesAsync();
            return Ok(company);
        }

        [HttpDelete("{id:guid}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var company = await _context.Companies.FindAsync(id);
            if (company == null)
            {
                return NotFound();
            }

            var hasTours = await _context.Tours.AnyAsync(t => t.CompanyId == id);
            if (hasTours)
            {
                company.IsActive = false;
                company.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
                return Ok(new { message = "Company has tours, switched to inactive." });
            }

            _context.Companies.Remove(company);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
