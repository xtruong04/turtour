import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import Alert from "@mui/material/Alert";
import Card from "@mui/material/Card";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Tooltip from "@mui/material/Tooltip";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftButton from "components/SoftButton";
import SoftInput from "components/SoftInput";
import PageLoader from "components/PageLoader";
import NeoBadge from "components/NeoBadge";

import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

import neoIconButtonSx from "assets/theme/functions/neoIconButtonSx";

import apiService from "../../services/apiService";
import { hideSplash } from "utils/splash";

// Inline SVG icons — no @mui/icons-material needed
function IconEye() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  );
}

function IconCheck() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
}

function IconX() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  );
}

function TourPendingApproval() {
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [actionErrorMessage, setActionErrorMessage] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [rejecting, setRejecting] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    async function loadTours() {
      setLoading(true);
      setErrorMessage("");
      try {
        const data = await apiService.getTours();
        const pending = Array.isArray(data) ? data.filter((tour) => tour.raw?.approvalStatus === "Pending") : [];
        setTours(pending);
      } catch (error) {
        setErrorMessage(error?.message || "Không tải được danh sách tour chờ duyệt.");
      } finally {
        setLoading(false);
        hideSplash();
      }
    }
    loadTours();
  }, []);

  const handleApprove = async (tourId) => {
    setBusyId(tourId);
    setActionErrorMessage("");
    try {
      await apiService.approveTour(tourId);
      setTours((current) => current.filter((tour) => tour.id !== tourId));
    } catch (error) {
      setActionErrorMessage(error?.message || "Duyệt tour thất bại.");
    } finally {
      setBusyId(null);
    }
  };

  const openReject = (tourId) => {
    setRejecting(tourId);
    setRejectReason("");
  };

  const submitReject = async () => {
    setBusyId(rejecting);
    setActionErrorMessage("");
    try {
      await apiService.rejectTour(rejecting, rejectReason.trim());
      setTours((current) => current.filter((tour) => tour.id !== rejecting));
      setRejecting(null);
    } catch (error) {
      setActionErrorMessage(error?.message || "Từ chối tour thất bại.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <SoftBox py={3}>
        <Card>
          <SoftBox p={3}>
            <SoftBox mb={2}>
              <SoftTypography variant="h5" fontWeight="bold">Tour chờ duyệt</SoftTypography>
              <SoftTypography variant="button" color="text">
                Các tour do doanh nghiệp/tổ chức tạo, đang chờ Admin duyệt trước khi hiển thị công khai.
              </SoftTypography>
            </SoftBox>

            {loading ? <PageLoader label="Đang tải danh sách tour chờ duyệt..." /> : null}
            {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}
            {actionErrorMessage ? (
              <Alert severity="error" onClose={() => setActionErrorMessage("")}>
                {actionErrorMessage}
              </Alert>
            ) : null}

            {!loading && !errorMessage ? (
              <TableContainer sx={{ overflowX: "auto" }}>
                <Table
                  size="small"
                  sx={{
                    tableLayout: "fixed",
                    minWidth: 800,
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
                    <col style={{ width: "10%" }} />
                    <col style={{ width: "9%" }} />
                    <col style={{ width: "24%" }} />
                    <col style={{ width: "18%" }} />
                    <col style={{ width: "13%" }} />
                    <col style={{ width: "12%" }} />
                    <col style={{ width: "14%" }} />
                  </colgroup>
                  <TableHead sx={{ display: "table-header-group" }}>
                    <TableRow>
                      <TableCell>Mã</TableCell>
                      <TableCell>Hình ảnh</TableCell>
                      <TableCell>Tên tour</TableCell>
                      <TableCell>Doanh nghiệp</TableCell>
                      <TableCell>Ngày bắt đầu</TableCell>
                      <TableCell>Trạng thái</TableCell>
                      <TableCell align="center">Thao tác</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {tours.map((tour) => (
                      <TableRow key={tour.id} hover>
                        <TableCell title={tour.code || ""}>{tour.code || "-"}</TableCell>
                        <TableCell>
                          {tour.thumbnail ? (
                            <img
                              src={tour.thumbnail}
                              alt={tour.title}
                              style={{ width: "50px", height: "35px", objectFit: "cover", borderRadius: "4px", display: "block" }}
                            />
                          ) : (
                            <div style={{ width: "50px", height: "35px", backgroundColor: "#f6efdd", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "4px", fontSize: "10px", color: "#a3906c", border: "1px solid #d9caa6" }}>
                              Không ảnh
                            </div>
                          )}
                        </TableCell>
                        <TableCell title={tour.title || ""}>{tour.title || "-"}</TableCell>
                        <TableCell title={tour.companyName || ""}>{tour.companyName || "-"}</TableCell>
                        <TableCell>{tour.startDate ? new Date(tour.startDate).toLocaleDateString("vi-VN") : "-"}</TableCell>
                        <TableCell>
                          <NeoBadge label="Chờ duyệt" bgColor="#A18F7A" textColor="#fff" />
                        </TableCell>
                        <TableCell align="center">
                          <SoftBox display="flex" justifyContent="center" alignItems="center" gap={0.5}>
                            <Tooltip title="Duyệt tour" arrow>
                              <SoftBox
                                component="button"
                                type="button"
                                disabled={busyId === tour.id}
                                onClick={() => handleApprove(tour.id)}
                                sx={neoIconButtonSx("#198754")}
                              >
                                <IconCheck />
                              </SoftBox>
                            </Tooltip>
                            <Tooltip title="Từ chối tour" arrow>
                              <SoftBox
                                component="button"
                                type="button"
                                disabled={busyId === tour.id}
                                onClick={() => openReject(tour.id)}
                                sx={neoIconButtonSx("#dc3545")}
                              >
                                <IconX />
                              </SoftBox>
                            </Tooltip>
                            <Tooltip title="Xem chi tiết" arrow>
                              <SoftBox component={Link} to={`/admin/tours/${tour.id}`} sx={neoIconButtonSx("#2b2a27")}>
                                <IconEye />
                              </SoftBox>
                            </Tooltip>
                          </SoftBox>
                        </TableCell>
                      </TableRow>
                    ))}
                    {tours.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7}>
                          <SoftTypography variant="button" color="text">
                            Không có tour nào đang chờ duyệt.
                          </SoftTypography>
                        </TableCell>
                      </TableRow>
                    ) : null}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : null}
          </SoftBox>
        </Card>
      </SoftBox>
      <Footer />

      <Dialog open={Boolean(rejecting)} onClose={() => setRejecting(null)} fullWidth maxWidth="sm">
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
          <SoftButton variant="outlined" color="dark" onClick={() => setRejecting(null)}>Hủy</SoftButton>
          <SoftButton variant="gradient" color="error" onClick={submitReject} disabled={busyId === rejecting}>
            Từ chối tour
          </SoftButton>
        </DialogActions>
      </Dialog>
    </DashboardLayout>
  );
}

export default TourPendingApproval;
