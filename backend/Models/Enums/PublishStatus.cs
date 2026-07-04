namespace TurTour.Models.Enums
{
    // Trục hiển thị/bán tour:
    //   Hidden    (0) — chưa duyệt hoặc bị ẩn thủ công.
    //   Published (1) — đăng ký đang mở; LƯU vào DB.
    //   Expired   (2) — giữ lại để tương thích, hiếm dùng.
    //   Archived  (3) — ẩn vĩnh viễn (bị huỷ HOẶC đã hoàn thành); LƯU vào DB bởi TourLifecycleService.
    //   OnGoing   (4) — booking đóng, tour đang diễn ra; LƯU vào DB bởi TourLifecycleService.
    // ComputeEffectivePublishStatus tính lại runtime dựa trên DB + thời gian thực tế.
    public enum PublishStatus
    {
        Hidden,
        Published,
        Expired,
        Archived,
        OnGoing
    }
}
