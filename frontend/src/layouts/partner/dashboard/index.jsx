import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import Alert from "@mui/material/Alert";
import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid";
import Icon from "@mui/material/Icon";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";

import SoftBox from "components/SoftBox";
import SoftButton from "components/SoftButton";
import SoftTypography from "components/SoftTypography";
import SkeletonLoader from "components/SkeletonLoader";
import NeoStatCard from "components/NeoStatCard";
import NeoBadge from "components/NeoBadge";

import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

import apiService from "../../../services/apiService";
import { hideSplash } from "utils/splash";

function fmt(v) {
  return Number(v || 0).toLocaleString("vi-VN") + " ₫";
}

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function fmtMonth(m) {
  // "2026-06" → "T6/2026"
  if (!m) return m;
  const [y, mo] = m.split("-");
  return `T${Number(mo)}/${y}`;
}

const statusConfig = {
  Published:  { label: "Mở đăng ký",   bgColor: "#198754" },
  OnGoing:    { label: "Đang diễn ra", bgColor: "#0d6efd" },
  Expired:    { label: "Đã đóng",      bgColor: "#ffc107", textColor: "#212529" },
  Completed:  { label: "Đã hoàn thành", bgColor: "#0aa871" },
  Archived:   { label: "Đã hủy",       bgColor: "#6c757d" },
  Hidden:     { label: "Ẩn",           bgColor: "#A18F7A" },
  Pending:    { label: "Chờ duyệt",    bgColor: "#A18F7A" },
  Rejected:   { label: "Bị từ chối",   bgColor: "#dc3545" },
};

function StatusBadge({ status }) {
  const cfg = statusConfig[status] || { label: status, bgColor: "#6c757d" };
  return <NeoBadge label={cfg.label} bgColor={cfg.bgColor} textColor={cfg.textColor || "#fff"} />;
}

// Mini bar chart for revenue by month — pure CSS, no library needed
function RevenueBarChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <SoftBox textAlign="center" py={4}>
        <Icon sx={{ fontSize: 36, color: "#d9caa6", mb: 1, display: "block", mx: "auto" }}>bar_chart</Icon>
        <SoftTypography variant="caption" color="text" display="block">Chưa có dữ liệu doanh thu</SoftTypography>
      </SoftBox>
    );
  }
  const max = Math.max(...data.map(d => Number(d.totalAmount)));
  return (
    <SoftBox>
      {data.slice(-6).map((row) => {
        const pct = max > 0 ? (Number(row.totalAmount) / max) * 100 : 0;
        return (
          <SoftBox key={row.month} mb={1.5}>
            <SoftBox display="flex" justifyContent="space-between" mb={0.4}>
              <SoftTypography variant="caption" fontWeight="bold" sx={{ color: "#5a4f3f" }}>
                {fmtMonth(row.month)}
              </SoftTypography>
              <SoftTypography variant="caption" sx={{ color: "#5a4f3f" }}>
                {fmt(row.totalAmount)}
              </SoftTypography>
            </SoftBox>
            <SoftBox
              sx={{
                width: "100%", height: 12,
                backgroundColor: "#ebe0c5",
                border: "1.5px solid #2b2a27",
                position: "relative",
              }}
            >
              <SoftBox
                sx={{
                  position: "absolute", top: 0, left: 0, bottom: 0,
                  width: `${pct}%`,
                  backgroundColor: "#b5281f",
                  transition: "width 0.4s ease",
                }}
              />
            </SoftBox>
          </SoftBox>
        );
      })}
    </SoftBox>
  );
}

// Card đơn giản style Neo-Brutalism
function NeoCard({ title, icon, children, action }) {
  return (
    <SoftBox
      sx={{
        border: "3px solid #2b2a27",
        borderRadius: 0,
        boxShadow: "6px 6px 0 #2b2a27",
        backgroundColor: "#fff",
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <SoftBox
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        px={2.5}
        py={1.75}
        sx={{ borderBottom: "2px solid #2b2a27", backgroundColor: "#f6efdd" }}
      >
        <SoftBox display="flex" alignItems="center" gap={1}>
          {icon && <Icon sx={{ fontSize: "1.1rem", color: "#b5281f" }}>{icon}</Icon>}
          <SoftTypography variant="button" fontWeight="bold" sx={{ color: "#2b2a27", textTransform: "uppercase", letterSpacing: "0.04em", fontSize: "0.72rem" }}>
            {title}
          </SoftTypography>
        </SoftBox>
        {action}
      </SoftBox>
      <SoftBox flex={1} px={2.5} py={2}>
        {children}
      </SoftBox>
    </SoftBox>
  );
}

// Item "cần hành động"
function ActionItem({ icon, iconColor, label, sub, to }) {
  return (
    <SoftBox
      component={to ? Link : "div"}
      to={to}
      display="flex"
      alignItems="flex-start"
      gap={1.5}
      py={1.25}
      sx={{
        borderBottom: "1px solid #d9caa6",
        textDecoration: "none",
        "&:last-child": { borderBottom: "none" },
        "&:hover": to ? { backgroundColor: "#f6efdd", mx: -2.5, px: 2.5 } : {},
        transition: "background 0.15s",
      }}
    >
      <SoftBox
        sx={{
          width: 34, height: 34, flexShrink: 0,
          border: "2px solid #2b2a27",
          display: "flex", alignItems: "center", justifyContent: "center",
          backgroundColor: iconColor + "18",
        }}
      >
        <Icon sx={{ fontSize: "1rem", color: iconColor }}>{icon}</Icon>
      </SoftBox>
      <SoftBox>
        <SoftTypography variant="caption" fontWeight="bold" sx={{ color: "#2b2a27", display: "block", lineHeight: 1.3 }}>
          {label}
        </SoftTypography>
        {sub && (
          <SoftTypography variant="caption" sx={{ color: "#7d6b51", fontSize: "0.71rem" }}>
            {sub}
          </SoftTypography>
        )}
      </SoftBox>
    </SoftBox>
  );
}

const TABLE_SX = {
  tableLayout: "fixed",
  "& th": { fontSize: "0.7rem", fontWeight: 700, color: "#2b2a27", whiteSpace: "nowrap", py: 1.25 },
  "& td": { fontSize: "0.8rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", py: 1 },
};

function PartnerDashboard() {
  const [overview, setOverview] = useState(null);
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const session = apiService.getAuthSession();
  const roleLabel = (session?.roles || []).includes("Company") ? "doanh nghiệp" : "người tổ chức";

  useEffect(() => {
    async function fetchAll() {
      setLoading(true);
      setErrorMessage("");
      try {
        const [ov, rp] = await Promise.all([
          apiService.getPartnerOverview(),
          apiService.getPartnerReports(),
        ]);
        setOverview(ov);
        setReports(rp);
      } catch (err) {
        setErrorMessage(err?.message || "Không tải được số liệu tổng quan.");
      } finally {
        setLoading(false);
        hideSplash();
      }
    }
    fetchAll();
  }, []);

  // Tính các chỉ số phụ từ reports
  const toursReport = reports?.toursReport || [];
  const revenueByMonth = reports?.revenueByMonth || [];

  // Tour đang có lượt đăng ký chờ duyệt (chưa approved/paid/completed)
  const toursNeedingAction = toursReport.filter((t) => {
    const pending = t.totalRegistrations - t.approvedCount - t.paidCount - t.completedCount;
    return (t.publishStatus === "Published" || t.publishStatus === "Expired") && pending > 0;
  });
  const totalPendingRegs = toursNeedingAction.reduce((sum, t) => {
    return sum + (t.totalRegistrations - t.approvedCount - t.paidCount - t.completedCount);
  }, 0);

  // Tour đang chờ duyệt từ admin
  const toursWaitingAdmin = toursReport.filter((t) => t.approvalStatus === "Pending");

  // 5 tour gần nhất (theo startDate desc)
  const recentTours = [...toursReport]
    .sort((a, b) => new Date(b.startDate) - new Date(a.startDate))
    .slice(0, 8);

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <SoftBox py={3}>

        {/* Header */}
        <SoftBox mb={3} display="flex" justifyContent="space-between" alignItems="center" gap={1} flexWrap="wrap">
          <div>
            <SoftTypography variant="h5" fontWeight="bold">Dashboard {roleLabel}</SoftTypography>
            <SoftTypography variant="button" color="text">
              Tổng quan tour và hoạt động của bạn.
            </SoftTypography>
          </div>
          <SoftBox display="flex" gap={1} flexWrap="wrap">
            <SoftButton component={Link} to="/partner/reports" variant="outlined" color="dark">Báo cáo</SoftButton>
            <SoftButton component={Link} to="/partner/tours" variant="outlined" color="dark">Tour của tôi</SoftButton>
            <SoftButton component={Link} to="/partner/tours/create" variant="gradient" color="info">+ Tạo tour mới</SoftButton>
          </SoftBox>
        </SoftBox>

        {loading ? <SkeletonLoader.Dashboard statCount={5} /> : null}
        {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}

        {!loading && !errorMessage ? (
          <SoftBox>

            {/* ── Row 1: Stat cards ── */}
            <Grid container spacing={2.5} mb={3}>
              <Grid item xs={6} sm={4} xl={2.4}>
                <NeoStatCard title="Tổng số tour" count={overview?.totalTours ?? 0} icon="airplanemode_active" bgColor="#1E2A38" />
              </Grid>
              <Grid item xs={6} sm={4} xl={2.4}>
                <NeoStatCard title="Đang mở đăng ký" count={overview?.openCount ?? 0} icon="event_available" bgColor="#3C7A5B" />
              </Grid>
              <Grid item xs={6} sm={4} xl={2.4}>
                <NeoStatCard title="Tổng lượt đăng ký" count={overview?.totalRegistrations ?? 0} icon="people" bgColor="#4B3A8C" />
              </Grid>
              <Grid item xs={6} sm={6} xl={2.4}>
                <NeoStatCard title="Chờ duyệt" count={overview?.pendingApprovalCount ?? 0} icon="hourglass_top" bgColor="#A18F7A" />
              </Grid>
              <Grid item xs={12} sm={6} xl={2.4}>
                <NeoStatCard title="Doanh thu đã thu" count={fmt(overview?.totalRevenue)} icon="payments" bgColor="#4A4F3C" />
              </Grid>
            </Grid>

            {/* ── Row 2: Tour list + Sidebar ── */}
            <Grid container spacing={2.5} mb={2.5}>

              {/* Tour list */}
              <Grid item xs={12} xl={7.5}>
                <NeoCard
                  title="Danh sách tour"
                  icon="list_alt"
                  action={
                    <SoftTypography
                      component={Link}
                      to="/partner/tours"
                      variant="caption"
                      fontWeight="bold"
                      sx={{ color: "#b5281f", textDecoration: "none", "&:hover": { textDecoration: "underline" } }}
                    >
                      Xem tất cả →
                    </SoftTypography>
                  }
                >
                  {recentTours.length === 0 ? (
                    <SoftBox textAlign="center" py={4}>
                      <Icon sx={{ fontSize: 40, color: "#d9caa6", mb: 1 }}>inbox</Icon>
                      <SoftTypography variant="body2" color="text">Bạn chưa có tour nào.<br />
                        <SoftTypography component={Link} to="/partner/tours/create" variant="body2" sx={{ color: "#b5281f" }}>
                          Tạo tour đầu tiên ngay
                        </SoftTypography>
                      </SoftTypography>
                    </SoftBox>
                  ) : (
                    <TableContainer sx={{ overflowX: "auto" }}>
                      <Table size="small" sx={TABLE_SX}>
                        <TableHead>
                          <TableRow>
                            <TableCell style={{ width: "35%" }}>Tên tour</TableCell>
                            <TableCell style={{ width: "18%" }}>Trạng thái</TableCell>
                            <TableCell style={{ width: "10%" }} align="center">Đ.ký</TableCell>
                            <TableCell style={{ width: "10%" }} align="center">Duyệt</TableCell>
                            <TableCell style={{ width: "10%" }} align="center">Trả phí</TableCell>
                            <TableCell style={{ width: "17%" }} align="right">Doanh thu</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {recentTours.map((t) => (
                            <TableRow key={t.tourId} hover>
                              <TableCell>
                                <SoftTypography
                                  component={Link}
                                  to={`/partner/tours/${t.tourId}`}
                                  variant="caption"
                                  fontWeight="bold"
                                  sx={{
                                    color: "#2b2a27",
                                    textDecoration: "none",
                                    display: "block",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                    "&:hover": { color: "#b5281f", textDecoration: "underline" },
                                  }}
                                >
                                  {t.title}
                                </SoftTypography>
                                <SoftTypography variant="caption" sx={{ color: "#a3906c", fontSize: "0.68rem" }}>
                                  {fmtDate(t.startDate)}
                                </SoftTypography>
                              </TableCell>
                              <TableCell>
                                <StatusBadge status={t.publishStatus === "Hidden" && t.approvalStatus === "Pending" ? "Pending" : t.publishStatus} />
                              </TableCell>
                              <TableCell align="center">
                                <SoftTypography variant="caption" fontWeight="bold" sx={{ color: "#2b2a27" }}>
                                  {t.totalRegistrations}/{t.maxParticipants}
                                </SoftTypography>
                              </TableCell>
                              <TableCell align="center">
                                <SoftTypography variant="caption" sx={{ color: "#3C7A5B" }}>{t.approvedCount}</SoftTypography>
                              </TableCell>
                              <TableCell align="center">
                                <SoftTypography variant="caption" sx={{ color: "#198754" }}>{t.paidCount}</SoftTypography>
                              </TableCell>
                              <TableCell align="right">
                                <SoftTypography variant="caption" fontWeight="bold" sx={{ color: "#b5281f" }}>
                                  {t.revenue > 0 ? fmt(t.revenue) : "—"}
                                </SoftTypography>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </NeoCard>
              </Grid>

              {/* Sidebar: cần hành động + doanh thu tháng */}
              <Grid item xs={12} xl={4.5}>
                <SoftBox display="flex" flexDirection="column" gap={2.5} height="100%">

                  {/* Cần hành động */}
                  <NeoCard
                    title="Cần xử lý"
                    icon="notification_important"
                    action={
                      totalPendingRegs > 0 || toursWaitingAdmin.length > 0 ? (
                        <SoftBox
                          sx={{
                            width: 22, height: 22,
                            backgroundColor: "#b5281f",
                            border: "2px solid #2b2a27",
                            display: "flex", alignItems: "center", justifyContent: "center",
                          }}
                        >
                          <SoftTypography variant="caption" fontWeight="bold" sx={{ color: "#fff", fontSize: "0.65rem", lineHeight: 1 }}>
                            {totalPendingRegs + toursWaitingAdmin.length}
                          </SoftTypography>
                        </SoftBox>
                      ) : null
                    }
                  >
                    {totalPendingRegs === 0 && toursWaitingAdmin.length === 0 ? (
                      <SoftBox textAlign="center" py={2}>
                        <Icon sx={{ fontSize: 30, color: "#3C7A5B", mb: 0.5 }}>check_circle</Icon>
                        <SoftTypography variant="caption" color="text" display="block">
                          Không có mục nào cần xử lý
                        </SoftTypography>
                      </SoftBox>
                    ) : (
                      <SoftBox>
                        {toursWaitingAdmin.map((t) => (
                          <ActionItem
                            key={t.tourId}
                            icon="hourglass_top"
                            iconColor="#A18F7A"
                            label={`"${t.title}" chờ Admin duyệt`}
                            sub={`Gửi từ ${fmtDate(t.startDate)}`}
                            to={`/partner/tours/${t.tourId}`}
                          />
                        ))}
                        {toursNeedingAction.map((t) => {
                          const pending = t.totalRegistrations - t.approvedCount - t.paidCount - t.completedCount;
                          return (
                            <ActionItem
                              key={t.tourId}
                              icon="person_add"
                              iconColor="#b5281f"
                              label={`${pending} đăng ký chờ duyệt`}
                              sub={t.title}
                              to={`/partner/tours/${t.tourId}/registrations`}
                            />
                          );
                        })}
                      </SoftBox>
                    )}
                  </NeoCard>

                  {/* Doanh thu theo tháng */}
                  <NeoCard title="Doanh thu theo tháng" icon="bar_chart">
                    <RevenueBarChart data={revenueByMonth} />
                  </NeoCard>

                </SoftBox>
              </Grid>
            </Grid>

            {/* ── Row 3: Quick links ── */}
            <Grid container spacing={2.5}>
              {[
                { icon: "add_circle", label: "Tạo tour mới", sub: "Đăng tour tham quan cho sinh viên", to: "/partner/tours/create", color: "#1E2A38" },
                { icon: "manage_accounts", label: "Quản lý đăng ký", sub: "Duyệt, từ chối, xác nhận thanh toán", to: "/partner/tours", color: "#3C7A5B" },
                { icon: "bar_chart", label: "Xem báo cáo chi tiết", sub: "Thống kê doanh thu và tỷ lệ tham gia", to: "/partner/reports", color: "#4A4F3C" },
                { icon: "qr_code_scanner", label: "Check-in tham quan", sub: "Quét mã QR khi sinh viên đến tham quan", to: "/partner/tours", color: "#4B3A8C" },
              ].map((item) => (
                <Grid item xs={12} sm={6} lg={3} key={item.to + item.label}>
                  <SoftBox
                    component={Link}
                    to={item.to}
                    sx={{
                      p: 2,
                      display: "flex",
                      alignItems: "center",
                      gap: 1.5,
                      textDecoration: "none",
                      border: "2px solid #2b2a27",
                      borderRadius: 0,
                      backgroundColor: "#fff",
                      boxShadow: "4px 4px 0 #2b2a27",
                      minWidth: 0,             /* allow card to shrink */
                      overflow: "hidden",
                      transition: "transform 0.15s, box-shadow 0.15s",
                      "&:hover": {
                        transform: "translate(-2px, -2px)",
                        boxShadow: "6px 6px 0 #2b2a27",
                        backgroundColor: "#f6efdd",
                      },
                      "&:active": { transform: "none", boxShadow: "2px 2px 0 #2b2a27" },
                    }}
                  >
                    <SoftBox
                      sx={{
                        width: 40, height: 40, flexShrink: 0,
                        backgroundColor: item.color,
                        border: "2px solid #2b2a27",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}
                    >
                      <Icon sx={{ color: "#fff", fontSize: "1.2rem" }}>{item.icon}</Icon>
                    </SoftBox>
                    <SoftBox sx={{ flex: 1, minWidth: 0 }}>
                      <SoftTypography
                        variant="button"
                        fontWeight="bold"
                        sx={{ color: "#2b2a27", display: "block", lineHeight: 1.2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
                      >
                        {item.label}
                      </SoftTypography>
                      <SoftTypography
                        variant="caption"
                        sx={{ color: "#7d6b51", fontSize: "0.71rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", display: "block" }}
                      >
                        {item.sub}
                      </SoftTypography>
                    </SoftBox>
                    <Icon sx={{ color: "#d9caa6", ml: "auto", flexShrink: 0, fontSize: "1.1rem" }}>arrow_forward</Icon>
                  </SoftBox>
                </Grid>
              ))}
            </Grid>

          </SoftBox>
        ) : null}
      </SoftBox>
      <Footer />
    </DashboardLayout>
  );
}

export default PartnerDashboard;
