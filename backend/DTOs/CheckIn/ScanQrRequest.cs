using System.ComponentModel.DataAnnotations;

namespace TurTour.DTOs.CheckIn
{
    public class ScanQrRequest
    {
        [Required(ErrorMessage = "QrCode là bắt buộc.")]
        [MinLength(8, ErrorMessage = "QrCode không hợp lệ.")]
        [MaxLength(100, ErrorMessage = "QrCode không được vượt quá 100 ký tự.")]
        public string QrCode { get; set; } = string.Empty;
    }
}
