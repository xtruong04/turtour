import { useEffect, useState } from "react";

import Alert from "@mui/material/Alert";
import Card from "@mui/material/Card";
import Snackbar from "@mui/material/Snackbar";

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

function PaymentSettings() {
  const [company, setCompany] = useState(null);
  const [form, setForm] = useState({ bankBin: "", bankAccountNo: "", bankAccountName: "" });
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [toastOpen, setToastOpen] = useState(false);

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

        {!loading && !isEditing ? (
          <Card sx={{ maxWidth: 560, mx: "auto" }}>
            <SoftBox p={3}>
              <SoftBox display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <SoftTypography variant="h6" fontWeight="bold">Tài khoản đã lưu</SoftTypography>
                <SoftButton variant="outlined" color="info" size="small" onClick={handleEdit}>
                  Sửa
                </SoftButton>
              </SoftBox>

              <SoftBox mb={2}>
                <SoftTypography variant="caption" fontWeight="bold" color="text">Ngân hàng</SoftTypography>
                <SoftTypography variant="body2">
                  {bankNameForBin(form.bankBin) || "Khác"} ({form.bankBin})
                </SoftTypography>
              </SoftBox>
              <SoftBox mb={2}>
                <SoftTypography variant="caption" fontWeight="bold" color="text">Số tài khoản</SoftTypography>
                <SoftTypography variant="body2">{form.bankAccountNo}</SoftTypography>
              </SoftBox>
              <SoftBox>
                <SoftTypography variant="caption" fontWeight="bold" color="text">Tên chủ tài khoản</SoftTypography>
                <SoftTypography variant="body2">{form.bankAccountName}</SoftTypography>
              </SoftBox>
            </SoftBox>
          </Card>
        ) : null}

        {!loading && isEditing ? (
          <Card sx={{ maxWidth: 560, mx: "auto" }}>
            <SoftBox p={3} component="form" onSubmit={handleSave}>
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
