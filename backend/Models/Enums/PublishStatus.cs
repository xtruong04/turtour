namespace TurTour.Models.Enums
{
    // Trục hiển thị/bán tour — Published và Expired được TÍNH TỰ ĐỘNG từ ApprovalStatus +
    // StartDate (xem ToursController.ComputeEffectivePublishStatus), không lưu cứng xuống DB
    // cho 2 giá trị này. Chỉ Hidden (mới tạo/bị từ chối) và Archived (huỷ/lưu trữ — terminal,
    // không quay lại được) là giá trị admin/company chủ động đặt.
    public enum PublishStatus
    {
        Hidden,
        Published,
        Expired,
        Archived
    }
}
