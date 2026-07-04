import { useEffect, useState } from "react";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Grid from "@mui/material/Grid";
import Snackbar from "@mui/material/Snackbar";
import Tooltip from "@mui/material/Tooltip";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftInput from "components/SoftInput";
import SoftButton from "components/SoftButton";
import PageLoader from "components/PageLoader";
import NeoDropdown from "components/NeoDropdown";

import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

import apiService from "../../../services/apiService";

// Danh sách rút gọn các ngân hàng phổ biến theo mã BIN chuẩn VietQR (napas) — đầy đủ tại
// https://api.vietqr.io/v2/banks. Vẫn cho nhập tay mã khác nếu ngân hàng không có trong danh sách.
const COMMON_BANKS = [
  { bin: "970436", name: "Vietcombank" },
  { bin: "970415", name: "VietinBank" },
  { bin: "970418", name: "BIDV" },
  { bin: "970405", name: "Agribank" },
  { bin: "970407", name: "Techcombank" },
  { bin: "970432", name: "VPBank" },
  { bin: "970423", name: "TPBank" },
  { bin: "970416", name: "ACB" },
  { bin: "970422", name: "MBBank" },
  { bin: "970441", name: "VIB" },
  { bin: "970403", name: "Sacombank" },
  { bin: "970430", name: "PVcomBank" },
];

function hasSavedAccount(company) {
  return Boolean(company?.bankBin && company?.bankAccountNo && company?.bankAccountName);
}

function bankNameForBin(bin) {
  return COMMON_BANKS.find((bank) => bank.bin === bin)?.name || "";
}

function vietQrUrl(bin, accountNo, accountName) {
  const name = encodeURIComponent(accountName || "");
  return `https://img.vietqr.io/image/${bin}-${accountNo}-compact2.jpg?accountName=${name}&addInfo=TurTour`;
}

// Field row dùng trong view mode
function InfoRow({ label, value, mono }) {
  return (
    <SoftBox mb={2.5}>
      <SoftTypography
        variant="caption"
        fontWeight="bold"
        color="text"
        sx={{ textTransform: "uppercase", letterSpacing: "0.04em", fontSize: "0.7rem" }}
      >
        {label}
      </SoftTypography>
      <SoftTypography
        variant="body2"
        fontWeight="medium"
        sx={{ mt: 0.25, fontFamily: mono ? "monospace" : "inherit", fontSize: "0.95rem" }}
      >
        {value || "—"}
      </SoftTypography>
    </SoftBox>
  );
}

function PaymentSettings() {
  const [company, setCompany] = useState(null);
  const [form, setForm] = useState({ bankBin: "", bankAccountNo: "", bankAccountName: "" });
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [toastOpen, setToastOpen] = useState(false);
  const [qrError, setQrError] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function fetchCompany() {
      setLoading(true);
      setErrorMessage("");
      try {
        const data = await apiService.getMyCompany();
        setCompany(data);
        setForm({
          bankBin: data.bankBin || "",
          bankAccountNo: data.bankAccountNo || "",
          bankAccountName: data.bankAccountName || "",
        });
        setIsEditing(!hasSavedAccount(data));
      } catch (error) {
        setErrorMessage(error?.message || "Không tải được thông tin doanh nghiệp.");
      } finally {
        setLoading(false);
      }
    }

    fetchCompany();
  }, []);

  const handleChange = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSave = async (event) => {
    event.preventDefault();

    if (!form.bankBin.trim() || !form.bankAccountNo.trim() || !form.bankAccountName.trim()) {
      setErrorMessage("Vui lòng điền đủ mã ngân hàng, số tài khoản và tên chủ tài khoản.");
      return;
    }

    setSaving(true);
    setErrorMessage("");
    try {
      const updated = await apiService.updateCompany(company.id, { ...company, ...form });
      setCompany(updated);
      setQrError(false);
      setIsEditing(false);
      setToastOpen(true);
    } catch (error) {
      setErrorMessage(error?.message || "Lưu tài khoản thanh toán thất bại.");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = () => {
    setErrorMessage("");
    setIsEditing(true);
  };

  const handleCopyAccount = () => {
    navigator.clipboard.writeText(form.bankAccountNo).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };

  const bankName = bankNameForBin(form.bankBin);

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <SoftBox py={3}>
        <SoftBox mb={3}>
          <SoftTypography variant="h5" fontWeight="bold">Tài khoản thanh toán</SoftTypography>
          <SoftTypography variant="button" color="text">
            Sinh viên sẽ chuyển tiền vào đúng tài khoản này khi thanh toán tour của doanh nghiệp bạn.
          </SoftTypography>
        </SoftBox>

        {loading ? <PageLoader label="Đang tải thông tin..." /> : null}

        {/* ── View mode ── */}
        {!loading && !isEditing ? (
          <Grid container spacing={3} alignItems="stretch">
            {/* Left: account info card */}
            <Grid item xs={12} md={6} sx={{ display: "flex" }}>
              <Card sx={{ width: "100%" }}>
                <SoftBox p={3}>
                  <SoftBox display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                    <SoftBox display="flex" alignItems="center" gap={1.5}>
                      <Box
                        sx={{
                          width: 40, height: 40, borderRadius: "10px",
                          background: "linear-gradient(135deg, #1a73e8, #0d47a1)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <span style={{ fontSize: "1.2rem" }}>🏦</span>
                      </Box>
                      <SoftTypography variant="h6" fontWeight="bold">Tài khoản đã lưu</SoftTypography>
                    </SoftBox>
                    <SoftButton variant="outlined" color="info" size="small" onClick={handleEdit}>
                      Sửa
                    </SoftButton>
                  </SoftBox>

                  <InfoRow
                    label="Ngân hàng"
                    value={bankName ? `${bankName} (${form.bankBin})` : `BIN: ${form.bankBin}`}
                  />

                  <SoftBox mb={2.5}>
                    <SoftTypography
                      variant="caption"
                      fontWeight="bold"
                      color="text"
                      sx={{ textTransform: "uppercase", letterSpacing: "0.04em", fontSize: "0.7rem" }}
                    >
                      Số tài khoản
                    </SoftTypography>
                    <SoftBox display="flex" alignItems="center" gap={1} mt={0.25}>
                      <SoftTypography
                        variant="body2"
                        fontWeight="medium"
                        sx={{ fontFamily: "monospace", fontSize: "1rem", letterSpacing: "0.06em" }}
                      >
                        {form.bankAccountNo}
                      </SoftTypography>
                      <Tooltip title={copied ? "Đã sao chép!" : "Sao chép"} placement="top">
                        <Box
                          component="button"
                          onClick={handleCopyAccount}
                          sx={{
                            border: "none", background: "none", cursor: "pointer", padding: "2px 6px",
                            borderRadius: "6px", color: copied ? "#2e7d32" : "#666",
                            fontSize: "0.75rem", fontWeight: 600,
                            "&:hover": { background: "#f0f0f0" },
                            transition: "all .15s",
                          }}
                        >
                          {copied ? "✓ Đã chép" : "Sao chép"}
                        </Box>
                      </Tooltip>
                    </SoftBox>
                  </SoftBox>

                  <InfoRow label="Tên chủ tài khoản" value={form.bankAccountName} />

                  <Box
                    sx={{
                      mt: 1, p: 1.5, borderRadius: "10px",
                      background: "linear-gradient(135deg, #e8f5e9, #f1f8e9)",
                      border: "1px solid #c8e6c9",
                      display: "flex", alignItems: "flex-start", gap: 1,
                    }}
                  >
                    <span style={{ fontSize: "1rem", flexShrink: 0 }}>✅</span>
                    <SoftTypography variant="caption" color="text" sx={{ lineHeight: 1.5 }}>
                      QR thanh toán sẽ tự động được tạo cho từng đăng ký tour dựa trên tài khoản này.
                    </SoftTypography>
                  </Box>
                </SoftBox>
              </Card>
            </Grid>

            {/* Right: VietQR preview */}
            <Grid item xs={12} md={6} sx={{ display: "flex" }}>
              <Card sx={{ width: "100%" }}>
                <SoftBox p={3}>
                  <SoftBox display="flex" alignItems="center" gap={1} mb={2}>
                    <span style={{ fontSize: "1.1rem" }}>📱</span>
                    <SoftTypography variant="h6" fontWeight="bold">Preview QR thanh toán</SoftTypography>
                  </SoftBox>

                  <SoftTypography variant="caption" color="text" sx={{ mb: 2, display: "block" }}>
                    Đây là mẫu QR sinh viên sẽ quét khi thanh toán tour. Số tiền & mã đơn sẽ được điền tự động.
                  </SoftTypography>

                  <Box
                    sx={{
                      display: "flex", justifyContent: "center",
                      background: "#fafafa", borderRadius: "12px",
                      border: "1px solid #eee", p: 1.5,
                      minHeight: 200,
                    }}
                  >
                    {qrError ? (
                      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 1, py: 4 }}>
                        <span style={{ fontSize: "2rem" }}>📵</span>
                        <SoftTypography variant="caption" color="text" align="center">
                          Không tải được QR. Kiểm tra lại mã BIN và số tài khoản.
                        </SoftTypography>
                      </Box>
                    ) : (
                      <Box
                        component="img"
                        src={vietQrUrl(form.bankBin, form.bankAccountNo, form.bankAccountName)}
                        alt="VietQR preview"
                        onError={() => setQrError(true)}
                        sx={{
                          maxWidth: "100%",
                          maxHeight: 320,
                          borderRadius: "8px",
                          display: "block",
                        }}
                      />
                    )}
                  </Box>

                  <SoftTypography
                    variant="caption"
                    color="text"
                    align="center"
                    sx={{ display: "block", mt: 1.5, opacity: 0.7 }}
                  >
                    Powered by{" "}
                    <Box component="span" sx={{ fontWeight: 700, color: "#1a73e8" }}>VietQR</Box>
                  </SoftTypography>
                </SoftBox>
              </Card>
            </Grid>
          </Grid>
        ) : null}

        {/* ── Edit mode ── */}
        {!loading && isEditing ? (
          <Card sx={{ maxWidth: 560 }}>
            <SoftBox p={3} component="form" onSubmit={handleSave}>
              <SoftBox display="flex" alignItems="center" gap={1.5} mb={3}>
                <Box
                  sx={{
                    width: 36, height: 36, borderRadius: "9px",
                    background: "linear-gradient(135deg, #1a73e8, #0d47a1)",
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}
                >
                  <span style={{ fontSize: "1rem" }}>✏️</span>
                </Box>
                <SoftTypography variant="h6" fontWeight="bold">
                  {hasSavedAccount(company) ? "Chỉnh sửa tài khoản" : "Thiết lập tài khoản thanh toán"}
                </SoftTypography>
              </SoftBox>

              {errorMessage ? (
                <SoftBox mb={2}><Alert severity="error">{errorMessage}</Alert></SoftBox>
              ) : null}

              <SoftBox mb={2}>
                <SoftTypography variant="caption" fontWeight="bold">Ngân hàng *</SoftTypography>
                <NeoDropdown
                  value={COMMON_BANKS.some((b) => b.bin === form.bankBin) ? form.bankBin : "custom"}
                  placeholder="-- Chọn ngân hàng --"
                  options={[
                    ...COMMON_BANKS.map((bank) => ({ value: bank.bin, label: `${bank.name} (${bank.bin})` })),
                    { value: "custom", label: "Ngân hàng khác (nhập mã BIN bên dưới)" },
                  ]}
                  onChange={(value) => handleChange("bankBin", value === "custom" ? "" : value)}
                />
              </SoftBox>

              <SoftBox mb={2}>
                <SoftTypography variant="caption" fontWeight="bold">Mã BIN ngân hàng *</SoftTypography>
                <SoftInput
                  placeholder="Ví dụ: 970436"
                  value={form.bankBin}
                  onChange={(e) => handleChange("bankBin", e.target.value.trim())}
                />
              </SoftBox>

              <SoftBox mb={2}>
                <SoftTypography variant="caption" fontWeight="bold">Số tài khoản *</SoftTypography>
                <SoftInput
                  placeholder="Số tài khoản nhận tiền"
                  value={form.bankAccountNo}
                  onChange={(e) => handleChange("bankAccountNo", e.target.value.trim())}
                />
              </SoftBox>

              <SoftBox mb={3}>
                <SoftTypography variant="caption" fontWeight="bold">Tên chủ tài khoản *</SoftTypography>
                <SoftInput
                  placeholder="VD: CONG TY TNHH ABC (không dấu, in hoa theo chuẩn ngân hàng)"
                  value={form.bankAccountName}
                  onChange={(e) => handleChange("bankAccountName", e.target.value.toUpperCase())}
                />
              </SoftBox>

              <SoftBox display="flex" gap={1}>
                <SoftButton type="submit" variant="gradient" color="info" disabled={saving}>
                  {saving ? "Đang lưu..." : "Lưu tài khoản thanh toán"}
                </SoftButton>
                {hasSavedAccount(company) ? (
                  <SoftButton
                    type="button"
                    variant="outlined"
                    color="dark"
                    disabled={saving}
                    onClick={() => {
                      setErrorMessage("");
                      setForm({
                        bankBin: company.bankBin || "",
                        bankAccountNo: company.bankAccountNo || "",
                        bankAccountName: company.bankAccountName || "",
                      });
                      setIsEditing(false);
                    }}
                  >
                    Hủy
                  </SoftButton>
                ) : null}
              </SoftBox>
            </SoftBox>
          </Card>
        ) : null}
      </SoftBox>
      <Footer />

      <Snackbar
        open={toastOpen}
        autoHideDuration={4000}
        onClose={() => setToastOpen(false)}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert severity="success" variant="filled" onClose={() => setToastOpen(false)}>
          Đã lưu tài khoản thanh toán. Mã QR thanh toán cho tour của bạn sẽ dùng tài khoản này từ giờ.
        </Alert>
      </Snackbar>
    </DashboardLayout>
  );
}

export default PaymentSettings;
