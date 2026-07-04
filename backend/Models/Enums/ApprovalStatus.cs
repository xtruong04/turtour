namespace TurTour.Models.Enums
{
    // Trục kiểm duyệt nội dung — tách biệt với PublishStatus (vòng đời hiển thị/bán tour).
    // Draft chưa được dùng ở luồng hiện tại (tạo tour là nộp duyệt luôn), giữ lại cho tương lai
    // nếu cần thêm bước "lưu tạm" trước khi submit.
    public enum ApprovalStatus
    {
        Draft,
        Pending,
        Approved,
        Rejected
    }
}
