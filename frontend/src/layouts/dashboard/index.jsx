import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import Alert from "@mui/material/Alert";
import Grid from "@mui/material/Grid";

import SoftBox from "components/SoftBox";
import SoftButton from "components/SoftButton";
import SoftTypography from "components/SoftTypography";
import PageLoader from "components/PageLoader";

import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import NeoStatCard from "components/NeoStatCard";
import ReportsBarChart from "examples/Charts/BarCharts/ReportsBarChart";

import apiService from "../../services/apiService";

function formatCurrency(value) {
  return Number(value || 0).toLocaleString("vi-VN") + " ₫";
}

function Dashboard() {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function fetchOverview() {
      setLoading(true);
      setErrorMessage("");
      try {
        const data = await apiService.getDashboardOverview();
        setOverview(data);
      } catch (error) {
        setErrorMessage(error?.message || "Không tải được số liệu tổng quan.");
      } finally {
        setLoading(false);
      }
    }

    fetchOverview();
  }, []);

  const topCompanies = overview?.topCompanies || [];
  const completionRate = Number(overview?.completionRate || 0);

  const chart = {
    labels: topCompanies.length > 0 ? topCompanies.map((c) => c.companyName) : ["Chưa có dữ liệu"],
    datasets: {
      label: "Lượt đăng ký",
      data: topCompanies.length > 0 ? topCompanies.map((c) => c.interestedCount) : [0],
    },
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <SoftBox py={3}>
        <SoftBox mb={3} display="flex" justifyContent="flex-end">
          <SoftButton component={Link} to="/admin/tours" variant="gradient" color="info">
            Quản lý Tour
          </SoftButton>
        </SoftBox>

        {loading ? <PageLoader label="Đang tải số liệu tổng quan..." /> : null}
        {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}

        {!loading && !errorMessage ? (
          <>
            <SoftBox mb={3}>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6} xl={3}>
                  <NeoStatCard
                    title="Tổng số tour"
                    count={overview?.totalTours ?? 0}
                    icon="airplanemode_active"
                    bgColor="#1E2A38"
                    textColor="#fff"
                  />
                </Grid>
                <Grid item xs={12} sm={6} xl={3}>
                  <NeoStatCard
                    title="Tổng sinh viên"
                    count={overview?.totalStudents ?? 0}
                    icon="groups"
                    bgColor="#7A5B48"
                    textColor="#fff"
                  />
                </Grid>
                <Grid item xs={12} sm={6} xl={3}>
                  <NeoStatCard
                    title="Tổng lượt đăng ký"
                    count={overview?.totalRegistrations ?? 0}
                    icon="fact_check"
                    bgColor="#B35F45"
                    textColor="#fff"
                  />
                </Grid>
                <Grid item xs={12} sm={6} xl={3}>
                  <NeoStatCard
                    title="Doanh thu đã thu"
                    count={formatCurrency(overview?.totalRevenue)}
                    icon="payments"
                    bgColor="#4A4F3C"
                    textColor="#fff"
                  />
                </Grid>
              </Grid>
            </SoftBox>

            <Grid container spacing={3}>
              <Grid item xs={12} lg={7}>
                <ReportsBarChart
                  color="info"
                  title="Doanh nghiệp được quan tâm nhiều nhất"
                  description="Xếp theo số lượt sinh viên đăng ký tour của từng doanh nghiệp"
                  chart={chart}
                />
              </Grid>
              <Grid item xs={12} lg={5}>
                <SoftBox
                  sx={{
                    height: "100%",
                    backgroundColor: "#fff",
                    border: "3px solid #2b2a27",
                    borderRadius: 0,
                    boxShadow: "6px 6px 0 #2b2a27",
                    p: 3,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                  }}
                >
                  <SoftTypography variant="caption" fontWeight="bold" textTransform="uppercase" letterSpacing={0.5} mb={1}>
                    Tỷ lệ hoàn thành đăng ký
                  </SoftTypography>
                  <SoftTypography variant="h2" fontWeight="bold" sx={{ color: "#1E2A38" }}>
                    {completionRate.toFixed(1)}%
                  </SoftTypography>
                  <SoftTypography variant="button" color="text">
                    {overview?.completedRegistrations ?? 0} / {overview?.totalRegistrations ?? 0} lượt đăng ký đã hoàn thành chuyến đi
                  </SoftTypography>
                </SoftBox>
              </Grid>
            </Grid>
          </>
        ) : null}
      </SoftBox>
      <Footer />
    </DashboardLayout>
  );
}

export default Dashboard;
