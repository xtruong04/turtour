import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import Alert from "@mui/material/Alert";
import Card from "@mui/material/Card";
import Dialog from "@mui/material/Dialog";
import Icon from "@mui/material/Icon";
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
import Tooltip from "@mui/material/Tooltip";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftButton from "components/SoftButton";
import SoftInput from "components/SoftInput";
import SkeletonLoader from "components/SkeletonLoader";
import NeoDropdown from "components/NeoDropdown";
import NeoBadge from "components/NeoBadge";

import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

import neoIconButtonSx from "assets/theme/functions/neoIconButtonSx";

import apiService from "../../services/apiService";
import realtimeService from "../../services/realtime";
import { hideSplash } from "utils/splash";
import useTourBasePath from "../../hooks/useTourBasePath";

// Inline SVG icon components — no @mui/icons-material needed
function IconEye() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  );
}

function IconEdit() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
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

function IconUsers() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
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

function IconArchive() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="21 8 21 21 3 21 3 8"/>
      <rect x="1" y="3" width="22" height="5"/>
      <line x1="10" y1="12" x2="14" y2="12"/>
    </svg>
  );
}

// Badge tổng hợp từ 2 trục ApprovalStatus + PublishStatus — chỉ hiện 1 badge duy nhất, vì
// PublishStatus chỉ thật sự có ý nghĩa khi tour đã Approved (xem ToursController.
// ComputeEffectivePublishStatus): Pending/Rejected luôn "thắng" và che PublishStatus.
const statusBadgeConfig = {
  Pending: { label: "Chờ duyệt", bgColor: "#A18F7A" },
  Rejected: { label: "Bị từ chối", bgColor: "#dc3545" },
  Published: { label: "Mở đăng ký", bgColor: "#198754" },
  OnGoing: { label: "Đang diễn ra", bgColor: "#0d6efd" },
  Expired: { label: "Đã đóng", bgColor: "#ffc107", textColor: "#212529" },
  Completed: { label: "Đã hoàn thành", bgColor: "#0aa871" },
  Archived: { label: "Đã hủy", bgColor: "#6c757d" },
  Hidden: { label: "Ẩn", bgColor: "#A18F7A" },
};

function getStatusBadgeKey(tour) {
  const approval = tour.raw?.approvalStatus;
  if (approval === "Pending" || approval === "Rejected") {
    return approval;
  }
  return tour.raw?.publishStatus || "Hidden";
}

const statusFilterOptions = [
  { value: "", label: "Tất cả trạng thái" },
  { value: "pending", label: "Chờ duyệt" },
  { value: "rejected", label: "Bị từ chối" },
  { value: "published", label: "Mở đăng ký" },
  { value: "ongoing", label: "Đang diễn ra" },
  { value: "expired", label: "Đã đóng" },
  { value: "completed", label: "Đã hoàn thành" },
  { value: "archived", label: "Đã hủy" },
];

function Tours() {
  const base = useTourBasePath();
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [statusErrorMessage, setStatusErrorMessage] = useState("");
  const [updatingStatusId, setUpdatingStatusId] = useState(null);
  const [rejecting, setRejecting] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [archivingTourId, setArchivingTourId] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [companyFilter, setCompanyFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const session = apiService.getAuthSession();
  const isAdmin = (session?.roles || []).includes("Admin");

  useEffect(() => {
    async function fetchTours() {
      setLoading(true);
      setErrorMessage("");
      try {
        // Trang đối tác chỉ thấy tour của chính họ — gọi endpoint đã lọc sẵn ở backend,
        // còn trang admin thấy toàn bộ tour.
        const data = base === "/partner" ? await apiService.getMyTours() : await apiService.getTours();
        setTours(Array.isArray(data) ? data : []);
      } catch (error) {
        setErrorMessage(error?.message || "Không tải được danh sách tour.");
      } finally {
        setLoading(false);
        hideSplash();
      }
    }
    fetchTours();
  }, [base]);

  // Tự cập nhật trạng thái khi tour được đổi từ tab/admin khác — không cần F5.
  useEffect(() => {
    const unsubscribe = realtimeService.onTourUpdated(({ tourId, approvalStatus, publishStatus }) => {
      setTours((current) =>
        current.map((tour) =>
          tour.id === tourId
            ? {
                ...tour,
                approvalStatus: approvalStatus.toLowerCase(),
                publishStatus: publishStatus.toLowerCase(),
                raw: { ...tour.raw, approvalStatus, publishStatus },
              }
            : tour
        )
      );
    });
    return unsubscribe;
  }, []);

  const roleScopedTours = useMemo(() => {
    const roles = session?.roles || [];
    let scoped = tours;

    if (roles.includes("Company")) {
      scoped = scoped.filter((tour) => tour?.raw?.company?.email && tour.raw.company.email === session?.email);
    }

    // Trang Tour chính của Admin không hiện tour Chờ duyệt nữa — đã có trang "Tour chờ duyệt"
    // riêng. Đối tác vẫn cần thấy tour Chờ duyệt của chính mình ở đây để theo dõi tiến độ.
    if (base !== "/partner") {
      scoped = scoped.filter((tour) => tour?.raw?.approvalStatus !== "Pending");
    }

    return scoped;
  }, [base, session?.email, session?.roles, tours]);

  const companyOptions = useMemo(() => {
    const names = new Set(roleScopedTours.map((tour) => tour.companyName).filter(Boolean));
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [roleScopedTours]);

  const visibleTours = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const from = dateFrom ? new Date(dateFrom) : null;
    const to = dateTo ? new Date(dateTo) : null;

    return roleScopedTours.filter((tour) => {
      if (term) {
        const haystack = `${tour.title || ""} ${tour.code || ""}`.toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      if (companyFilter && tour.companyName !== companyFilter) return false;
      if (statusFilter && getStatusBadgeKey(tour).toLowerCase() !== statusFilter) return false;
      if (from && tour.startDate && new Date(tour.startDate) < from) return false;
      if (to && tour.startDate && new Date(tour.startDate) > to) return false;
      return true;
    });
  }, [roleScopedTours, searchTerm, companyFilter, statusFilter, dateFrom, dateTo]);

  const runStatusAction = async (tourId, action) => {
    setUpdatingStatusId(tourId);
    setStatusErrorMessage("");
    try {
      const updated = await action();
      setTours((current) => current.map((t) => (t.id === tourId ? updated : t)));
    } catch (error) {
      setStatusErrorMessage(error?.message || "Cập nhật trạng thái thất bại.");
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const handleApprove = (tourId) => runStatusAction(tourId, () => apiService.approveTour(tourId));

  const openReject = (tourId) => {
    setRejecting(tourId);
    setRejectReason("");
  };

  const submitReject = async () => {
    const tourId = rejecting;
    await runStatusAction(tourId, () => apiService.rejectTour(tourId, rejectReason.trim()));
    setRejecting(null);
  };

  const handleArchive = (tourId) => setArchivingTourId(tourId);

  const handleConfirmArchive = () => {
    if (!archivingTourId) return;
    const id = archivingTourId;
    setArchivingTourId(null);
    runStatusAction(id, () => apiService.archiveTour(id));
  };

  const hasActiveFilters = Boolean(searchTerm || companyFilter || statusFilter || dateFrom || dateTo);

  const clearFilters = () => {
    setSearchTerm("");
    setCompanyFilter("");
    setStatusFilter("");
    setDateFrom("");
    setDateTo("");
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <SoftBox py={3}>
        <Card>
          <SoftBox p={3}>
            <SoftBox mb={2} display="flex" justifyContent="space-between" alignItems="center" gap={1}>
              <div>
                <SoftTypography variant="h5" fontWeight="bold">Danh sách Tour</SoftTypography>
                <SoftTypography variant="button" color="text">Tour do tổ chức hoặc doanh nghiệp đã tạo.</SoftTypography>
              </div>
              <SoftButton component={Link} to={`${base}/tours/create`} variant="gradient" color="info">
                Tạo Tour
              </SoftButton>
            </SoftBox>

            <SoftBox mb={2}>
              <Grid container spacing={2} alignItems="flex-end">
                <Grid item xs={12} md={4}>
                  <SoftTypography variant="caption" fontWeight="bold">Tìm kiếm</SoftTypography>
                  <SoftInput
                    placeholder="Tìm theo tên hoặc mã tour..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <SoftTypography variant="caption" fontWeight="bold">Doanh nghiệp</SoftTypography>
                  <NeoDropdown
                    value={companyFilter}
                    placeholder="Tất cả doanh nghiệp"
                    options={[
                      { value: "", label: "Tất cả doanh nghiệp" },
                      ...companyOptions.map((name) => ({ value: name, label: name })),
                    ]}
                    onChange={setCompanyFilter}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                  <SoftTypography variant="caption" fontWeight="bold">Trạng thái</SoftTypography>
                  <NeoDropdown
                    value={statusFilter}
                    options={statusFilterOptions.map((option) => ({ value: option.value, label: option.label }))}
                    onChange={setStatusFilter}
                  />
                </Grid>
                <Grid item xs={6} sm={3} md={1.5}>
                  <SoftTypography variant="caption" fontWeight="bold">Từ ngày</SoftTypography>
                  <SoftInput type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                </Grid>
                <Grid item xs={6} sm={3} md={1.5}>
                  <SoftTypography variant="caption" fontWeight="bold">Đến ngày</SoftTypography>
                  <SoftInput type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                </Grid>
              </Grid>
              {hasActiveFilters ? (
                <SoftBox mt={1.5} display="flex" justifyContent="space-between" alignItems="center">
                  <SoftTypography variant="caption" color="text">
                    Tìm thấy {visibleTours.length} tour phù hợp.
                  </SoftTypography>
                  <SoftButton variant="text" color="error" size="small" onClick={clearFilters}>
                    Xóa lọc
                  </SoftButton>
                </SoftBox>
              ) : null}
            </SoftBox>

            {loading ? <SkeletonLoader.Table rows={6} cols={7} /> : null}
            {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}
            {statusErrorMessage ? (
              <Alert severity="error" onClose={() => setStatusErrorMessage("")}>
                {statusErrorMessage}
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
                    <col style={{ width: "22%" }} />
                    <col style={{ width: "20%" }} />
                    <col style={{ width: "12%" }} />
                    <col style={{ width: "12%" }} />
                    <col style={{ width: "15%" }} />
                  </colgroup>
                  <TableHead sx={{ display: "table-header-group" }}>
                    <TableRow>
                      <TableCell>Mã</TableCell>
                      <TableCell>Hình ảnh</TableCell>
                      <TableCell>Tên tour</TableCell>
                      <TableCell>Doanh nghiệp</TableCell>
                      <TableCell>Trạng thái</TableCell>
                      <TableCell>Bắt đầu</TableCell>
                      <TableCell align="center">Thao tác</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {visibleTours.map((tour) => (
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
                        <TableCell>
                          <NeoBadge
                            label={statusBadgeConfig[getStatusBadgeKey(tour)]?.label || getStatusBadgeKey(tour)}
                            bgColor={statusBadgeConfig[getStatusBadgeKey(tour)]?.bgColor}
                            textColor={statusBadgeConfig[getStatusBadgeKey(tour)]?.textColor}
                          />
                        </TableCell>
                        <TableCell>{tour.startDate ? new Date(tour.startDate).toLocaleDateString("vi-VN") : "-"}</TableCell>
                        <TableCell align="center" sx={{ overflow: "visible" }}>
                          <SoftBox display="flex" justifyContent="center" alignItems="center" gap={0.5}>
                            {isAdmin && tour.raw?.approvalStatus === "Pending" ? (
                              <>
                                <Tooltip title="Duyệt tour" arrow>
                                  <SoftBox
                                    component="button"
                                    type="button"
                                    disabled={updatingStatusId === tour.id}
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
                                    disabled={updatingStatusId === tour.id}
                                    onClick={() => openReject(tour.id)}
                                    sx={neoIconButtonSx("#dc3545")}
                                  >
                                    <IconX />
                                  </SoftBox>
                                </Tooltip>
                              </>
                            ) : null}
                            {tour.raw?.approvalStatus === "Approved" && tour.raw?.publishStatus !== "Archived" && tour.raw?.publishStatus !== "Completed" && (isAdmin || base === "/partner") ? (
                              <Tooltip title="Huỷ tour" arrow>
                                <SoftBox
                                  component="button"
                                  type="button"
                                  disabled={updatingStatusId === tour.id}
                                  onClick={() => handleArchive(tour.id)}
                                  sx={neoIconButtonSx("#6c757d")}
                                >
                                  <IconArchive />
                                </SoftBox>
                              </Tooltip>
                            ) : null}
                            <Tooltip title="Xem chi tiết" arrow>
                              <SoftBox
                                component={Link}
                                to={`${base}/tours/${tour.id}`}
                                sx={neoIconButtonSx("#2b2a27")}
                              >
                                <IconEye />
                              </SoftBox>
                            </Tooltip>
                            {!isAdmin && tour.raw?.approvalStatus === "Approved" ? (
                              <Tooltip title="Quản lý đăng ký" arrow>
                                <SoftBox
                                  component={Link}
                                  to={`${base}/tours/${tour.id}/registrations`}
                                  sx={neoIconButtonSx("#2dce89")}
                                >
                                  <IconUsers />
                                </SoftBox>
                              </Tooltip>
                            ) : null}
                            {!isAdmin ? (
                              <Tooltip title="Chỉnh sửa" arrow>
                                <SoftBox
                                  component={Link}
                                  to={`${base}/tours/${tour.id}/edit`}
                                  sx={neoIconButtonSx("#17c1e8")}
                                >
                                  <IconEdit />
                                </SoftBox>
                              </Tooltip>
                            ) : null}
                            {!isAdmin ? (
                              <Tooltip title="Xóa tour" arrow>
                                <SoftBox
                                  component={Link}
                                  to={`${base}/tours/${tour.id}/delete`}
                                  sx={neoIconButtonSx("#ea0606")}
                                >
                                  <IconTrash />
                                </SoftBox>
                              </Tooltip>
                            ) : null}
                          </SoftBox>
                        </TableCell>
                      </TableRow>
                    ))}
                    {visibleTours.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7}>
                          <SoftTypography variant="button" color="text">
                            Chưa có tour nào.
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
          <SoftButton variant="gradient" color="error" onClick={submitReject} disabled={updatingStatusId === rejecting}>
            Từ chối tour
          </SoftButton>
        </DialogActions>
      </Dialog>

      {/* ── Archive confirm dialog ── */}
      <Dialog
        open={Boolean(archivingTourId)}
        onClose={() => setArchivingTourId(null)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: "16px", p: 1 } }}
      >
        <DialogContent sx={{ textAlign: "center", pt: 3, pb: 1 }}>
          <SoftBox
            sx={{
              width: 60, height: 60, borderRadius: "16px",
              background: "linear-gradient(135deg, #fff7ed, #ffedd5)",
              border: "1px solid #fed7aa",
              display: "flex", alignItems: "center", justifyContent: "center",
              mx: "auto", mb: 2,
            }}
          >
            <Icon sx={{ color: "#ea580c", fontSize: "1.8rem !important" }}>inventory_2</Icon>
          </SoftBox>
          <SoftTypography variant="h6" fontWeight="bold" sx={{ mb: 0.75, color: "#1a1a2e" }}>
            Huỷ / lưu trữ tour?
          </SoftTypography>
          <SoftTypography variant="button" color="text" sx={{ display: "block", mb: 1.5 }}>
            Tour sẽ bị ẩn khỏi danh sách công khai và không thể đăng ký thêm.
          </SoftTypography>
          <SoftBox
            sx={{
              background: "#fefce8", border: "1px solid #fef08a",
              borderRadius: "10px", px: 2, py: 1.25, textAlign: "left",
            }}
          >
            <SoftTypography variant="caption" sx={{ color: "#713f12", lineHeight: 1.5 }}>
              Hành động này <strong>không thể hoàn tác</strong>. Tour sẽ chuyển sang trạng thái Đã hủy.
            </SoftTypography>
          </SoftBox>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <SoftButton variant="outlined" color="dark" fullWidth onClick={() => setArchivingTourId(null)}>
            Hủy
          </SoftButton>
          <SoftButton variant="gradient" color="warning" fullWidth onClick={handleConfirmArchive}>
            Xác nhận lưu trữ
          </SoftButton>
        </DialogActions>
      </Dialog>
    </DashboardLayout>
  );
}

export default Tours;
