import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";

import DOMPurify from "dompurify";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftButton from "components/SoftButton";
import SoftInput from "components/SoftInput";
import PageLoader from "components/PageLoader";
import AppToast from "components/AppToast";

import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

import apiService from "../../services/apiService";
import useTourBasePath from "../../hooks/useTourBasePath";

// Badge tổng hợp từ ApprovalStatus + PublishStatus — xem giải thích ở layouts/tours/index.jsx.
const statusColorMap = {
  pending: "warning",
  rejected: "error",
  published: "success",
  expired: "warning",
  archived: "default",
  hidden: "warning",
};

const statusLabelMap = {
  pending: "Chờ duyệt",
  rejected: "Bị từ chối",
  published: "Mở đăng ký",
  expired: "Đã đóng",
  archived: "Đã hủy/Lưu trữ",
  hidden: "Ẩn",
};

function Field({ label, children }) {
  return (
    <SoftBox mb={1.5}>
      <SoftTypography variant="caption" fontWeight="bold" color="text" textTransform="uppercase" letterSpacing={0.5}>
        {label}
      </SoftTypography>
      <Box mt={0.25}>{children}</Box>
    </SoftBox>
  );
}

function TourDetails() {
  const { id } = useParams();
  const base = useTourBasePath();
  const location = useLocation();
  const [tour, setTour] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [toastMessage, setToastMessage] = useState(location.state?.toast || "");
  const [actionBusy, setActionBusy] = useState(false);
  const [actionError, setActionError] = useState("");
  const [rejecting, setRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const session = apiService.getAuthSession();
  const isAdmin = (session?.roles || []).includes("Admin");

  useEffect(() => {
    // Chỉ hiện 1 lần — xoá state khỏi history để back/forward không hiện lại toast cũ.
    window.history.replaceState({}, "");
  }, []);

  const sanitizedDescription = useMemo(() => {
    if (!tour) return "";
    return tour.description ? DOMPurify.sanitize(tour.description) : "";
  }, [tour]);

  useEffect(() => {
    async function fetchTour() {
      setLoading(true);
      setErrorMessage("");
      try {
        const data = await apiService.getTourById(id);
        setTour(data);
      } catch (error) {
        setErrorMessage(error?.message || "Không tải được chi tiết tour.");
      } finally {
        setLoading(false);
      }
    }
    fetchTour();
  }, [id]);

  const handleApprove = async () => {
    setActionBusy(true);
    setActionError("");
    try {
      const updated = await apiService.approveTour(id);
      setTour(updated);
    } catch (error) {
      setActionError(error?.message || "Duyệt tour thất bại.");
    } finally {
      setActionBusy(false);
    }
  };

  const openReject = () => {
    setRejecting(true);
    setRejectReason("");
  };

  const submitReject = async () => {
    setActionBusy(true);
    setActionError("");
    try {
      const updated = await apiService.rejectTour(id, rejectReason.trim());
      setTour(updated);
      setRejecting(false);
    } catch (error) {
      setActionError(error?.message || "Từ chối tour thất bại.");
    } finally {
      setActionBusy(false);
    }
  };

  const handleArchive = async () => {
    if (!window.confirm("Huỷ/lưu trữ tour này? Hành động này không thể hoàn tác.")) {
      return;
    }
    setActionBusy(true);
    setActionError("");
    try {
      const updated = await apiService.archiveTour(id);
      setTour(updated);
    } catch (error) {
      setActionError(error?.message || "Huỷ/lưu trữ tour thất bại.");
    } finally {
      setActionBusy(false);
    }
  };

  const approvalStatus = tour?.raw?.approvalStatus;
  const statusKey = (
    approvalStatus === "Pending" || approvalStatus === "Rejected"
      ? approvalStatus
      : tour?.raw?.publishStatus || ""
  ).toLowerCase();
  const schedules = useMemo(() => {
    const raw = tour?.raw?.tourSchedules || [];
    return [...raw]
      .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))
      .map((s) => ({ ...s, sanitizedDescription: s.description ? DOMPurify.sanitize(s.description) : "" }));
  }, [tour]);

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <SoftBox py={3}>
        <Card>
          <SoftBox p={3}>
            {/* Header */}
            <SoftBox mb={2} display="flex" justifyContent="space-between" alignItems="center" gap={1} flexWrap="wrap">
              <div>
                <SoftTypography variant="h5" fontWeight="bold">Chi tiết Tour</SoftTypography>
                <SoftTypography variant="button" color="text">Xem thông tin tour do tổ chức/doanh nghiệp tạo.</SoftTypography>
              </div>
              <SoftBox display="flex" gap={1} flexWrap="wrap">
                {isAdmin && approvalStatus === "Pending" ? (
                  <>
                    <SoftButton variant="gradient" color="success" disabled={actionBusy} onClick={handleApprove}>
                      Duyệt tour
                    </SoftButton>
                    <SoftButton variant="outlined" color="error" disabled={actionBusy} onClick={openReject}>
                      Từ chối
                    </SoftButton>
                  </>
                ) : null}
                {tour && approvalStatus === "Approved" && tour.raw?.publishStatus !== "Archived" && (isAdmin || base === "/partner") ? (
                  <SoftButton variant="outlined" color="secondary" disabled={actionBusy} onClick={handleArchive}>
                    Huỷ/Lưu trữ
                  </SoftButton>
                ) : null}
                <SoftButton component={Link} to={`${base}/tours`} variant="outlined" color="dark">Danh sách</SoftButton>
                {!isAdmin && approvalStatus === "Approved" ? (
                  <SoftButton component={Link} to={`${base}/tours/${id}/registrations`} variant="outlined" color="success">Quản lý đăng ký</SoftButton>
                ) : null}
                {!isAdmin ? (
                  <>
                    <SoftButton component={Link} to={`${base}/tours/${id}/edit`} variant="outlined" color="info">Sửa</SoftButton>
                    <SoftButton component={Link} to={`${base}/tours/${id}/delete`} variant="gradient" color="error">Xóa</SoftButton>
                  </>
                ) : null}
              </SoftBox>
            </SoftBox>

            {loading ? <PageLoader label="Đang tải chi tiết tour..." /> : null}
            {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}
            {actionError ? (
              <Alert severity="error" onClose={() => setActionError("")}>
                {actionError}
              </Alert>
            ) : null}

            {tour ? (
              <Grid container spacing={3}>

                {/* Full images - hiện đầy đủ, không cắt */}
                {tour.images && tour.images.length > 0 ? (
                  <Grid item xs={12}>
                    <SoftTypography variant="caption" fontWeight="bold" color="text" textTransform="uppercase">
                      Hình ảnh tour
                    </SoftTypography>
                    <Box
                      mt={1}
                      sx={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                        gap: 1.5,
                      }}
                    >
                      {tour.images.map((imgUrl, idx) => (
                        <Box
                          key={idx}
                          component="img"
                          src={imgUrl}
                          alt={`${tour.title} - ảnh ${idx + 1}`}
                          sx={{
                            width: "100%",
                            height: "auto",          // ← hiện đầy đủ, không cắt
                            objectFit: "contain",
                            borderRadius: "12px",
                            border: "1px solid #e9ecef",
                            background: "#f8f9fa",
                          }}
                        />
                      ))}
                    </Box>
                  </Grid>
                ) : null}

                {/* Basic info */}
                <Grid item xs={12} md={6}>
                  <Field label="Mã tour">
                    <SoftTypography variant="body2" fontWeight="medium">{tour.code || "—"}</SoftTypography>
                  </Field>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Field label="Trạng thái">
                    <Chip
                      label={statusLabelMap[statusKey] || statusKey || "—"}
                      color={statusColorMap[statusKey] || "default"}
                      size="small"
                      sx={{ fontWeight: 700, fontSize: "0.75rem" }}
                    />
                  </Field>
                </Grid>
                <Grid item xs={12}>
                  <Field label="Tiêu đề">
                    <SoftTypography variant="body2">{tour.title || "—"}</SoftTypography>
                  </Field>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Field label="Địa điểm">
                    <SoftTypography variant="body2">{tour.location || "—"}</SoftTypography>
                  </Field>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Field label="Doanh nghiệp">
                    <SoftTypography variant="body2">{tour.companyName || "—"}</SoftTypography>
                  </Field>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Field label="Ngày bắt đầu">
                    <SoftTypography variant="body2">
                      {tour.startDate ? new Date(tour.startDate).toLocaleDateString("vi-VN") : "—"}
                    </SoftTypography>
                  </Field>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Field label="Ngày kết thúc">
                    <SoftTypography variant="body2">
                      {tour.endDate ? new Date(tour.endDate).toLocaleDateString("vi-VN") : "—"}
                    </SoftTypography>
                  </Field>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Field label="Mở đăng ký từ">
                    <SoftTypography variant="body2">
                      {tour.bookingOpenAt ? new Date(tour.bookingOpenAt).toLocaleString("vi-VN") : "—"}
                    </SoftTypography>
                  </Field>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Field label="Đóng đăng ký lúc">
                    <SoftTypography variant="body2">
                      {tour.bookingCloseAt ? new Date(tour.bookingCloseAt).toLocaleString("vi-VN") : "—"}
                    </SoftTypography>
                  </Field>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Field label="Sức chứa">
                    <SoftTypography variant="body2">{tour.capacity ?? "—"}</SoftTypography>
                  </Field>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Field label="Đã đăng ký">
                    <SoftTypography variant="body2">{tour.currentParticipants ?? "—"}</SoftTypography>
                  </Field>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Field label="Chi phí">
                    <SoftTypography variant="body2" fontWeight="bold" color="error">
                      {Number(tour.price || 0).toLocaleString("vi-VN")} ₫
                    </SoftTypography>
                  </Field>
                </Grid>
                <Grid item xs={12}>
                  <Field label="Yêu cầu tham gia">
                    <SoftTypography variant="body2">{tour.requirement || "—"}</SoftTypography>
                  </Field>
                </Grid>

                {/* Description */}
                <Grid item xs={12}>
                  <Field label="Mô tả">
                    {sanitizedDescription ? (
                      <SoftBox
                        mt={0.5}
                        sx={{
                          p: 2,
                          border: "1px solid #e9ecef",
                          borderRadius: "12px",
                          backgroundColor: "#fff",
                          lineHeight: 1.8,
                          "& img": {
                            maxWidth: "100%",
                            height: "auto",
                            borderRadius: "0.75rem",
                            display: "block",
                            my: 1.5,
                          },
                          "& p, & ul, & ol, & table": { mb: 1.5 },
                        }}
                        dangerouslySetInnerHTML={{ __html: sanitizedDescription }}
                      />
                    ) : (
                      <SoftTypography variant="body2">—</SoftTypography>
                    )}
                  </Field>
                </Grid>

                {/* Schedules */}
                {schedules.length > 0 ? (
                  <Grid item xs={12}>
                    <Divider sx={{ my: 1 }} />
                    <SoftTypography variant="h6" fontWeight="bold" mb={2}>Lịch trình tour</SoftTypography>
                    <Box
                      sx={{
                        borderLeft: "2px solid #e9ecef",
                        pl: 3,
                        ml: 1,
                      }}
                    >
                      {schedules.map((s, idx) => (
                        <Box key={s.id || idx} mb={3} position="relative">
                          {/* timeline dot */}
                          <Box
                            sx={{
                              position: "absolute",
                              left: -30,
                              top: 4,
                              width: 14,
                              height: 14,
                              borderRadius: "50%",
                              background: "#cb0c9f",
                              border: "3px solid #fff",
                              boxShadow: "0 0 0 3px rgba(203,12,159,0.2)",
                            }}
                          />
                          <SoftTypography variant="caption" fontWeight="bold" color="text">
                            {s.startDate
                              ? new Date(s.startDate).toLocaleDateString("vi-VN")
                              : `Ngày ${idx + 1}`}{" "}
                            {s.endDate && s.endDate !== s.startDate
                              ? `— ${new Date(s.endDate).toLocaleDateString("vi-VN")}`
                              : ""}
                          </SoftTypography>
                          <SoftTypography variant="body2" fontWeight="bold" mt={0.25}>
                            Ngày {idx + 1}: {s.tittle || s.title || "Hoạt động"}
                          </SoftTypography>
                          {s.sanitizedDescription ? (
                            <SoftBox
                              mt={0.5}
                              sx={{
                                lineHeight: 1.6,
                                "& img": {
                                  maxWidth: "100%",
                                  height: "auto",
                                  borderRadius: "0.75rem",
                                  display: "block",
                                  my: 1,
                                },
                                "& p, & ul, & ol, & table": { mb: 1 },
                              }}
                              dangerouslySetInnerHTML={{ __html: s.sanitizedDescription }}
                            />
                          ) : null}
                        </Box>
                      ))}
                    </Box>
                  </Grid>
                ) : null}

              </Grid>
            ) : null}
          </SoftBox>
        </Card>
      </SoftBox>
      <Footer />

      <AppToast
        open={Boolean(toastMessage)}
        severity="success"
        message={toastMessage}
        onClose={() => setToastMessage("")}
      />

      <Dialog open={rejecting} onClose={() => setRejecting(false)} fullWidth maxWidth="sm">
        <DialogTitle>Lý do từ chối tour</DialogTitle>
        <DialogContent>
          <SoftInput
            placeholder="Nhập lý do từ chối (không bắt buộc)"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            multiline
            rows={3}
          />
        </DialogContent>
        <DialogActions>
          <SoftButton variant="outlined" color="dark" onClick={() => setRejecting(false)}>Hủy</SoftButton>
          <SoftButton variant="gradient" color="error" onClick={submitReject} disabled={actionBusy}>
            Từ chối tour
          </SoftButton>
        </DialogActions>
      </Dialog>
    </DashboardLayout>
  );
}

export default TourDetails;
