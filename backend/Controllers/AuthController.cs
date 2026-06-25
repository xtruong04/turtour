using System;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TurTour.Data;
using TurTour.DTOs.Auth;
using TurTour.Helpers;
using TurTour.Models.Entities;
using TurTour.Services;

namespace TurTour.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : Controller
    {
        private readonly ApplicationDbContext _context;
        private readonly JwtService _jwtService;

        public AuthController(ApplicationDbContext context, JwtService jwtService)
        {
            _context = context;
            _jwtService = jwtService;
        }

        private async Task<bool> IsEmailInUseAsync(string email)
        {
            return await _context.Users.AnyAsync(u => u.Email == email)
                || await _context.Companies.AnyAsync(c => c.Email == email)
                || await _context.Organizators.AnyAsync(o => o.Email == email);
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register(RegisterRequest request)
        {
            var emailExists = await IsEmailInUseAsync(request.Email);

            if (emailExists)
            {
                return BadRequest(new
                {
                    message = "Email đã tồn tại"
                });
            }

            var studentRole = await _context.Roles
                .FirstOrDefaultAsync(r => r.Name == "Student");

            if (studentRole == null)
            {
                return BadRequest(new
                {
                    message = "Role Student chưa tồn tại. Hãy seed role trước."
                });
            }

            var user = new User
            {
                FullName = request.FullName,
                Email = request.Email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
                PhoneNumber = request.PhoneNumber,
                IsActive = true
            };

            _context.Users.Add(user);

            _context.UserRoles.Add(new UserRole
            {
                UserId = user.Id,
                RoleId = studentRole.Id
            });

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Đăng ký thành công"
            });
        }

        [HttpPost("register-admin")]
        public async Task<IActionResult> RegisterAdmin(RegisterRequest request)
        {
            var emailExists = await IsEmailInUseAsync(request.Email);

            if (emailExists)
            {
                return BadRequest(new
                {
                    message = "Email đã tồn tại"
                });
            }

            var adminRole = await _context.Roles
                .FirstOrDefaultAsync(r => r.Name == "Admin");

            if (adminRole == null)
            {
                return BadRequest(new
                {
                    message = "Role Admin chưa tồn tại. Hãy seed role trước."
                });
            }

            var user = new User
            {
                FullName = request.FullName,
                Email = request.Email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
                PhoneNumber = request.PhoneNumber,
                IsActive = true
            };

            _context.Users.Add(user);

            _context.UserRoles.Add(new UserRole
            {
                UserId = user.Id,
                RoleId = adminRole.Id
            });

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Đăng ký admin thành công",
                userId = user.Id
            });
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login(LoginRequest request)
        {
            var user = await _context.Users
                .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
                .FirstOrDefaultAsync(u => u.Email == request.Email);

            Company? company = null;
            Organizator? organizator = null;

            if (user == null)
            {
                company = await _context.Companies
                    .Include(c => c.User)
                    .ThenInclude(u => u!.UserRoles)
                    .ThenInclude(ur => ur.Role)
                    .FirstOrDefaultAsync(c => c.Email == request.Email);

                user = company?.User;
            }

            if (user == null)
            {
                organizator = await _context.Organizators
                    .Include(o => o.User)
                    .ThenInclude(u => u!.UserRoles)
                    .ThenInclude(ur => ur.Role)
                    .FirstOrDefaultAsync(o => o.Email == request.Email);

                user = organizator?.User;
            }

            if (user == null)
            {
                return BadRequest(new
                {
                    message = "Email hoặc mật khẩu không đúng"
                });
            }

            var isPasswordValid = BCrypt.Net.BCrypt.Verify(
                request.Password,
                user.PasswordHash
            );

            if (!isPasswordValid)
            {
                return BadRequest(new
                {
                    message = "Email hoặc mật khẩu không đúng"
                });
            }

            var roles = user.UserRoles
                .Select(ur => ur.Role!.Name)
                .ToList();

            var fullName = user.FullName;
            var email = user.Email;
            var isActive = user.IsActive;

            if (roles.Contains("Company"))
            {
                company ??= await _context.Companies.FirstOrDefaultAsync(c => c.UserId == user.Id);
                if (company != null)
                {
                    fullName = company.Name ?? fullName;
                    email = company.Email ?? email;
                    isActive = isActive && company.IsActive;
                }
            }

            if (roles.Contains("Organizator"))
            {
                organizator ??= await _context.Organizators.FirstOrDefaultAsync(o => o.UserId == user.Id);
                if (organizator != null)
                {
                    fullName = organizator.Name;
                    email = organizator.Email ?? email;
                    isActive = isActive && organizator.IsActive;
                }
            }

            if (!isActive)
            {
                return BadRequest(new
                {
                    message = "Tài khoản đã bị khóa"
                });
            }

            var token = _jwtService.GenerateToken(user, roles);

            return Ok(new AuthResponse
            {
                Token = token,
                FullName = fullName,
                Email = email,
                Roles = roles
            });
        }

        [HttpPost("logout")]
        [Authorize]
        public IActionResult Logout()
        {
            return Ok(new
            {
                message = "Đăng xuất thành công. Hãy xóa token ở phía client."
            });
        }

        [HttpGet("me")]
        [Authorize]
        public async Task<IActionResult> Me()
        {
            var userId = CurrentUserHelper.GetUserId(User);
            if (userId == null)
            {
                return Unauthorized();
            }

            var user = await _context.Users
                .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
                .FirstOrDefaultAsync(u => u.Id == userId);

            if (user == null)
            {
                return NotFound();
            }

            var roles = user.UserRoles.Select(ur => ur.Role!.Name).ToList();

            var company = roles.Contains("Company")
                ? await _context.Companies.FirstOrDefaultAsync(c => c.UserId == user.Id)
                : null;

            var organizator = roles.Contains("Organizator")
                ? await _context.Organizators.FirstOrDefaultAsync(o => o.UserId == user.Id)
                : null;

            return Ok(new
            {
                id = user.Id,
                fullName = company?.Name ?? organizator?.Name ?? user.FullName,
                email = company?.Email ?? organizator?.Email ?? user.Email,
                phoneNumber = company?.Phone ?? organizator?.Phone ?? user.PhoneNumber,
                isActive = user.IsActive,
                roles,
                company,
                organizator
            });
        }

        [HttpPost("register-company")]
        public async Task<IActionResult> RegisterCompany(RegisterCompanyRequest request)
        {
            var emailExists = await IsEmailInUseAsync(request.CompanyEmail);

            if (emailExists)
            {
                return BadRequest(new { message = "Email đã tồn tại" });
            }

            var companyRole = await _context.Roles
                .FirstOrDefaultAsync(r => r.Name == "Company");

            if (companyRole == null)
            {
                return BadRequest(new { message = "Role Company chưa tồn tại. Hãy seed role trước." });
            }

            var user = new User
            {
                FullName = request.CompanyName,
                Email = request.CompanyEmail,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
                PhoneNumber = request.CompanyPhone,
                IsActive = true
            };

            _context.Users.Add(user);

            _context.UserRoles.Add(new UserRole
            {
                UserId = user.Id,
                RoleId = companyRole.Id
            });

            var company = new Company
            {
                Name = request.CompanyName,
                Description = request.Description,
                Address = request.Address,
                Website = request.Website,
                Email = request.CompanyEmail,
                Phone = request.CompanyPhone,
                LogoUrl = request.LogoUrl,
                Industry = request.Industry,
                UserId = user.Id,
                IsActive = true
            };

            _context.Companies.Add(company);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Đăng ký company thành công",
                userId = user.Id,
                companyId = company.Id
            });
        }

        [HttpPost("register-organizator")]
        public async Task<IActionResult> RegisterOrganizator(RegisterOrganizatorRequest request)
        {
            var emailExists = await IsEmailInUseAsync(request.OrganizatorEmail);

            if (emailExists)
            {
                return BadRequest(new { message = "Email đã tồn tại" });
            }

            var organizatorRole = await _context.Roles
                .FirstOrDefaultAsync(r => r.Name == "Organizator");

            if (organizatorRole == null)
            {
                return BadRequest(new { message = "Role Organizator chưa tồn tại. Hãy seed role trước." });
            }

            var user = new User
            {
                FullName = request.OrganizatorName,
                Email = request.OrganizatorEmail,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
                PhoneNumber = request.OrganizatorPhone,
                IsActive = true
            };

            _context.Users.Add(user);

            _context.UserRoles.Add(new UserRole
            {
                UserId = user.Id,
                RoleId = organizatorRole.Id
            });

            var organizator = new Organizator
            {
                Name = request.OrganizatorName,
                Description = request.Description,
                Address = request.Address,
                Website = request.Website,
                Email = request.OrganizatorEmail,
                Phone = request.OrganizatorPhone,
                LogoUrl = request.LogoUrl,
                UserId = user.Id,
                IsActive = true
            };

            _context.Organizators.Add(organizator);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Đăng ký organizator thành công",
                userId = user.Id,
                organizatorId = organizator.Id
            });
        }
    }
}
