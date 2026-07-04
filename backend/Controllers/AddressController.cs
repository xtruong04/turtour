using Microsoft.AspNetCore.Mvc;

namespace TurTour.Controllers
{
    // Proxy đến API địa chỉ Việt Nam (tinhthanhpho.com) — tránh CORS khi frontend deploy
    // lên production domain khác localhost. Backend forward request, trả về response nguyên vẹn.
    [Route("api/[controller]")]
    [ApiController]
    public class AddressController : ControllerBase
    {
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly string _apiKey;

        public AddressController(IHttpClientFactory httpClientFactory, IConfiguration configuration)
        {
            _httpClientFactory = httpClientFactory;
            _apiKey = configuration["AddressApi:ApiKey"] ?? "";
        }

        [HttpGet("provinces")]
        public async Task<IActionResult> GetProvinces([FromQuery] string? keyword, [FromQuery] int limit = 100, [FromQuery] int page = 1)
        {
            var url = $"new-provinces?limit={limit}&page={page}";
            if (!string.IsNullOrWhiteSpace(keyword))
                url += $"&keyword={Uri.EscapeDataString(keyword)}";

            return await ForwardAsync(url);
        }

        [HttpGet("provinces/{provinceCode}/wards")]
        public async Task<IActionResult> GetWards(string provinceCode, [FromQuery] string? keyword, [FromQuery] int limit = 500, [FromQuery] int page = 1)
        {
            var url = $"new-provinces/{Uri.EscapeDataString(provinceCode)}/wards?limit={limit}&page={page}";
            if (!string.IsNullOrWhiteSpace(keyword))
                url += $"&keyword={Uri.EscapeDataString(keyword)}";

            return await ForwardAsync(url);
        }

        [HttpGet("search")]
        public async Task<IActionResult> Search([FromQuery] string keyword, [FromQuery] int limit = 20)
        {
            if (string.IsNullOrWhiteSpace(keyword))
                return BadRequest(new { message = "keyword là bắt buộc." });

            var url = $"search-new-address?keyword={Uri.EscapeDataString(keyword)}&limit={limit}";
            return await ForwardAsync(url);
        }

        private async Task<IActionResult> ForwardAsync(string relativeUrl)
        {
            try
            {
                var client = _httpClientFactory.CreateClient("AddressApi");
                using var request = new HttpRequestMessage(HttpMethod.Get, relativeUrl);
                if (!string.IsNullOrEmpty(_apiKey))
                    request.Headers.Add("Authorization", $"Bearer {_apiKey}");

                var response = await client.SendAsync(request);
                var content = await response.Content.ReadAsStringAsync();
                return Content(content, "application/json");
            }
            catch (TaskCanceledException)
            {
                return StatusCode(504, new { message = "API địa chỉ không phản hồi." });
            }
            catch
            {
                return StatusCode(502, new { message = "Không thể kết nối đến API địa chỉ." });
            }
        }
    }
}
