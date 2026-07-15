import { useEffect, useState } from "react";

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
import PageLoader from "components/PageLoader";
import NeoBadge from "components/NeoBadge";

import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

import apiService from "../../services/apiService";
import { hideSplash } from "utils/splash";
import realtimeService from "../../services/realtime";

function formatCurrency(value) {
  return Number(value || 0).toLocaleString("vi-VN") + " ₫";
}

// Bảng màu theo chuẩn Bootstrap, đồng bộ với badge trạng thái tour và trang sinh viên.
function statusBadgeColors(status) {
  switch (status) {
    case "Paid": return { bgColor: "#198754", textColor: "#fff" };
    case "Failed": return { bgColor: "#dc3545", textColor: "#fff" };
    case "Refunded": return { bgColor: "#6c757d", textColor: "#fff" };
    default: return { bgColor: "#ffc107", textColor: "#212529" };
  }
}

function statusLabel(status) {
  switch (status) {
    case "Paid": return "Đã thanh toán";
    case "Failed": return "Thất bại";
    case "Refunded": return "Đã hoàn tiền";
    default: return "Chờ thanh toán";
  }
}

function Payments() {
  const [payments, setPayments] = useState([]);
  const [revenue, setRevenue] = useState({ totalRevenue: 0, totalCount: 0 });
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setErrorMessage("");
      try {
        const [paymentList, revenueData] = await Promise.all([
          apiService.getPayments(),
          apiService.getRevenue(),
        ]);
        setPayments(Array.isArray(paymentList) ? paymentList : []);
        setRevenue({
          totalRevenue: revenueData?.totalRevenue || 0,
          totalCount: revenueData?.totalCount || 0,
        });
      } catch (error) {
        setErrorMessage(error?.message || "Không tải được dữ liệu thanh toán.");
      } finally {
        setLoading(false);
        hideSplash();
      }
    }

    fetchData();
  }, [refreshToken]);

  // Tự refresh khi có thanh toán mới được xác nhận (webhook SePay, admin xác nhận thủ công...)
  // — không cần F5 thủ công.
  useEffect(() => {
    const unsubscribe = realtimeService.onAdminBoardUpdated(() => {
      setRefreshToken((value) => value + 1);
    });
    return unsubscribe;
  }, []);

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <SoftBox py={3}>
        <Grid container spacing={3} mb={1}>
          <Grid item xs={12} md={6}>
            <Card>
              <SoftBox p={3} display="flex" justifyContent="space-between" alignItems="center">
                <div>
                  <SoftTypography variant="button" color="text" fontWeight="medium">Tổng doanh thu</SoftTypography>
                  <SoftTypography variant="h4" fontWeight="bold">{formatCurrency(revenue.totalRevenue)}</SoftTypography>
                </div>
              </SoftBox>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <SoftBox p={3} display="flex" justifyContent="space-between" alignItems="center">
                <div>
                  <SoftTypography variant="button" color="text" fontWeight="medium">Số giao dịch đã thanh toán</SoftTypography>
                  <SoftTypography variant="h4" fontWeight="bold">{revenue.totalCount}</SoftTypography>
                </div>
              </SoftBox>
            </Card>
          </Grid>
        </Grid>

        <Card>
          <SoftBox p={3}>
            <SoftBox mb={2}>
              <SoftTypography variant="h5" fontWeight="bold">Lịch sử thanh toán</SoftTypography>
              <SoftTypography variant="button" color="text">Toàn bộ giao dịch thanh toán đã ghi nhận trên hệ thống.</SoftTypography>
            </SoftBox>

            {loading ? <PageLoader label="Đang tải dữ liệu thanh toán..." /> : null}
            {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}

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
                    <col style={{ width: "24%" }} />
                    <col style={{ width: "14%" }} />
                    <col style={{ width: "16%" }} />
                    <col style={{ width: "16%" }} />
                    <col style={{ width: "14%" }} />
                    <col style={{ width: "16%" }} />
                  </colgroup>
                  <TableHead sx={{ display: "table-header-group" }}>
                    <TableRow>
                      <TableCell>Tour</TableCell>
                      <TableCell>Số tiền</TableCell>
                      <TableCell>Phương thức</TableCell>
                      <TableCell>Mã giao dịch</TableCell>
                      <TableCell>Trạng thái</TableCell>
                      <TableCell>Thời gian</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {payments.map((payment) => (
                      <TableRow key={payment.id} hover>
                        <TableCell title={payment.tourName}>{payment.tourName || "-"}</TableCell>
                        <TableCell>{formatCurrency(payment.amount)}</TableCell>
                        <TableCell title={payment.paymentMethod}>{payment.paymentMethod || "-"}</TableCell>
                        <TableCell title={payment.transactionCode}>{payment.transactionCode || "-"}</TableCell>
                        <TableCell>
                          <NeoBadge label={statusLabel(payment.paymentStatus)} {...statusBadgeColors(payment.paymentStatus)} />
                        </TableCell>
                        <TableCell>{payment.paidAt ? new Date(payment.paidAt).toLocaleString("vi-VN") : "-"}</TableCell>
                      </TableRow>
                    ))}
                    {payments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6}>
                          <SoftTypography variant="button" color="text">Chưa có giao dịch thanh toán nào.</SoftTypography>
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

export default Payments;
