import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import Alert from "@mui/material/Alert";
import Card from "@mui/material/Card";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";

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
import PageLoader from "components/PageLoader";
import NeoDropdown from "components/NeoDropdown";
import AddressPicker from "components/AddressPicker";

import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

import apiService from "../../services/apiService";
import { hideSplash } from "utils/splash";
import useTourBasePath from "../../hooks/useTourBasePath";

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
  if (!value) {
    return true;
  }

  if (value.startsWith("data:image/")) {
    return true;
  }

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

const emptySchedule = () => ({
  tittle: "",
  description: "",
  startDate: "",
  endDate: "",
  orderIndex: 0,
});

function getValidationMessage(form, schedules) {
  if (!form.code.trim() || !form.title.trim() || !extractPlainText(form.description) || !form.location.trim()) {
    return "Vui lòng điền đủ các trường bắt buộc để cập nhật tour.";
  }

  if (!form.startDate || !form.endDate) {
    return "Vui lòng chọn ngày bắt đầu và ngày kết thúc.";
  }

  if (new Date(form.endDate) < new Date(form.startDate)) {
    return "Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu.";
  }

  if (!form.bookingOpenAt || !form.bookingCloseAt) {
    return "Vui lòng chọn thời gian mở và đóng đăng ký.";
  }

  if (new Date(form.bookingCloseAt) <= new Date(form.bookingOpenAt)) {
    return "Thời gian đóng đăng ký phải lớn hơn thời gian mở đăng ký.";
  }

  if (new Date(form.bookingCloseAt) > new Date(form.startDate)) {
    return "Thời gian đóng đăng ký phải trước hoặc bằng ngày khởi hành.";
  }

  if (Number(form.capacity) <= 0) {
    return "Sức chứa phải lớn hơn 0.";
  }

  if (Number(form.price) <= 0) {
    return "Chi phí phải lớn hơn 0.";
  }

  if (!form.companyId) {
    return "Vui lòng chọn doanh nghiệp.";
  }

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
      return `Lịch trình #${i + 1}: Thời gian lịch trình phải nằm trong khoảng thời gian của tour.`;
    }
  }

  return "";
}

function formatDateTimeLocal(value) {
  if (!value) return "";
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function TourEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const base = useTourBasePath();

  const [form, setForm] = useState({
    code: "",
    title: "",
    thumbnail: "",
    description: "",
    location: "",
    startDate: "",
    endDate: "",
    bookingOpenAt: "",
    bookingCloseAt: "",
    capacity: "",
    price: "",
    requirement: "",
    companyId: "",
  });
  const [companies, setCompanies] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [removedScheduleIds, setRemovedScheduleIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLocked, setIsLocked] = useState(false);
  const [statusInfo, setStatusInfo] = useState({ approvalStatus: "", publishStatus: "" });
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const canSubmit = useMemo(() => {
    return (
      form.code.trim() &&
      form.title.trim() &&
      extractPlainText(form.description) &&
      form.location.trim() &&
      form.startDate &&
      form.endDate &&
      form.bookingOpenAt &&
      form.bookingCloseAt &&
      form.capacity &&
      form.price &&
      form.companyId &&
      !isLocked
    );
  }, [form, isLocked]);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setErrorMessage("");

      try {
        const [tour, companyList] = await Promise.all([apiService.getTourById(id), apiService.getCompanies()]);
        const safeCompanies = Array.isArray(companyList) ? companyList.filter((company) => company?.id && company?.name) : [];
        setCompanies(safeCompanies);

        setForm({
          code: tour.code || "",
          title: tour.title || "",
          thumbnail: tour.thumbnail || "",
          description: tour.description || "",
          location: tour.location || "",
          startDate: formatDateTimeLocal(tour.startDate),
          endDate: formatDateTimeLocal(tour.endDate),
          bookingOpenAt: formatDateTimeLocal(tour.bookingOpenAt),
          bookingCloseAt: formatDateTimeLocal(tour.bookingCloseAt),
          capacity: String(tour.capacity || ""),
          price: String(tour.price || ""),
          requirement: tour.requirement || "",
          companyId: tour.companyId || safeCompanies[0]?.id || "",
        });

        setIsLocked(tour.raw?.publishStatus === "Archived" || tour.raw?.publishStatus === "Completed");
        setStatusInfo({
          approvalStatus: tour.raw?.approvalStatus || "",
          publishStatus: tour.raw?.publishStatus || "",
        });

        const sortedSchedules = [...(tour.schedules || [])].sort(
          (a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0)
        );
        setSchedules(
          sortedSchedules.map((s, index) => ({
            id: s.id,
            tittle: s.tittle || "",
            description: s.description || "",
            startDate: formatDateTimeLocal(s.startDate),
            endDate: formatDateTimeLocal(s.endDate),
            orderIndex: s.orderIndex ?? index + 1,
          }))
        );
        setRemovedScheduleIds([]);
      } catch (error) {
        setErrorMessage(error?.message || "Không tải được thông tin tour.");
      } finally {
        setLoading(false);
        hideSplash();
      }
    }

    fetchData();
  }, [id]);

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
    setSchedules((prev) => {
      const target = prev[index];
      if (target?.id) {
        setRemovedScheduleIds((current) => [...current, target.id]);
      }
      return prev.filter((_, i) => i !== index).map((s, i) => ({ ...s, orderIndex: i + 1 }));
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validationMessage = getValidationMessage(form, schedules);
    if (!canSubmit || validationMessage) {
      setErrorMessage(validationMessage || "Vui lòng điền đủ các trường bắt buộc để cập nhật tour.");
      return;
    }

    setSubmitting(true);
    setErrorMessage("");

    try {
      await apiService.updateTour(id, form);
    } catch (error) {
      setErrorMessage(error?.message || "Cập nhật tour thất bại.");
      setSubmitting(false);
      return;
    }

    try {
      for (const scheduleId of removedScheduleIds) {
        await apiService.request(`/tours/${id}/schedules/${scheduleId}`, { method: "DELETE" });
      }

      for (const s of schedules) {
        if (!s.tittle.trim()) continue;

        const payload = JSON.stringify({
          tittle: s.tittle.trim(),
          description: s.description.trim(),
          startDate: s.startDate.length === 16 ? `${s.startDate}:00` : s.startDate,
          endDate: s.endDate.length === 16 ? `${s.endDate}:00` : s.endDate,
          orderIndex: s.orderIndex,
        });

        if (s.id) {
          await apiService.request(`/tours/${id}/schedules/${s.id}`, { method: "PUT", body: payload });
        } else {
          await apiService.request(`/tours/${id}/schedules`, { method: "POST", body: payload });
        }
      }

      navigate(`${base}/tours/${id}`, { replace: true });
    } catch (error) {
      setErrorMessage(error?.message || "Tour đã được cập nhật nhưng đồng bộ lịch trình thất bại.");
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
                <SoftTypography variant="h5" fontWeight="bold">Sửa Tour</SoftTypography>
                <SoftTypography variant="button" color="text">Cập nhật thông tin tour đã tạo.</SoftTypography>
              </div>
              <SoftButton component={Link} to={`${base}/tours`} variant="outlined" color="dark">Quay lại danh sách</SoftButton>
            </SoftBox>

            {loading ? (
              <PageLoader label="Đang tải dữ liệu tour..." />
            ) : (
              <SoftBox component="form" onSubmit={handleSubmit}>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}><SoftTypography variant="caption" fontWeight="bold">Mã tour *</SoftTypography><SoftInput placeholder="VD: TOUR-HCM-001" value={form.code} onChange={(event) => handleChange("code", event.target.value)} /></Grid>
                  <Grid item xs={12} md={6}><SoftTypography variant="caption" fontWeight="bold">Tiêu đề tour *</SoftTypography><SoftInput placeholder="VD: Tham quan doanh nghiệp công nghệ" value={form.title} onChange={(event) => handleChange("title", event.target.value)} /></Grid>
                  <Grid item xs={12}>
                    <TourThumbnailField
                      value={form.thumbnail}
                      onChange={(value) => handleChange("thumbnail", value)}
                      onError={setErrorMessage}
                      allowEmptyHint
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <SoftTypography variant="caption" fontWeight="bold">Mô tả *</SoftTypography>
                    <TourDescriptionEditor value={form.description} onChange={(value) => handleChange("description", value)} />
                    <SoftTypography variant="caption" color="text" display="block" mt={0.75}>
                      Mô tả sẽ hiển thị đầy đủ ở trang chi tiết tour với định dạng và hình ảnh đã chèn.
                    </SoftTypography>
                  </Grid>
                  <Grid item xs={12}>
                    <SoftTypography variant="caption" fontWeight="bold">Địa điểm *</SoftTypography>
                    <AddressPicker
                      value={form.location}
                      onChange={(v) => handleChange("location", v)}
                      showDetail
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <SoftTypography variant="caption" fontWeight="bold">Doanh nghiệp *</SoftTypography>
                    <NeoDropdown
                      value={form.companyId}
                      placeholder="-- Chọn doanh nghiệp --"
                      options={companies.map((company) => ({ value: company.id, label: company.name }))}
                      onChange={(value) => handleChange("companyId", value)}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}><SoftTypography variant="caption" fontWeight="bold">Ngày bắt đầu *</SoftTypography><SoftInput type="datetime-local" value={form.startDate} onChange={(event) => handleChange("startDate", event.target.value)} /></Grid>
                  <Grid item xs={12} md={6}><SoftTypography variant="caption" fontWeight="bold">Ngày kết thúc *</SoftTypography><SoftInput type="datetime-local" value={form.endDate} onChange={(event) => handleChange("endDate", event.target.value)} /></Grid>
                  <Grid item xs={12} md={6}><SoftTypography variant="caption" fontWeight="bold">Mở đăng ký từ *</SoftTypography><SoftInput type="datetime-local" value={form.bookingOpenAt} onChange={(event) => handleChange("bookingOpenAt", event.target.value)} /></Grid>
                  <Grid item xs={12} md={6}>
                    <SoftTypography variant="caption" fontWeight="bold">Đóng đăng ký lúc *</SoftTypography>
                    <SoftInput type="datetime-local" value={form.bookingCloseAt} onChange={(event) => handleChange("bookingCloseAt", event.target.value)} />
                    <SoftTypography variant="caption" color="text" display="block" mt={0.5}>
                      Phải trước hoặc bằng ngày khởi hành.
                    </SoftTypography>
                  </Grid>
                  <Grid item xs={12} md={4}><SoftTypography variant="caption" fontWeight="bold">Sức chứa *</SoftTypography><SoftInput type="number" min="1" value={form.capacity} onChange={(event) => handleChange("capacity", event.target.value)} /></Grid>
                  <Grid item xs={12} md={4}><SoftTypography variant="caption" fontWeight="bold">Chi phí *</SoftTypography><SoftInput type="number" min="1" value={form.price} onChange={(event) => handleChange("price", event.target.value)} /></Grid>
                  <Grid item xs={12} md={4}>
                    <SoftTypography variant="caption" fontWeight="bold">Trạng thái</SoftTypography>
                    <SoftTypography variant="button" color="text" display="block" mt={0.5}>
                      {statusInfo.approvalStatus === "Pending" || statusInfo.approvalStatus === "Rejected"
                        ? (statusInfo.approvalStatus === "Pending" ? "Đang chờ duyệt." : "Đã bị từ chối — sửa nội dung và lưu để gửi duyệt lại.")
                        : `Tự động: ${statusInfo.publishStatus || "—"} (theo ngày khởi hành). Sửa nội dung quan trọng sẽ phải duyệt lại.`}
                    </SoftTypography>
                    {isLocked ? (
                      <SoftTypography variant="caption" color="error" display="block" mt={0.5}>
                        {statusInfo.publishStatus === "Completed"
                          ? "Tour đã hoàn thành, không thể chỉnh sửa."
                          : "Tour đã bị huỷ, không thể chỉnh sửa."}
                      </SoftTypography>
                    ) : null}
                  </Grid>
                  <Grid item xs={12}>
                    <SoftTypography variant="caption" fontWeight="bold">Yêu cầu</SoftTypography>
                    <TextField
                      fullWidth
                      size="small"
                      multiline
                      minRows={2}
                      placeholder="VD: Mang thẻ sinh viên khi tham gia"
                      value={form.requirement}
                      onChange={(event) => handleChange("requirement", event.target.value)}
                    />
                  </Grid>

                  {/* ── Lịch trình tour ── */}
                  <Grid item xs={12}>
                    <Divider sx={{ my: 1 }} />
                    <SoftBox display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
                      <SoftTypography variant="h6" fontWeight="bold">Lịch trình tour</SoftTypography>
                      <SoftButton
                        variant="outlined"
                        color="info"
                        size="small"
                        onClick={addSchedule}
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
                          key={s.id || `new-${idx}`}
                          mb={2}
                          p={2}
                          sx={{ border: "1px solid #d9caa6", borderRadius: "0px", background: "#f6efdd", position: "relative" }}
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
                              <SoftInput
                                type="datetime-local"
                                value={s.startDate}
                                onChange={(e) => handleScheduleChange(idx, "startDate", e.target.value)}
                              />
                            </Grid>
                            <Grid item xs={12} md={3}>
                              <SoftTypography variant="caption" fontWeight="bold">Kết thúc *</SoftTypography>
                              <SoftInput
                                type="datetime-local"
                                value={s.endDate}
                                onChange={(e) => handleScheduleChange(idx, "endDate", e.target.value)}
                              />
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
                  <SoftButton component={Link} to={`${base}/tours/${id}`} variant="outlined" color="dark">Hủy</SoftButton>
                  <SoftButton type="submit" variant="gradient" color="info" disabled={!canSubmit || submitting}>
                    {submitting ? "Đang lưu..." : "Lưu thay đổi"}
                  </SoftButton>
                </SoftBox>
              </SoftBox>
            )}
          </SoftBox>
        </Card>
      </SoftBox>
      <Footer />
    </DashboardLayout>
  );
}

export default TourEdit;
