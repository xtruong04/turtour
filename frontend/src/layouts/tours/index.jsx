import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import PropTypes from "prop-types";

import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import Grid from "@mui/material/Grid";
import Icon from "@mui/material/Icon";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftButton from "components/SoftButton";
import SoftInput from "components/SoftInput";
import PageLoader from "components/PageLoader";

import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

import neoIconButtonSx from "assets/theme/functions/neoIconButtonSx";

import apiService from "../../services/apiService";
import realtimeService from "../../services/realtime";

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

// Bảng màu theo chuẩn Bootstrap (primary/success/warning/danger/secondary)
// để đồng bộ với badge trạng thái ở trang sinh viên (dewi).
const statusColors = {
  PendingApproval: "#A18F7A", // taupe — chờ Admin duyệt, tách biệt với các màu trạng thái đã duyệt
  Upcoming: "#0d6efd", // primary
  Open: "#198754", // success
  Closed: "#ffc107", // warning
  Cancelled: "#dc3545", // danger
  Completed: "#6c757d", // secondary
};

const statusTextColors = {
  Closed: "#212529", // chữ đen trên nền vàng (warning) để đủ độ tương phản
};

const statusFilterOptions = [
  { value: "", label: "Tất cả trạng thái" },
  { value: "pendingapproval", label: "Chờ duyệt" },
  { value: "upcoming", label: "Sắp diễn ra" },
  { value: "open", label: "Mở đăng ký" },
  { value: "closed", label: "Đã đóng" },
  { value: "cancelled", label: "Đã hủy" },
  { value: "completed", label: "Đã hoàn thành" },
];

const statusUpdateOptions = [
  { value: "PendingApproval", label: "Chờ duyệt" },
  { value: "Upcoming", label: "Sắp diễn ra" },
  { value: "Open", label: "Mở đăng ký" },
  { value: "Closed", label: "Đã đóng" },
  { value: "Cancelled", label: "Đã hủy" },
  { value: "Completed", label: "Đã hoàn thành" },
];

// Nút trạng thái dạng button đặc (contained), tô màu đầy ô, không bo góc —
// thay cho MUI Select để tránh các lỗi hiển thị do style chồng lớp DOM nội bộ của Select.
function TourStatusButton({ tourId, status, disabled, canApprove, onChange }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const bgColor = statusColors[status] || "#8392ab";
  const textColor = statusTextColors[status] || "#fff";
  const currentLabel = statusUpdateOptions.find((option) => option.value === status)?.label || status || "—";
  // Tour đang Chờ duyệt thì chỉ Admin được đổi trạng thái (duyệt) — Organizator/Company
  // tạo tour đó chỉ xem, không tự duyệt được cho chính mình.
  const isLockedForApproval = status === "PendingApproval" && !canApprove;
  const isDisabled = disabled || isLockedForApproval;

  const handleSelect = (value) => {
    setAnchorEl(null);
    if (value !== status) {
      onChange(tourId, value);
    }
  };

  return (
    <>
      <Button
        fullWidth
        disableElevation
        disabled={isDisabled}
        title={isLockedForApproval ? "Chỉ Admin mới được duyệt tour này." : undefined}
        onClick={(event) => setAnchorEl(event.currentTarget)}
        endIcon={<Icon sx={{ color: textColor }}>arrow_drop_down</Icon>}
        sx={{
          height: "100%",
          minHeight: 48,
          borderRadius: 0,
          border: "2px solid #2b2a27",
          fontSize: "0.7rem",
          fontWeight: 700,
          letterSpacing: "0.03em",
          textTransform: "uppercase",
          color: textColor,
          backgroundColor: bgColor,
          opacity: isDisabled ? 0.6 : 1,
          "&:hover": { backgroundColor: bgColor, opacity: 0.85 },
          "&.Mui-disabled": { color: textColor, backgroundColor: bgColor, border: "2px solid #2b2a27" },
        }}
      >
        {currentLabel}
      </Button>
      <Menu anchorEl={anchorEl} open={open} onClose={() => setAnchorEl(null)}>
        {statusUpdateOptions.map((option) => (
          <MenuItem key={option.value} selected={option.value === status} onClick={() => handleSelect(option.value)}>
            <SoftBox
              component="span"
              sx={{
                width: 10,
                height: 10,
                borderRadius: 0,
                border: "1.5px solid #2b2a27",
                backgroundColor: statusColors[option.value] || "#8392ab",
                display: "inline-block",
                mr: 1,
              }}
            />
            {option.label}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}

TourStatusButton.propTypes = {
  tourId: PropTypes.string.isRequired,
  status: PropTypes.string,
  disabled: PropTypes.bool,
  canApprove: PropTypes.bool,
  onChange: PropTypes.func.isRequired,
};

TourStatusButton.defaultProps = {
  status: "",
  disabled: false,
  canApprove: false,
};

function Tours() {
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [statusErrorMessage, setStatusErrorMessage] = useState("");
  const [updatingStatusId, setUpdatingStatusId] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [companyFilter, setCompanyFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const session = apiService.getAuthSession();

  useEffect(() => {
    async function fetchTours() {
      setLoading(true);
      setErrorMessage("");
      try {
        const data = await apiService.getTours();
        setTours(Array.isArray(data) ? data : []);
      } catch (error) {
        setErrorMessage(error?.message || "Không tải được danh sách tour.");
      } finally {
        setLoading(false);
      }
    }
    fetchTours();
  }, []);

  // Tự cập nhật trạng thái khi tour được đổi từ tab/admin khác — không cần F5.
  useEffect(() => {
    const unsubscribe = realtimeService.onTourUpdated(({ tourId, status }) => {
      setTours((current) =>
        current.map((tour) =>
          tour.id === tourId
            ? { ...tour, status: status.toLowerCase(), raw: { ...tour.raw, status } }
            : tour
        )
      );
    });
    return unsubscribe;
  }, []);

  const roleScopedTours = useMemo(() => {
    const roles = session?.roles || [];
    if (roles.includes("Company")) {
      return tours.filter((tour) => tour?.raw?.company?.email && tour.raw.company.email === session?.email);
    }
    return tours;
  }, [session?.email, session?.roles, tours]);

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
      if (statusFilter && tour.status !== statusFilter) return false;
      if (from && tour.startDate && new Date(tour.startDate) < from) return false;
      if (to && tour.startDate && new Date(tour.startDate) > to) return false;
      return true;
    });
  }, [roleScopedTours, searchTerm, companyFilter, statusFilter, dateFrom, dateTo]);

  const handleStatusChange = async (tourId, newStatus) => {
    setUpdatingStatusId(tourId);
    setStatusErrorMessage("");
    try {
      const updated = await apiService.updateTourStatus(tourId, newStatus);
      setTours((current) => current.map((t) => (t.id === tourId ? updated : t)));
    } catch (error) {
      setStatusErrorMessage(error?.message || "Cập nhật trạng thái thất bại.");
    } finally {
      setUpdatingStatusId(null);
    }
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
              <SoftButton component={Link} to="/admin/tours/create" variant="gradient" color="info">
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
                  <TextField select fullWidth size="small" value={companyFilter} onChange={(e) => setCompanyFilter(e.target.value)}>
                    <MenuItem value="">Tất cả doanh nghiệp</MenuItem>
                    {companyOptions.map((name) => (
                      <MenuItem key={name} value={name}>{name}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                  <SoftTypography variant="caption" fontWeight="bold">Trạng thái</SoftTypography>
                  <TextField select fullWidth size="small" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                    {statusFilterOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                    ))}
                  </TextField>
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

            {loading ? <PageLoader label="Đang tải danh sách tour..." /> : null}
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
                      color: "#344767",
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
                            <div style={{ width: "50px", height: "35px", backgroundColor: "#f0f2f5", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "4px", fontSize: "10px", color: "#8392ab", border: "1px solid #e9ecef" }}>
                              Không ảnh
                            </div>
                          )}
                        </TableCell>
                        <TableCell title={tour.title || ""}>{tour.title || "-"}</TableCell>
                        <TableCell title={tour.companyName || ""}>{tour.companyName || "-"}</TableCell>
                        <TableCell sx={{ overflow: "visible", p: 0 }}>
                          <TourStatusButton
                            tourId={tour.id}
                            status={tour.raw?.status || ""}
                            disabled={
                              updatingStatusId === tour.id ||
                              (tour.raw?.status === "Completed" && tour.endDate && new Date(tour.endDate) < new Date())
                            }
                            canApprove={(session?.roles || []).includes("Admin")}
                            onChange={handleStatusChange}
                          />
                        </TableCell>
                        <TableCell>{tour.startDate ? new Date(tour.startDate).toLocaleDateString("vi-VN") : "-"}</TableCell>
                        <TableCell align="center" sx={{ overflow: "visible" }}>
                          <SoftBox display="flex" justifyContent="center" alignItems="center" gap={0.5}>
                            <Tooltip title="Xem chi tiết" arrow>
                              <SoftBox
                                component={Link}
                                to={`/admin/tours/${tour.id}`}
                                sx={neoIconButtonSx("#344767")}
                              >
                                <IconEye />
                              </SoftBox>
                            </Tooltip>
                            <Tooltip title="Quản lý đăng ký" arrow>
                              <SoftBox
                                component={Link}
                                to={`/admin/tours/${tour.id}/registrations`}
                                sx={neoIconButtonSx("#2dce89")}
                              >
                                <IconUsers />
                              </SoftBox>
                            </Tooltip>
                            <Tooltip title="Chỉnh sửa" arrow>
                              <SoftBox
                                component={Link}
                                to={`/admin/tours/${tour.id}/edit`}
                                sx={neoIconButtonSx("#17c1e8")}
                              >
                                <IconEdit />
                              </SoftBox>
                            </Tooltip>
                            <Tooltip title="Xóa tour" arrow>
                              <SoftBox
                                component={Link}
                                to={`/admin/tours/${tour.id}/delete`}
                                sx={neoIconButtonSx("#ea0606")}
                              >
                                <IconTrash />
                              </SoftBox>
                            </Tooltip>
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
    </DashboardLayout>
  );
}

export default Tours;
