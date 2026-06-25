using System.ComponentModel.DataAnnotations;

namespace TurTour.DTOs.Tour
{
    public class CreateTourImageRequest
    {
        [Required(ErrorMessage = "ImageUrl là bắt buộc.")]
        [Url(ErrorMessage = "ImageUrl không đúng định dạng URL.")]
        [MaxLength(255, ErrorMessage = "ImageUrl không được vượt quá 255 ký tự.")]
        public string ImageUrl { get; set; } = string.Empty;
        public bool Isthumbnail { get; set; }

        [Range(0, int.MaxValue, ErrorMessage = "Thứ tự hiển thị không được âm.")]
        public int DisplayOrder { get; set; }
    }
}
