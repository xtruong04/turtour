
using Amazon.S3;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Resend;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System;
using System.Linq;
using System.Text;
using System.Text.Json.Serialization;
using TurTour.Data;
using TurTour.Hubs;
using TurTour.Models.Entities;
using TurTour.Services;
using Microsoft.OpenApi.Models;

namespace TurTour
{
    public class Program
    {
        public static async Task Main(string[] args)
        {
            AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);
            var builder = WebApplication.CreateBuilder(args);
            const string DevCorsPolicy = "FrontendDev";

            // Railway (và nhiều PaaS khác) cấp cổng lắng nghe qua biến môi trường PORT,
            // không qua ASPNETCORE_URLS — phải tự bind Kestrel vào đúng cổng đó khi deploy.
            var railwayPort = Environment.GetEnvironmentVariable("PORT");
            if (!string.IsNullOrWhiteSpace(railwayPort))
            {
                builder.WebHost.UseUrls($"http://0.0.0.0:{railwayPort}");
            }

            // Configure JWT authentication
            var jwtKey = builder.Configuration["Jwt:Key"];
            builder.Services.AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
            })
            .AddJwtBearer(options =>
            {
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,

                    ValidIssuer = builder.Configuration["Jwt:Issuer"],
                    ValidAudience = builder.Configuration["Jwt:Audience"],
                    IssuerSigningKey = new SymmetricSecurityKey(
                        Encoding.UTF8.GetBytes(jwtKey!)
                    )
                };

                // SignalR không gửi được header Authorization khi nâng cấp lên WebSocket,
                // nên lấy token qua query string (?access_token=) cho riêng đường dẫn /hubs.
                options.Events = new JwtBearerEvents
                {
                    OnMessageReceived = context =>
                    {
                        var accessToken = context.Request.Query["access_token"];
                        if (!string.IsNullOrEmpty(accessToken) && context.HttpContext.Request.Path.StartsWithSegments("/hubs"))
                        {
                            context.Token = accessToken;
                        }
                        return Task.CompletedTask;
                    }
                };
            });
            // Add JwtService to the DI container
            builder.Services.AddScoped<JwtService>();

            builder.Services.AddHostedService<TourLifecycleService>();

            builder.Services.AddSignalR();
            builder.Services.AddSingleton<RealtimeNotifier>();
            builder.Services.AddHttpClient("AddressApi", client =>
            {
                client.BaseAddress = new Uri("https://tinhthanhpho.com/api/v1/");
                client.Timeout = TimeSpan.FromSeconds(10);
            });

            // Cloudflare R2 (S3-compatible) storage
            var r2AccountId = builder.Configuration["R2:AccountId"];
            builder.Services.AddSingleton<IAmazonS3>(_ => new AmazonS3Client(
                builder.Configuration["R2:AccessKey"],
                builder.Configuration["R2:SecretKey"],
                new AmazonS3Config
                {
                    ServiceURL = $"https://{r2AccountId}.r2.cloudflarestorage.com",
                    ForcePathStyle = true
                }));
            builder.Services.AddScoped<R2StorageService>();
            builder.Services.AddScoped<EmailService>();

            // Resend (HTTPS email API — thay thế SMTP bị block trên Railway)
            builder.Services.AddOptions();
            builder.Services.AddHttpClient<ResendClient>();
            builder.Services.Configure<ResendClientOptions>(o =>
            {
                o.ApiToken = builder.Configuration["Resend:ApiKey"] ?? "";
            });
            builder.Services.AddTransient<IResend, ResendClient>();

            //PostgreSQL connection
            builder.Services.AddDbContext<ApplicationDbContext>(options =>
            options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

            // Domain frontend đã deploy (Vercel...) — cấu hình qua biến môi trường/appsettings
            // "AllowedOrigins" (mảng chuỗi), tách biệt với localhost luôn được phép cho dev.
            var extraAllowedOrigins = builder.Configuration.GetSection("AllowedOrigins").Get<string[]>() ?? [];

            builder.Services.AddCors(options =>
            {
                options.AddPolicy(DevCorsPolicy, policy =>
                {
                    policy
                        .SetIsOriginAllowed(origin =>
                        {
                            if (!Uri.TryCreate(origin, UriKind.Absolute, out var uri))
                            {
                                return false;
                            }

                            var isLocalHost = uri.Host.Equals("localhost", StringComparison.OrdinalIgnoreCase)
                                || uri.Host.Equals("127.0.0.1", StringComparison.OrdinalIgnoreCase);

                            var isExtraAllowed = extraAllowedOrigins.Contains(origin, StringComparer.OrdinalIgnoreCase);

                            return (isLocalHost || isExtraAllowed) && (uri.Scheme == Uri.UriSchemeHttp || uri.Scheme == Uri.UriSchemeHttps);
                        })
                        .AllowAnyHeader()
                        .AllowAnyMethod();
                });
            });

            builder.Services.AddControllers()
                .AddJsonOptions(options =>
                {
                    options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
                    options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
                });
            builder.Services.Configure<ApiBehaviorOptions>(options =>
            {
                options.InvalidModelStateResponseFactory = context =>
                {
                    var errors = context.ModelState
                        .Where(entry => entry.Value?.Errors.Count > 0)
                        .Select(entry => new
                        {
                            field = entry.Key,
                            messages = entry.Value!.Errors
                                .Select(error => string.IsNullOrWhiteSpace(error.ErrorMessage)
                                    ? "Giá trị không hợp lệ."
                                    : error.ErrorMessage)
                                .ToArray()
                        })
                        .ToArray();

                    return new BadRequestObjectResult(new
                    {
                        message = "Dữ liệu gửi lên không hợp lệ.",
                        errorCount = errors.Length,
                        errors
                    });
                };
            });
            // Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
            builder.Services.AddEndpointsApiExplorer();
            builder.Services.AddSwaggerGen(c =>
            {
                c.SwaggerDoc("v1", new OpenApiInfo
                {
                    Title = "TurTour API",
                    Version = "v1"
                });

                c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
                {
                    Name = "Authorization",
                    Type = SecuritySchemeType.Http,
                    Scheme = "Bearer",
                    BearerFormat = "JWT",
                    In = ParameterLocation.Header,
                    Description = "Nhập JWT token. Ví dụ: Bearer eyJhbGciOiJIUzI1NiIs..."
                });

                c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
            });

            var app = builder.Build();

            // Tự áp dụng migration còn thiếu khi khởi động — cần khi deploy lên PaaS
            // (Railway...) vì không thể chạy "dotnet ef database update" thủ công dễ dàng.
            using (var scope = app.Services.CreateScope())
            {
                var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                dbContext.Database.Migrate();
                await SeedRolesAsync(dbContext);
            }

            // Configure the HTTP request pipeline.
            if (app.Environment.IsDevelopment())
            {
                app.UseSwagger();
                app.UseSwaggerUI();
            }

            if (!app.Environment.IsDevelopment())
            {
                app.UseHttpsRedirection();
            }

            // Ensure unhandled exceptions always return a JSON body with a message,
            // instead of an empty 500 response that the frontend can't surface.
            app.UseExceptionHandler(errorApp =>
            {
                errorApp.Run(async context =>
                {
                    var exceptionFeature = context.Features.Get<Microsoft.AspNetCore.Diagnostics.IExceptionHandlerFeature>();
                    var isDevelopment = app.Environment.IsDevelopment();

                    context.Response.StatusCode = StatusCodes.Status500InternalServerError;
                    context.Response.ContentType = "application/json";

                    await context.Response.WriteAsJsonAsync(new
                    {
                        message = "Đã xảy ra lỗi phía server. Vui lòng thử lại sau.",
                        detail = isDevelopment ? exceptionFeature?.Error?.Message : null
                    });
                });
            });

            app.UseCors(DevCorsPolicy);
            app.UseAuthentication();

            app.UseAuthorization();


            app.MapControllers();
            app.MapHub<AppHub>("/hubs/app");

            await app.RunAsync();
        }

        // Đảm bảo 4 role bắt buộc (Auth Controller tra theo tên, không tự tạo) luôn tồn tại
        // sau khi deploy lên môi trường mới — chỉ thêm role nào còn thiếu, không tạo trùng.
        private static async Task SeedRolesAsync(ApplicationDbContext context)
        {
            string[] requiredRoles = ["Student", "Admin", "Company", "Organizator"];

            var existingNames = await context.Roles
                .Where(r => requiredRoles.Contains(r.Name))
                .Select(r => r.Name)
                .ToListAsync();

            var missingRoles = requiredRoles.Except(existingNames);

            foreach (var roleName in missingRoles)
            {
                context.Roles.Add(new Role { Name = roleName });
            }

            await context.SaveChangesAsync();
        }
    }
}
