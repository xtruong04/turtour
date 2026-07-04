import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import Alert from "@mui/material/Alert";
import Card from "@mui/material/Card";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";

// Inline SVG icons — no @mui/icons-material needed
function IconAdd() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"/>
      <line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  );
}

function IconTrash() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
      <path d="M10 11v6M14 11v6"/>
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
    </svg>
  );
}

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftInput from "components/SoftInput";
import SoftButton from "components/SoftButton";
import TourDescriptionEditor from "components/TourDescriptionEditor";
import TourThumbnailField from "components/TourThumbnailField";

import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

import apiService from "../../services/apiService";

const initialForm = {
  code: "",
  title: "",
  thumbnail: "",
  description: "",
  location: "",
  startDate: "",
  endDate: "",
  capacity: "30",
  price: "100000",
  status: "Upcoming",
  requirement: "",
  companyId: "",
  companyName: "",
};

const emptySchedule = () => ({
  tittle: "",
  description: "",
  startDate: "",
  endDate: "",
  orderIndex: 0,
});

const statusOptions = ["Upcoming", "Open", "Closed", "Cancelled", "Completed"];

function extractPlainText(html) {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isSupportedImageSource(value) {
  if (!value) return true;
  if (value.startsWith("data:image/")) return true;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

// Convert a datetime-local string ("YYYY-MM-DDTHH:mm") to a literal local datetime string.
// Không dùng toISOString() vì nó quy đổi sang UTC, có thể lùi/tới ngày tùy múi giờ máy
// và làm sai lệch so với ngày giờ người dùng đã chọn (gây lỗi validate lịch trình sai ngày).
function dateTimeToISO(value) {
  if (!value) return "";
  return value.length === 16 ? `${value}:00` : value;
}

function getValidationMessage(form, schedules, skipCompanyName) {
  if (!form.code.trim() || !form.title.trim() || !extractPlainText(form.description) || !form.location.trim()) {
    return "Vui lòng điền đủ các trường bắt buộc để tạo tour.";
  }
  if (!form.startDate || !form.endDate) {
    return "Vui lòng chọn ngày bắt đầu và ngày kết thúc.";
  }
  if (new Date(form.endDate) < new Date(form.startDate)) {
    return "Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu.";
  }
  if (Number(form.capacity) <= 0) return "Sức chứa phải lớn hơn 0.";
  if (Number(form.price) <= 0) return "Chi phí phải lớn hơn 0.";
  if (!skipCompanyName && !form.companyName.trim()) return "Vui lòng nhập tên doanh nghiệp.";
  if (form.thumbnail.trim() && !isSupportedImageSource(form.thumbnail.trim())) {
    return "Thumbnail phải là đường dẫn ảnh http/https hợp lệ hoặc data URL của ảnh.";
  }

  const tourStart = new Date(`${form.startDate.slice(0, 10)}T00:00:00`);
  const tourEnd = new Date(`${form.endDate.slice(0, 10)}T23:59:59`);

  for (let i = 0; i < schedules.length; i++) {
    const s = schedules[i];
    if (!s.tittle.trim()) return `Lịch trình #${i + 1}: Vui lòng nhập tiêu đề.`;
    if (!s.startDate || !s.endDate) return `Lịch trình #${i + 1}: Vui lòng chọn ngày và giờ.`;

    const scheduleStart = new Date(s.startDate);
    const scheduleEnd = new Date(s.endDate);

    if (scheduleEnd < scheduleStart) {
      return `Lịch trình #${i + 1}: Thời gian kết thúc phải lớn hơn hoặc bằng thời gian bắt đầu.`;
    }
    if (scheduleStart < tourStart || scheduleEnd > tourEnd) {
      return `Lịch trình #${i + 1}: Thời gian lịch trình phải nằm trong khoảng thời gian của tour (${form.startDate} → ${form.endDate}).`;
    }
  }

  return "";
}

function TourCreate() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [schedules, setSchedules] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const session = apiService.getAuthSession();
  const roles = session?.roles || [];
  const isAdmin = roles.includes("Admin");
  const isCompanyUser = roles.includes("Company");

  const canSubmit = useMemo(() => {
    return (
      form.code.trim() &&
      form.title.trim() &&
      extractPlainText(form.description) &&
      form.location.trim() &&
      form.startDate &&
      form.endDate &&
      form.capacity &&
      form.price &&
      (isCompanyUser || form.companyName.trim())
    );
  }, [form, isCompanyUser]);

  const handleChange = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleScheduleChange = (index, field, value) => {
    setSchedules((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const addSchedule = () => {
    setSchedules((prev) => [...prev, { ...emptySchedule(), orderIndex: prev.length + 1 }]);
  };

  const removeSchedule = (index) => {
    setSchedules((prev) => prev.filter((_, i) => i !== index).map((s, i) => ({ ...s, orderIndex: i + 1 })));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validationMessage = getValidationMessage(form, schedules, isCompanyUser);
    if (!canSubmit || validationMessage) {
      setErrorMessage(validationMessage || "Vui lòng điền đủ các trường bắt buộc để tạo tour.");
      return;
    }

    setSubmitting(true);
    setErrorMessage("");

    try {
      const formToSend = {
        ...form,
        startDate: dateTimeToISO(form.startDate),
        endDate: dateTimeToISO(form.endDate),
      };

      // Gửi tour + lịch trình trong 1 request — backend tạo trong 1 transaction,
      // lỗi ở lịch trình nào thì rollback toàn bộ, không tạo tour mồ côi thiếu lịch trình.
      const schedulesToSend = schedules
        .filter((s) => s.tittle.trim())
        .map((s) => ({
          tittle: s.tittle.trim(),
          description: s.description.trim(),
          startDate: dateTimeToISO(s.startDate),
          endDate: dateTimeToISO(s.endDate),
          orderIndex: s.orderIndex,
        }));

      const created = await apiService.createTour(formToSend, schedulesToSend);

      navigate(`/admin/tours/${created.id}`, { replace: true });
    } catch (error) {
      setErrorMessage(error?.message || "Tạo tour thất bại.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <SoftBox py={3}>
        <Card>
          <SoftBox p={3}>
            <SoftBox mb={2} display="flex" justifyContent="space-between" alignItems="center">
              <div>
                <SoftTypography variant="h5" fontWeight="bold">Tạo Tour</SoftTypography>
                <SoftTypography variant="button" color="text">Tạo tour mới cho doanh nghiệp hoặc tổ chức.</SoftTypography>
              </div>
              <SoftButton component={Link} to="/admin/tours" variant="outlined" color="dark">
                Quay lại danh sách
              </SoftButton>
            </SoftBox>

            <SoftBox component="form" onSubmit={handleSubmit}>
              <Grid container spacing={2}>
                {/* Thông tin cơ bản */}
                <Grid item xs={12} md={6}>
                  <SoftTypography variant="caption" fontWeight="bold">Mã tour *</SoftTypography>
                  <SoftInput placeholder="VD: TOUR-HCM-001" value={form.code} onChange={(e) => handleChange("code", e.target.value)} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <SoftTypography variant="caption" fontWeight="bold">Tiêu đề tour *</SoftTypography>
                  <SoftInput placeholder="VD: Tham quan doanh nghiệp công nghệ" value={form.title} onChange={(e) => handleChange("title", e.target.value)} />
                </Grid>
                <Grid item xs={12}>
                  <TourThumbnailField value={form.thumbnail} onChange={(v) => handleChange("thumbnail", v)} onError={setErrorMessage} />
                </Grid>
                <Grid item xs={12}>
                  <SoftTypography variant="caption" fontWeight="bold">Mô tả *</SoftTypography>
                  <TourDescriptionEditor value={form.description} onChange={(v) => handleChange("description", v)} />
                  <SoftTypography variant="caption" color="text" display="block" mt={0.75}>
                    Có thể định dạng nội dung, chèn bảng, chèn link và chèn ảnh trực tiếp vào mô tả tour.
                  </SoftTypography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <SoftTypography variant="caption" fontWeight="bold">Địa điểm *</SoftTypography>
                  <SoftInput placeholder="VD: Quận 1, TP.HCM" value={form.location} onChange={(e) => handleChange("location", e.target.value)} />
                </Grid>
                {!isCompanyUser ? (
                  <Grid item xs={12} md={6}>
                    <SoftTypography variant="caption" fontWeight="bold">Tên doanh nghiệp *</SoftTypography>
                    <SoftInput placeholder="VD: Công ty Du lịch ABC" value={form.companyName} onChange={(e) => handleChange("companyName", e.target.value)} />
                  </Grid>
                ) : null}
                <Grid item xs={12} md={6}>
                  <SoftTypography variant="caption" fontWeight="bold">Ngày bắt đầu *</SoftTypography>
                  <SoftInput type="datetime-local" value={form.startDate} onChange={(e) => handleChange("startDate", e.target.value)} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <SoftTypography variant="caption" fontWeight="bold">Ngày kết thúc *</SoftTypography>
                  <SoftInput type="datetime-local" value={form.endDate} onChange={(e) => handleChange("endDate", e.target.value)} />
                </Grid>
                <Grid item xs={12} md={4}>
                  <SoftTypography variant="caption" fontWeight="bold">Sức chứa *</SoftTypography>
                  <SoftInput type="number" min="1" value={form.capacity} onChange={(e) => handleChange("capacity", e.target.value)} />
                </Grid>
                <Grid item xs={12} md={4}>
                  <SoftTypography variant="caption" fontWeight="bold">Chi phí *</SoftTypography>
                  <SoftInput type="number" min="1" value={form.price} onChange={(e) => handleChange("price", e.target.value)} />
                </Grid>
                {isAdmin ? (
                  <Grid item xs={12} md={4}>
                    <SoftTypography variant="caption" fontWeight="bold">Trạng thái</SoftTypography>
                    <TextField select fullWidth size="small" value={form.status} onChange={(e) => handleChange("status", e.target.value)}>
                      {statusOptions.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                    </TextField>
                  </Grid>
                ) : (
                  <Grid item xs={12} md={4}>
                    <SoftTypography variant="caption" fontWeight="bold">Trạng thái</SoftTypography>
                    <SoftTypography variant="button" color="text" display="block" mt={0.5}>
                      Tour sẽ ở trạng thái <strong>Chờ duyệt</strong> sau khi tạo, Admin sẽ xét duyệt trước khi hiển thị công khai.
                    </SoftTypography>
                  </Grid>
                )}
                <Grid item xs={12}>
                  <SoftTypography variant="caption" fontWeight="bold">Yêu cầu</SoftTypography>
                  <TextField fullWidth size="small" multiline minRows={2} placeholder="VD: Mang thẻ sinh viên khi tham gia" value={form.requirement} onChange={(e) => handleChange("requirement", e.target.value)} />
                </Grid>

                {/* ── Lịch trình tour ── */}
                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                  <SoftBox display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
                    <SoftTypography variant="h6" fontWeight="bold">Lịch trình tour</SoftTypography>
                    <SoftButton variant="outlined" color="info" size="small" onClick={addSchedule}
                    sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                  >
                    <IconAdd /> Thêm ngày
                  </SoftButton>
                  </SoftBox>

                  {schedules.length === 0 ? (
                    <SoftTypography variant="caption" color="text">
                      Chưa có lịch trình nào. Nhấn &ldquo;Thêm ngày&rdquo; để thêm các hoạt động theo ngày.
                    </SoftTypography>
                  ) : (
                    schedules.map((s, idx) => (
                      <SoftBox
                        key={idx}
                        mb={2}
                        p={2}
                        sx={{ border: "1px solid #e9ecef", borderRadius: "12px", background: "#fafbfc", position: "relative" }}
                      >
                        <SoftBox display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
                          <SoftTypography variant="button" fontWeight="bold" color="dark">
                            Ngày {idx + 1}
                          </SoftTypography>
                          <Tooltip title="Xóa lịch trình này">
                            <SoftBox
                              component="button"
                              type="button"
                              onClick={() => removeSchedule(idx)}
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                width: 32,
                                height: 32,
                                border: "none",
                                borderRadius: "50%",
                                background: "transparent",
                                color: "#ea0606",
                                cursor: "pointer",
                                "&:hover": { background: "rgba(234, 6, 6, 0.08)" },
                              }}
                            >
                              <IconTrash />
                            </SoftBox>
                          </Tooltip>
                        </SoftBox>
                        <Grid container spacing={2}>
                          <Grid item xs={12} md={6}>
                            <SoftTypography variant="caption" fontWeight="bold">Tiêu đề *</SoftTypography>
                            <SoftInput
                              placeholder="VD: Tham quan nhà máy A"
                              value={s.tittle}
                              onChange={(e) => handleScheduleChange(idx, "tittle", e.target.value)}
                            />
                          </Grid>
                          <Grid item xs={12} md={3}>
                            <SoftTypography variant="caption" fontWeight="bold">Bắt đầu *</SoftTypography>
                            <SoftInput type="datetime-local" value={s.startDate} onChange={(e) => handleScheduleChange(idx, "startDate", e.target.value)} />
                          </Grid>
                          <Grid item xs={12} md={3}>
                            <SoftTypography variant="caption" fontWeight="bold">Kết thúc *</SoftTypography>
                            <SoftInput type="datetime-local" value={s.endDate} onChange={(e) => handleScheduleChange(idx, "endDate", e.target.value)} />
                          </Grid>
                          <Grid item xs={12}>
                            <SoftTypography variant="caption" fontWeight="bold">Mô tả hoạt động</SoftTypography>
                            <TourDescriptionEditor
                              value={s.description}
                              onChange={(value) => handleScheduleChange(idx, "description", value)}
                              height={220}
                            />
                          </Grid>
                        </Grid>
                      </SoftBox>
                    ))
                  )}
                </Grid>
              </Grid>

              {errorMessage ? <SoftBox mt={2}><Alert severity="error">{errorMessage}</Alert></SoftBox> : null}

              <SoftBox mt={3} display="flex" justifyContent="flex-end" gap={1}>
                <SoftButton component={Link} to="/admin/tours" variant="outlined" color="dark">Hủy</SoftButton>
                <SoftButton type="submit" variant="gradient" color="info" disabled={!canSubmit || submitting}>
                  {submitting ? "Đang tạo..." : "Tạo Tour"}
                </SoftButton>
              </SoftBox>
            </SoftBox>
          </SoftBox>
        </Card>
      </SoftBox>
      <Footer />
    </DashboardLayout>
  );
}

export default TourCreate;
