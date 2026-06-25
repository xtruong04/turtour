namespace TurTour.DTOs.Payment
{
    // Khớp định dạng webhook thật của SePay (https://docs.sepay.vn) để có thể chuyển sang
    // dùng tài khoản SePay thật sau này mà không cần đổi cấu trúc payload.
    public class SepayWebhookRequest
    {
        public long Id { get; set; }
        public string? Gateway { get; set; }
        public string? TransactionDate { get; set; }
        public string? AccountNumber { get; set; }
        public string? Code { get; set; }
        public string? Content { get; set; }
        public string? TransferType { get; set; }
        public decimal TransferAmount { get; set; }
        public decimal Accumulated { get; set; }
        public string? SubAccount { get; set; }
        public string? ReferenceCode { get; set; }
        public string? Description { get; set; }
    }
}
