import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";

import Alert from "@mui/material/Alert";
import Card from "@mui/material/Card";
import Tooltip from "@mui/material/Tooltip";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Grid from "@mui/material/Grid";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftButton from "components/SoftButton";
import SoftInput from "components/SoftInput";
import PageLoader from "components/PageLoader";
import QrCameraScanner from "components/QrCameraScanner";
import NeoBadge from "components/NeoBadge";

import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

import apiService from "../../services/apiService";
import { hideSplash } from "utils/splash";
import realtimeService from "../../services/realtime";
import useTourBasePath from "../../hooks/useTourBasePath";

// Bảng màu theo chuẩn Bootstrap, đồng bộ với badge trạng thái ở các trang admin khác.
const statusBadgeColors = {
  Pending: { bgColor: "#ffc107", textColor: "#212529" },
  Approved: { bgColor: "#0d6efd", textColor: "#fff" },
  Rejected: { bgColor: "#dc3545", textColor: "#fff" },
  Waitinglisted: { bgColor: "#6c757d", textColor: "#fff" },
  Paid: { bgColor: "#198754", textColor: "#fff" },
  CheckedIn: { bgColor: "#198754", textColor: "#fff" },
  Completed: { bgColor: "#2b2a27", textColor: "#fff" },
};

const statusLabel = {
  Pending: "Chờ duyệt",
  Approved: "Đã duyệt",
  Rejected: "Đã từ chối",
  Waitinglisted: "Danh sách chờ",
  Paid: "Đã thanh toán",
  CheckedIn: "Đã check-in",
  Completed: "Hoàn thành",
};

function TourRegistrations() {
  const { id } = useParams();
  const base = useTourBasePath();

  const [tour, setTour] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [feedbackData, setFeedbackData] = useState({ averageRating: 0, total: 0, feedbacks: [] });
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [refreshToken, setRefreshToken] = useState(0);

  const [rejecting, setRejecting] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  const [confirming, setConfirming] = useState(null);
  const [paymentForm, setPaymentForm] = useState({ paymentMethod: "", transactionCode: "", proofImageUrl: "" });
  const [proofUploading, setProofUploading] = useState(false);
  const proofFileInputRef = useRef(null);

  const [qrResult, setQrResult] = useState(null);
  const [scanCode, setScanCode] = useState("");
  const [scanning, setScanning] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);

  const [busyId, setBusyId] = useState(null);

  const refresh = () => setRefreshToken((value) => value + 1);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setErrorMessage("");
      try {
        const [tourData, registrationList, feedbackResult] = await Promise.all([
          apiService.getTourById(id),
          apiService.getRegistrationsByTour(id),
          apiService.getFeedbacksByTour(id),
        ]);
        setTour(tourData);
        setRegistrations(Array.isArray(registrationList) ? registrationList : []);
        setFeedbackData(feedbackResult);
      } catch (error) {
        setErrorMessage(error?.message || "Không tải được dữ liệu đăng ký.");
      } finally {
        setLoading(false);
        hideSplash();
      }
    }

    fetchData();
  }, [id, refreshToken]);

  // Tự refresh khi có đăng ký/thanh toán mới cho tour này (đăng ký từ trang public,
  // webhook SePay tự xác nhận thanh toán...) — không cần F5 thủ công.
  useEffect(() => {
    const unsubscribe = realtimeService.onAdminBoardUpdated((payload) => {
      if (payload?.tourId === id) {
        refresh();
      }
    });
    return unsubscribe;
  }, [id]);

  const handleApprove = async (registrationId) => {
    setBusyId(registrationId);
    setActionMessage("");
    try {
      await apiService.approveRegistration(registrationId);
      refresh();
    } catch (error) {
      setActionMessage(error?.message || "Duyệt đăng ký thất bại.");
    } finally {
      setBusyId(null);
    }
  };

  const openReject = (registrationId) => {
    setRejecting(registrationId);
    setRejectReason("");
  };

  const submitReject = async () => {
    if (!rejectReason.trim()) {
      setActionMessage("Vui lòng nhập lý do từ chối.");
      return;
    }

    setBusyId(rejecting);
    try {
      await apiService.rejectRegistration(rejecting, rejectReason.trim());
      setRejecting(null);
      refresh();
    } catch (error) {
      setActionMessage(error?.message || "Từ chối đăng ký thất bại.");
    } finally {
      setBusyId(null);
    }
  };

  const openConfirmPayment = (registrationId) => {
    setConfirming(registrationId);
    setPaymentForm({ paymentMethod: "", transactionCode: "", proofImageUrl: "" });
  };

  const handleProofFileChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setActionMessage("Vui lòng chọn đúng file ảnh.");
      return;
    }

    setProofUploading(true);
    try {
      const url = await apiService.uploadImage(file);
      setPaymentForm((current) => ({ ...current, proofImageUrl: url }));
    } catch (error) {
      setActionMessage(error?.message || "Upload ảnh thất bại.");
    } finally {
      setProofUploading(false);
    }
  };

  const submitConfirmPayment = async () => {
    if (!paymentForm.paymentMethod.trim()) {
      setActionMessage("Vui lòng nhập phương thức thanh toán.");
      return;
    }

    setBusyId(confirming);
    try {
      await apiService.confirmPayment({
        registrationId: confirming,
        paymentMethod: paymentForm.paymentMethod.trim(),
        transactionCode: paymentForm.transactionCode.trim(),
        proofImageUrl: paymentForm.proofImageUrl.trim(),
      });
      setConfirming(null);
      refresh();
    } catch (error) {
      setActionMessage(error?.message || "Xác nhận thanh toán thất bại.");
    } finally {
      setBusyId(null);
    }
  };

  const handleGenerateQr = async (registrationId) => {
    setBusyId(registrationId);
    setActionMessage("");
    try {
      const result = await apiService.generateCheckInQr(registrationId);
      setQrResult(result);
    } catch (error) {
      setActionMessage(error?.message || "Tạo mã check-in thất bại.");
    } finally {
      setBusyId(null);
    }
  };

  const handleScan = async (codeOverride) => {
    const code = (codeOverride ?? scanCode).trim();
    if (!code) {
      return;
    }

    setScanning(true);
    setActionMessage("");
    try {
      await apiService.scanCheckIn(code);
      setScanCode("");
      refresh();
    } catch (error) {
      setActionMessage(error?.message || "Check-in thất bại.");
    } finally {
      setScanning(false);
    }
  };

  const handleCameraScan = (decodedText) => {
    setCameraOpen(false);
    handleScan(decodedText);
  };

  const handleCameraError = (message) => {
    setCameraOpen(false);
    setActionMessage(message);
  };

  const handleExportCsv = () => {
    const headers = ["STT", "Họ tên", "Email", "Số điện thoại", "Ngày đăng ký", "Trạng thái", "Thanh toán", "Ngày thanh toán", "Ghi chú"];

    const rows = registrations.map((reg, idx) => {
      const isPaid = reg.payment?.paymentStatus === "Paid" || ["Paid", "CheckedIn", "Completed"].includes(reg.status);
      const phone = reg.raw?.student?.phoneNumber || "";
      const regDate = reg.registrationDate ? new Date(reg.registrationDate).toLocaleDateString("vi-VN") : "";
      const paidDate = reg.payment?.paidAt ? new Date(reg.payment.paidAt).toLocaleDateString("vi-VN") : "";
      const note = reg.rejectionReason ? `Từ chối: ${reg.rejectionReason}` : (reg.notes || "");
      return [
        idx + 1,
        reg.studentName,
        reg.studentEmail,
        phone,
        regDate,
        statusLabel[reg.status] || reg.status,
        isPaid ? "Đã thanh toán" : "Chưa thanh toán",
        paidDate,
        note,
      ].map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",");
    });

    const csvContent = "﻿" + [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const safeName = (tour?.title || "tour").replace(/[^a-z0-9]/gi, "-").toLowerCase();
    a.href = url;
    a.download = `dang-ky-${safeName}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <SoftBox py={3}>
        <Card>
          <SoftBox p={3}>
            <SoftBox mb={2} display="flex" justifyContent="space-between" alignItems="center" gap={1} flexWrap="wrap">
              <div>
                <SoftTypography variant="h5" fontWeight="bold">Quản lý đăng ký</SoftTypography>
                <SoftTypography variant="button" color="text">{tour?.title || "Đang tải..."}</SoftTypography>
              </div>
              <SoftBox display="flex" gap={1}>
                <SoftButton
                  variant="outlined"
                  color="success"
                  disabled={registrations.length === 0}
                  onClick={handleExportCsv}
                >
                  Xuất CSV
                </SoftButton>
                <SoftButton component={Link} to={`${base}/tours/${id}`} variant="outlined" color="dark">
                  Quay lại tour
                </SoftButton>
              </SoftBox>
            </SoftBox>

            {loading ? <PageLoader label="Đang tải dữ liệu đăng ký..." /> : null}
            {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}
            {actionMessage ? <Alert severity="warning" onClose={() => setActionMessage("")}>{actionMessage}</Alert> : null}

            {!loading && !errorMessage ? (
              <>
                <SoftBox mb={3} p={2} sx={{ border: "1px solid #d9caa6", borderRadius: "12px" }}>
                  <SoftTypography variant="button" fontWeight="bold">Quét mã check-in</SoftTypography>
                  <SoftBox display="flex" gap={1} mt={1} flexWrap="wrap">
                    <SoftBox flexGrow={1} minWidth="220px">
                      <SoftInput
                        placeholder="Nhập mã QR check-in của sinh viên"
                        value={scanCode}
                        onChange={(e) => setScanCode(e.target.value)}
                      />
                    </SoftBox>
                    <SoftButton variant="gradient" color="success" onClick={() => handleScan()} disabled={scanning}>
                      {scanning ? "Đang xử lý..." : "Check-in"}
                    </SoftButton>
                    <SoftButton variant="outlined" color="dark" onClick={() => setCameraOpen(true)} disabled={scanning}>
                      Quét bằng camera
                    </SoftButton>
                  </SoftBox>
                </SoftBox>

                <TableContainer sx={{ overflowX: "auto" }}>
                  <Table
                    size="small"
                    sx={{
                      tableLayout: "fixed",
                      minWidth: 1000,
                      "& th": {
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        color: "#2b2a27",
                        whiteSpace: "nowrap",
                        py: 1.5,
                      },
                      "& td": {
                        fontSize: "0.875rem",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        py: 1.25,
                      },
                    }}
                  >
                    <colgroup>
                      <col style={{ width: "13%" }} />
                      <col style={{ width: "16%" }} />
                      <col style={{ width: "10%" }} />
                      <col style={{ width: "10%" }} />
                      <col style={{ width: "12%" }} />
                      <col style={{ width: "13%" }} />
                      <col style={{ width: "26%" }} />
                    </colgroup>
                    <TableHead sx={{ display: "table-header-group" }}>
                      <TableRow>
                        <TableCell>Sinh viên</TableCell>
                        <TableCell>Email</TableCell>
                        <TableCell>Ngày đăng ký</TableCell>
                        <TableCell align="center">Trạng thái</TableCell>
                        <TableCell align="center">Thanh toán</TableCell>
                        <TableCell>Ghi chú</TableCell>
                        <TableCell align="center">Thao tác</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {registrations.map((reg) => {
                        const isPaid = reg.payment?.paymentStatus === "Paid"
                          || ["Paid", "CheckedIn", "Completed"].includes(reg.status);

                        return (
                        <TableRow key={reg.id} hover>
                          <TableCell title={reg.studentName}>{reg.studentName}</TableCell>
                          <TableCell title={reg.studentEmail}>{reg.studentEmail || "-"}</TableCell>
                          <TableCell>{reg.registrationDate ? new Date(reg.registrationDate).toLocaleDateString("vi-VN") : "-"}</TableCell>
                          <TableCell align="center">
                            <NeoBadge
                              label={statusLabel[reg.status] || reg.status}
                              {...(statusBadgeColors[reg.status] || { bgColor: "#2b2a27", textColor: "#fff" })}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Tooltip
                              title={isPaid && reg.payment?.paidAt ? `Thanh toán ngày ${new Date(reg.payment.paidAt).toLocaleDateString("vi-VN")}` : ""}
                              disableHoverListener={!isPaid || !reg.payment?.paidAt}
                              arrow
                            >
                              <SoftBox display="inline-flex">
                                <NeoBadge
                                  label={isPaid ? "Đã thanh toán" : "Chưa thanh toán"}
                                  bgColor={isPaid ? "#198754" : "#6c757d"}
                                />
                              </SoftBox>
                            </Tooltip>
                          </TableCell>
                          <TableCell title={reg.notes}>{reg.notes || "-"}</TableCell>
                          <TableCell align="center" sx={{ overflow: "visible" }}>
                            <SoftBox display="flex" justifyContent="center" gap={0.5} flexWrap="wrap">
                              {reg.status === "Pending" || reg.status === "Waitinglisted" ? (
                                <SoftButton size="small" variant="outlined" color="info" disabled={busyId === reg.id} onClick={() => handleApprove(reg.id)}>
                                  Duyệt
                                </SoftButton>
                              ) : null}
                              {["Pending", "Waitinglisted", "Approved"].includes(reg.status) ? (
                                <SoftButton size="small" variant="outlined" color="error" disabled={busyId === reg.id} onClick={() => openReject(reg.id)}>
                                  Từ chối
                                </SoftButton>
                              ) : null}
                              {reg.status === "Approved" ? (
                                <SoftButton size="small" variant="outlined" color="success" disabled={busyId === reg.id} onClick={() => openConfirmPayment(reg.id)}>
                                  Xác nhận thanh toán
                                </SoftButton>
                              ) : null}
                              {isPaid ? (
                                <SoftButton size="small" variant="outlined" color="dark" disabled={busyId === reg.id} onClick={() => handleGenerateQr(reg.id)}>
                                  Tạo mã QR
                                </SoftButton>
                              ) : null}
                            </SoftBox>
                          </TableCell>
                        </TableRow>
                        );
                      })}
                      {registrations.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7}>
                            <SoftTypography variant="button" color="text">Chưa có đăng ký nào cho tour này.</SoftTypography>
                          </TableCell>
                        </TableRow>
                      ) : null}
                    </TableBody>
                  </Table>
                </TableContainer>

                <SoftBox mt={4}>
                  <SoftTypography variant="h6" fontWeight="bold">
                    Phản hồi từ sinh viên ({feedbackData.total})
                    {feedbackData.total > 0 ? ` — Trung bình ${feedbackData.averageRating.toFixed(1)}/5` : ""}
                  </SoftTypography>
                  {feedbackData.feedbacks.length === 0 ? (
                    <SoftTypography variant="button" color="text">Chưa có phản hồi nào.</SoftTypography>
                  ) : (
                    <Grid container spacing={2} mt={1}>
                      {feedbackData.feedbacks.map((fb) => (
                        <Grid item xs={12} md={6} key={fb.id ?? fb.createdAt}>
                          <SoftBox p={2} sx={{ border: "1px solid #d9caa6", borderRadius: "12px" }}>
                            <SoftBox display="flex" justifyContent="space-between">
                              <SoftTypography variant="button" fontWeight="bold">{fb.studentName}</SoftTypography>
                              <SoftTypography variant="button" fontWeight="bold" color="warning">{"★".repeat(fb.rating)}{"☆".repeat(5 - fb.rating)}</SoftTypography>
                            </SoftBox>
                            <SoftTypography variant="caption" color="text">{fb.comment || "(Không có nhận xét)"}</SoftTypography>
                          </SoftBox>
                        </Grid>
                      ))}
                    </Grid>
                  )}
                </SoftBox>
              </>
            ) : null}
          </SoftBox>
        </Card>
      </SoftBox>
      <Footer />

      <Dialog open={Boolean(rejecting)} onClose={() => setRejecting(null)} fullWidth maxWidth="sm">
        <DialogTitle>Lý do từ chối đăng ký</DialogTitle>
        <DialogContent>
          <SoftInput
            placeholder="Nhập lý do từ chối"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            multiline
            rows={3}
          />
        </DialogContent>
        <DialogActions>
          <SoftButton variant="outlined" color="dark" onClick={() => setRejecting(null)}>Hủy</SoftButton>
          <SoftButton variant="gradient" color="error" onClick={submitReject} disabled={busyId === rejecting}>
            Từ chối đăng ký
          </SoftButton>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(confirming)} onClose={() => setConfirming(null)} fullWidth maxWidth="sm">
        <DialogTitle>Xác nhận thanh toán</DialogTitle>
        <DialogContent>
          <SoftBox mb={2} mt={1}>
            <SoftTypography variant="caption" fontWeight="bold">Phương thức thanh toán *</SoftTypography>
            <SoftInput
              placeholder="VD: Chuyển khoản, Tiền mặt..."
              value={paymentForm.paymentMethod}
              onChange={(e) => setPaymentForm((current) => ({ ...current, paymentMethod: e.target.value }))}
            />
          </SoftBox>
          <SoftBox mb={2}>
            <SoftTypography variant="caption" fontWeight="bold">Mã giao dịch</SoftTypography>
            <SoftInput
              value={paymentForm.transactionCode}
              onChange={(e) => setPaymentForm((current) => ({ ...current, transactionCode: e.target.value }))}
            />
          </SoftBox>
          <SoftBox mb={2}>
            <SoftTypography variant="caption" fontWeight="bold">Ảnh chứng minh thanh toán</SoftTypography>
            <SoftBox display="flex" gap={1} mt={0.5} alignItems="center" flexWrap="wrap">
              <SoftInput
                placeholder="Dán URL ảnh hoặc bấm Upload ảnh"
                value={paymentForm.proofImageUrl}
                onChange={(e) => setPaymentForm((current) => ({ ...current, proofImageUrl: e.target.value }))}
              />
              <input
                ref={proofFileInputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handleProofFileChange}
              />
              <SoftButton
                type="button"
                variant="outlined"
                color="info"
                size="small"
                disabled={proofUploading}
                onClick={() => proofFileInputRef.current?.click()}
                sx={{ whiteSpace: "nowrap" }}
              >
                {proofUploading ? "Đang upload..." : "Upload ảnh"}
              </SoftButton>
            </SoftBox>
            {paymentForm.proofImageUrl ? (
              <SoftBox mt={1.5}>
                <SoftBox
                  component="img"
                  src={paymentForm.proofImageUrl}
                  alt="Ảnh chứng minh thanh toán"
                  sx={{ maxWidth: "100%", maxHeight: 220, borderRadius: "0.75rem", border: "1px solid #d9caa6", display: "block" }}
                />
              </SoftBox>
            ) : null}
          </SoftBox>
        </DialogContent>
        <DialogActions>
          <SoftButton variant="outlined" color="dark" onClick={() => setConfirming(null)}>Hủy</SoftButton>
          <SoftButton variant="gradient" color="success" onClick={submitConfirmPayment} disabled={busyId === confirming}>
            Xác nhận
          </SoftButton>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(qrResult)} onClose={() => setQrResult(null)} fullWidth maxWidth="sm">
        <DialogTitle>Mã check-in đã tạo</DialogTitle>
        <DialogContent>
          <SoftTypography variant="button" color="text">
            Gửi mã này cho sinh viên hoặc dùng để check-in tại sự kiện:
          </SoftTypography>
          <SoftBox mt={1.5} p={2} sx={{ border: "1px dashed #d9caa6", borderRadius: "8px", wordBreak: "break-all", fontFamily: "monospace" }}>
            {qrResult?.qrCode}
          </SoftBox>
        </DialogContent>
        <DialogActions>
          <SoftButton variant="gradient" color="info" onClick={() => setQrResult(null)}>Đóng</SoftButton>
        </DialogActions>
      </Dialog>

      <Dialog open={cameraOpen} onClose={() => setCameraOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Quét mã check-in bằng camera</DialogTitle>
        <DialogContent>
          {cameraOpen ? (
            <QrCameraScanner active={cameraOpen} onScan={handleCameraScan} onError={handleCameraError} />
          ) : null}
        </DialogContent>
        <DialogActions>
          <SoftButton variant="outlined" color="dark" onClick={() => setCameraOpen(false)}>Hủy</SoftButton>
        </DialogActions>
      </Dialog>
    </DashboardLayout>
  );
}

export default TourRegistrations;
