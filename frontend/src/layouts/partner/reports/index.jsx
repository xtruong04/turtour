import { useEffect, useMemo, useState } from "react";

import Alert from "@mui/material/Alert";
import Card from "@mui/material/Card";
import Grid from "@mui/material/Grid";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftInput from "components/SoftInput";
import SoftButton from "components/SoftButton";
import PageLoader from "components/PageLoader";
import NeoBadge from "components/NeoBadge";
import NeoDropdown from "components/NeoDropdown";

import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import ReportsBarChart from "examples/Charts/BarCharts/ReportsBarChart";

import apiService from "../../../services/apiService";

const statusOptions = [
  { value: "", label: "Tất cả trạng thái" },
  { value: "Pending", label: "Chờ duyệt" },
  { value: "Rejected", label: "Bị từ chối" },
  { value: "Published", label: "Mở đăng ký" },
  { value: "Expired", label: "Đã đóng" },
  { value: "Archived", label: "Đã hủy/Lưu trữ" },
];

// Bảng màu theo chuẩn Bootstrap, đồng bộ với badge trạng thái ở trang Tours và trang sinh viên.
const tourStatusColors = {
  Pending: { bgColor: "#A18F7A", textColor: "#fff" },
  Rejected: { bgColor: "#dc3545", textColor: "#fff" },
  Published: { bgColor: "#198754", textColor: "#fff" },
  Expired: { bgColor: "#ffc107", textColor: "#212529" },
  Archived: { bgColor: "#6c757d", textColor: "#fff" },
};

// Tổng hợp ApprovalStatus + PublishStatus thành 1 badge — Pending/Rejected luôn "thắng",
// PublishStatus chỉ có nghĩa khi tour đã Approved (xem ToursController.ComputeEffectivePublishStatus).
function getRowStatusKey(row) {
  if (row.approvalStatus === "Pending" || row.approvalStatus === "Rejected") {
    return row.approvalStatus;
  }
  return row.publishStatus || "Hidden";
}

function tourStatusLabel(status) {
  return statusOptions.find((option) => option.value === status)?.label || status || "-";
}

function formatCurrency(value) {
  return Number(value || 0).toLocaleString("vi-VN") + " ₫";
}

function formatMonthLabel(month) {
  if (!month) return "";
  const [year, m] = month.split("-");
  return `Tháng ${m}/${year}`;
}

function PartnerReports() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    async function fetchReport() {
      setLoading(true);
      setErrorMessage("");
      try {
        const data = await apiService.getPartnerReports();
        setReport(data);
      } catch (error) {
        setErrorMessage(error?.message || "Không tải được dữ liệu báo cáo.");
      } finally {
        setLoading(false);
      }
    }

    fetchReport();
  }, []);

  const toursReport = useMemo(() => report?.toursReport || [], [report]);

  const filteredTours = useMemo(() => {
    const term = search.trim().toLowerCase();
    const from = dateFrom ? new Date(dateFrom) : null;
    const to = dateTo ? new Date(dateTo) : null;

    return toursReport.filter((row) => {
      if (term) {
        const haystack = `${row.title} ${row.code} ${row.companyName}`.toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      if (statusFilter && getRowStatusKey(row) !== statusFilter) return false;
      if (from && new Date(row.startDate) < from) return false;
      if (to && new Date(row.startDate) > to) return false;
      return true;
    });
  }, [toursReport, search, statusFilter, dateFrom, dateTo]);

  const totals = useMemo(() => {
    return filteredTours.reduce(
      (acc, row) => ({
        registrations: acc.registrations + row.totalRegistrations,
        revenue: acc.revenue + row.revenue,
        completed: acc.completed + row.completedCount,
      }),
      { registrations: 0, revenue: 0, completed: 0 }
    );
  }, [filteredTours]);

  const avgParticipationRate = totals.registrations === 0
    ? 0
    : (totals.completed / totals.registrations) * 100;

  const revenueByMonth = report?.revenueByMonth || [];
  const revenueByCompany = report?.revenueByCompany || [];

  const monthChart = {
    labels: revenueByMonth.length > 0 ? revenueByMonth.map((m) => formatMonthLabel(m.month)) : ["Chưa có dữ liệu"],
    datasets: {
      label: "Doanh thu",
      data: revenueByMonth.length > 0 ? revenueByMonth.map((m) => m.totalAmount) : [0],
    },
  };

  const companyChart = {
    labels: revenueByCompany.length > 0 ? revenueByCompany.map((c) => c.companyName) : ["Chưa có dữ liệu"],
    datasets: {
      label: "Doanh thu",
      data: revenueByCompany.length > 0 ? revenueByCompany.map((c) => c.revenue) : [0],
    },
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <SoftBox py={3}>
        <SoftBox mb={2}>
          <SoftTypography variant="h5" fontWeight="bold">Báo cáo & Thống kê</SoftTypography>
          <SoftTypography variant="button" color="text">Tổng hợp tình hình tổ chức tour, tham gia và thu phí của riêng bạn.</SoftTypography>
        </SoftBox>

        {loading ? <PageLoader label="Đang tải dữ liệu báo cáo..." /> : null}
        {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}

        {!loading && !errorMessage ? (
          <>
            <Card sx={{ p: 3, mb: 3 }}>
              <Grid container spacing={2} alignItems="flex-end">
                <Grid item xs={12} md={4}>
                  <SoftTypography variant="caption" fontWeight="bold">Tìm kiếm</SoftTypography>
                  <SoftInput
                    placeholder="Tìm theo tên tour, mã tour, doanh nghiệp..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={2.5}>
                  <SoftTypography variant="caption" fontWeight="bold">Trạng thái</SoftTypography>
                  <NeoDropdown
                    value={statusFilter}
                    options={statusOptions.map((option) => ({ value: option.value, label: option.label }))}
                    onChange={setStatusFilter}
                  />
                </Grid>
                <Grid item xs={6} sm={3} md={1.75}>
                  <SoftTypography variant="caption" fontWeight="bold">Từ ngày</SoftTypography>
                  <SoftInput type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                </Grid>
                <Grid item xs={6} sm={3} md={1.75}>
                  <SoftTypography variant="caption" fontWeight="bold">Đến ngày</SoftTypography>
                  <SoftInput type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                </Grid>
                <Grid item xs={12} md={2}>
                  <SoftButton
                    variant="outlined"
                    color="error"
                    fullWidth
                    onClick={() => {
                      setSearch("");
                      setStatusFilter("");
                      setDateFrom("");
                      setDateTo("");
                    }}
                  >
                    Xóa lọc
                  </SoftButton>
                </Grid>
              </Grid>
            </Card>

            <Grid container spacing={3} mb={3}>
              <Grid item xs={12} sm={4}>
                <Card sx={{ p: 2.5 }}>
                  <SoftTypography variant="button" color="text">Số tour trong kết quả</SoftTypography>
                  <SoftTypography variant="h4" fontWeight="bold">{filteredTours.length}</SoftTypography>
                </Card>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Card sx={{ p: 2.5 }}>
                  <SoftTypography variant="button" color="text">Tổng doanh thu</SoftTypography>
                  <SoftTypography variant="h4" fontWeight="bold" color="success">{formatCurrency(totals.revenue)}</SoftTypography>
                </Card>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Card sx={{ p: 2.5 }}>
                  <SoftTypography variant="button" color="text">Tỷ lệ tham gia thực tế</SoftTypography>
                  <SoftTypography variant="h4" fontWeight="bold" color="info">{avgParticipationRate.toFixed(1)}%</SoftTypography>
                </Card>
              </Grid>
            </Grid>

            <Grid container spacing={3} mb={3}>
              <Grid item xs={12} lg={6}>
                <ReportsBarChart
                  color="info"
                  title="Doanh thu theo thời gian"
                  description="Tổng tiền đã thu theo từng tháng"
                  chart={monthChart}
                />
              </Grid>
              <Grid item xs={12} lg={6}>
                <ReportsBarChart
                  color="success"
                  title="Doanh thu theo doanh nghiệp"
                  description="Tổng tiền đã thu theo từng doanh nghiệp"
                  chart={companyChart}
                />
              </Grid>
            </Grid>

            <Card>
              <SoftBox p={3}>
                <SoftTypography variant="h6" fontWeight="bold" mb={2}>Chi tiết theo tour</SoftTypography>
                <TableContainer sx={{ overflowX: "auto" }}>
                  <Table
                    size="small"
                    sx={{
                      tableLayout: "fixed",
                      minWidth: 1000,
                      "& th": { fontSize: "0.75rem", fontWeight: 700, color: "#344767", whiteSpace: "nowrap", py: 1.5 },
                      "& td": { fontSize: "0.875rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", py: 1.25 },
                    }}
                  >
                    <colgroup>
                      <col style={{ width: "9%" }} />
                      <col style={{ width: "20%" }} />
                      <col style={{ width: "16%" }} />
                      <col style={{ width: "10%" }} />
                      <col style={{ width: "9%" }} />
                      <col style={{ width: "9%" }} />
                      <col style={{ width: "9%" }} />
                      <col style={{ width: "9%" }} />
                      <col style={{ width: "9%" }} />
                    </colgroup>
                    <TableHead sx={{ display: "table-header-group" }}>
                      <TableRow>
                        <TableCell>Mã</TableCell>
                        <TableCell>Tên tour</TableCell>
                        <TableCell>Doanh nghiệp</TableCell>
                        <TableCell>Trạng thái</TableCell>
                        <TableCell align="center">Đăng ký</TableCell>
                        <TableCell align="center">Đã duyệt</TableCell>
                        <TableCell align="center">Đã thanh toán</TableCell>
                        <TableCell align="center">Tỷ lệ tham gia</TableCell>
                        <TableCell align="center">Doanh thu</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredTours.map((row) => (
                        <TableRow key={row.tourId} hover>
                          <TableCell title={row.code}>{row.code || "-"}</TableCell>
                          <TableCell title={row.title}>{row.title || "-"}</TableCell>
                          <TableCell title={row.companyName}>{row.companyName || "-"}</TableCell>
                          <TableCell>
                            <NeoBadge label={tourStatusLabel(getRowStatusKey(row))} {...(tourStatusColors[getRowStatusKey(row)] || {})} />
                          </TableCell>
                          <TableCell align="center">{row.totalRegistrations} / {row.maxParticipants}</TableCell>
                          <TableCell align="center">{row.approvedCount}</TableCell>
                          <TableCell align="center">{row.paidCount}</TableCell>
                          <TableCell align="center">{row.participationRate}%</TableCell>
                          <TableCell align="center">{formatCurrency(row.revenue)}</TableCell>
                        </TableRow>
                      ))}
                      {filteredTours.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={9}>
                            <SoftTypography variant="button" color="text">Không có tour phù hợp với bộ lọc.</SoftTypography>
                          </TableCell>
                        </TableRow>
                      ) : null}
                    </TableBody>
                  </Table>
                </TableContainer>
              </SoftBox>
            </Card>
          </>
        ) : null}
      </SoftBox>
      <Footer />
    </DashboardLayout>
  );
}

export default PartnerReports;
