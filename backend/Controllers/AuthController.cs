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
        private readonly EmailService _emailService;
        private readonly IConfiguration _configuration;
        private readonly ILogger<AuthController> _logger;

        public AuthController(ApplicationDbContext context, JwtService jwtService, EmailService emailService, IConfiguration configuration, ILogger<AuthController> logger)
        {
            _context = context;
            _jwtService = jwtService;
            _emailService = emailService;
            _configuration = configuration;
            _logger = logger;
        }

        private async Task<bool> IsEmailInUseAsync(string email)
        {
            return await _context.Users.AnyAsync(u => u.Email == email)
                || await _context.Companies.AnyAsync(c => c.Email == email)
                || await _context.Organizators.AnyAsync(o => o.Email == email);
        }

        // Sinh token xác thực email, gán vào user (chưa lưu DB — caller tự SaveChangesAsync).
        private static string AssignEmailConfirmationToken(User user)
        {
            var token = Guid.NewGuid().ToString("N") + Guid.NewGuid().ToString("N");
            user.EmailConfirmed = false;
            user.EmailConfirmationToken = token;
            user.EmailConfirmationTokenExpiresAt = DateTime.UtcNow.AddHours(24);
            return token;
        }

        // Gửi email xác thực — không chặn luồng đăng ký nếu gửi email thất bại (chỉ ghi log ngầm
        // qua việc EmailService tự bỏ qua khi chưa cấu hình SMTP).
        private void FireConfirmationEmail(string toEmail, string fullName, string token)
        {
            var frontendBaseUrl = _configuration["Frontend:BaseUrl"]?.TrimEnd('/') ?? "http://localhost:5173";
            var confirmUrl = $"{frontendBaseUrl}/auth/confirm-email?token={token}";

            // Fire-and-forget: không block response — email gửi nền.
            _ = Task.Run(async () =>
            {
                try
                {
                    await _emailService.SendEmailConfirmationAsync(toEmail, fullName, confirmUrl);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Gửi email xác thực thất bại tới {Email}", toEmail);
                }
            });
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
            var confirmationToken = AssignEmailConfirmationToken(user);

            _context.Users.Add(user);

            _context.UserRoles.Add(new UserRole
            {
                UserId = user.Id,
                RoleId = studentRole.Id
            });

            await _context.SaveChangesAsync();
            FireConfirmationEmail(user.Email, user.FullName, confirmationToken);

            return Ok(new
            {
                message = "Đăng ký thành công. Vui lòng kiểm tra email để xác thực tài khoản trước khi đăng nhập."
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
                IsActive = true,
                // Tạo admin là tác vụ nội bộ/seed, không qua luồng đăng ký công khai — bỏ qua xác thực email.
                EmailConfirmed = true
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

            if (!user.EmailConfirmed)
            {
                return BadRequest(new
                {
                    message = "Vui lòng xác thực email trước khi đăng nhập. Kiểm tra hộp thư của bạn hoặc bấm \"Gửi lại email xác thực\"."
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
                UserId = user.Id,
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
                avatarUrl = user.AvatarUrl,
                isActive = user.IsActive,
                roles,
                company,
                organizator
            });
        }

        [HttpPut("me")]
        [Authorize]
        public async Task<IActionResult> UpdateMe(UpdateProfileRequest request)
        {
            var userId = CurrentUserHelper.GetUserId(User);
            if (userId == null) return Unauthorized();

            var user = await _context.Users
                .Include(u => u.UserRoles).ThenInclude(ur => ur.Role)
                .FirstOrDefaultAsync(u => u.Id == userId);
            if (user == null) return NotFound();

            var roles = user.UserRoles.Select(ur => ur.Role!.Name).ToList();

            // Cập nhật thông tin cho User và cho Company/Organizator nếu là vai trò đó.
            user.FullName = request.FullName;
            user.PhoneNumber = request.PhoneNumber;
            if (request.AvatarUrl != null) user.AvatarUrl = request.AvatarUrl;
            user.UpdatedAt = DateTime.UtcNow;

            if (roles.Contains("Company"))
            {
                var company = await _context.Companies.FirstOrDefaultAsync(c => c.UserId == userId);
                if (company != null)
                {
                    company.Name = request.FullName;
                    company.Phone = request.PhoneNumber;
                    company.UpdatedAt = DateTime.UtcNow;
                }
            }
            else if (roles.Contains("Organizator"))
            {
                var organizator = await _context.Organizators.FirstOrDefaultAsync(o => o.UserId == userId);
                if (organizator != null)
                {
                    organizator.Name = request.FullName;
                    organizator.Phone = request.PhoneNumber;
                    organizator.UpdatedAt = DateTime.UtcNow;
                }
            }

            await _context.SaveChangesAsync();

            return Ok(new
            {
                id = user.Id,
                fullName = user.FullName,
                email = user.Email,
                phoneNumber = user.PhoneNumber,
                avatarUrl = user.AvatarUrl,
                isActive = user.IsActive,
                roles
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
            var confirmationToken = AssignEmailConfirmationToken(user);

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
            FireConfirmationEmail(user.Email, company.Name ?? user.FullName, confirmationToken);

            return Ok(new
            {
                message = "Đăng ký thành công. Vui lòng kiểm tra email để xác thực tài khoản trước khi đăng nhập."
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
            var confirmationToken = AssignEmailConfirmationToken(user);

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
            FireConfirmationEmail(user.Email, organizator.Name ?? user.FullName, confirmationToken);

            return Ok(new
            {
                message = "Đăng ký thành công. Vui lòng kiểm tra email để xác thực tài khoản trước khi đăng nhập."
            });
        }

        // Bấm link trong email xác thực sẽ gọi endpoint này (qua trang /auth/confirm-email phía FE).
        [HttpPost("confirm-email")]
        public async Task<IActionResult> ConfirmEmail(ConfirmEmailRequest request)
        {
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.EmailConfirmationToken == request.Token);

            if (user == null)
            {
                return BadRequest(new { message = "Liên kết xác thực không hợp lệ hoặc đã được sử dụng." });
            }

            if (user.EmailConfirmationTokenExpiresAt == null || user.EmailConfirmationTokenExpiresAt < DateTime.UtcNow)
            {
                return BadRequest(new { message = "Liên kết xác thực đã hết hạn. Vui lòng yêu cầu gửi lại." });
            }

            user.EmailConfirmed = true;
            user.EmailConfirmationToken = null;
            user.EmailConfirmationTokenExpiresAt = null;
            user.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new { message = "Xác thực email thành công. Bạn có thể đăng nhập ngay bây giờ." });
        }

        // Gửi lại email xác thực — dùng khi link cũ hết hạn hoặc email gửi thất bại lúc đăng ký.
        [HttpPost("resend-confirmation")]
        public async Task<IActionResult> ResendConfirmation(ResendConfirmationRequest request)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
            if (user == null)
            {
                // Không tiết lộ email có tồn tại hay không — tránh dò email người dùng khác.
                return Ok(new { message = "Nếu email tồn tại trong hệ thống, link xác thực mới đã được gửi." });
            }

            if (user.EmailConfirmed)
            {
                return Ok(new { message = "Email này đã được xác thực, bạn có thể đăng nhập." });
            }

            var token = AssignEmailConfirmationToken(user);
            await _context.SaveChangesAsync();
            FireConfirmationEmail(user.Email, user.FullName, token);

            return Ok(new { message = "Nếu email tồn tại trong hệ thống, link xác thực mới đã được gửi." });
        }
    }
}
