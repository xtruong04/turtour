using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TurTour.Services;

namespace TurTour.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Admin,Organizator,Company")]
    public class UploadsController : ControllerBase
    {
        private static readonly string[] AllowedContentTypes =
        {
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/gif"
        };

        private const long MaxFileSizeBytes = 10 * 1024 * 1024; // 10MB

        private readonly R2StorageService _storageService;

        public UploadsController(R2StorageService storageService)
        {
            _storageService = storageService;
        }

        [HttpPost("image")]
        public async Task<IActionResult> UploadImage(IFormFile? file)
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest(new { message = "Vui lòng chọn một file ảnh để upload." });
            }

            if (file.Length > MaxFileSizeBytes)
            {
                return BadRequest(new { message = "Kích thước ảnh không được vượt quá 10MB." });
            }

            if (!AllowedContentTypes.Contains(file.ContentType))
            {
                return BadRequest(new { message = "Chỉ hỗ trợ định dạng ảnh JPEG, PNG, WEBP hoặc GIF." });
            }

            using var stream = file.OpenReadStream();
            var url = await _storageService.UploadAsync(stream, file.FileName, file.ContentType);

            return Ok(new { url });
        }
    }
}
