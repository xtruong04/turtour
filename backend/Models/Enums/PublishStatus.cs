namespace TurTour.Models.Enums
{
    // Trục hiển thị/bán tour:
    //   Hidden    (0) — chưa duyệt hoặc bị ẩn thủ công.
    //   Published (1) — đăng ký đang mở; LƯU vào DB.
    //   Expired   (2) — giữ lại để tương thích, hiếm dùng.
    //   Archived  (3) — bị huỷ thủ công (Company/Organizator/Admin huỷ tour); LƯU vào DB.
    //   OnGoing   (4) — booking đóng, tour đang diễn ra; LƯU vào DB bởi TourLifecycleService.
    //   Completed (5) — đã hoàn thành tự nhiên (EndDate đã qua, không bị huỷ); LƯU vào DB bởi
    //                   TourLifecycleService. Tách riêng khỏi Archived để không gộp "hoàn thành"
    //                   với "bị huỷ" — 2 trạng thái chấm hết khác ý nghĩa.
    // ComputeEffectivePublishStatus tính lại runtime dựa trên DB + thời gian thực tế.
    public enum PublishStatus
    {
        Hidden,
        Published,
        Expired,
        Archived,
        OnGoing,
        Completed
    }
}
