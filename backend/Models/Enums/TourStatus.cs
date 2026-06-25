namespace TurTour.Models.Enums
{
    public enum TourStatus
    {
        Upcoming,
        Open,
        Closed,
        Cancelled,
        Completed,
        // Thêm ở cuối — Status được EF Core lưu dạng int trong DB, chèn vào giữa sẽ làm
        // lệch giá trị số của các trạng thái đã tồn tại, sai lệch dữ liệu cũ.
        PendingApproval
    }
}
