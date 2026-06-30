import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import Alert from "@mui/material/Alert";
import Grid from "@mui/material/Grid";

import SoftBox from "components/SoftBox";
import SoftButton from "components/SoftButton";
import SoftTypography from "components/SoftTypography";
import PageLoader from "components/PageLoader";
import NeoStatCard from "components/NeoStatCard";

import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

import apiService from "../../../services/apiService";

function formatCurrency(value) {
  return Number(value || 0).toLocaleString("vi-VN") + " ₫";
}

function PartnerDashboard() {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const session = apiService.getAuthSession();
  const roleLabel = (session?.roles || []).includes("Company") ? "doanh nghiệp" : "người tổ chức";

  useEffect(() => {
    async function fetchOverview() {
      setLoading(true);
      setErrorMessage("");
      try {
        const data = await apiService.getPartnerOverview();
        setOverview(data);
      } catch (error) {
        setErrorMessage(error?.message || "Không tải được số liệu tổng quan.");
      } finally {
        setLoading(false);
      }
    }

    fetchOverview();
  }, []);

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <SoftBox py={3}>
        <SoftBox mb={3} display="flex" justifyContent="space-between" alignItems="center" gap={1} flexWrap="wrap">
          <div>
            <SoftTypography variant="h5" fontWeight="bold">
              Dashboard {roleLabel}
            </SoftTypography>
            <SoftTypography variant="button" color="text">
              Tổng quan tour và đăng ký của riêng bạn.
            </SoftTypography>
          </div>
          <SoftBox display="flex" gap={1}>
            <SoftButton component={Link} to="/partner/reports" variant="outlined" color="dark">
              Báo cáo
            </SoftButton>
            <SoftButton component={Link} to="/partner/tours" variant="outlined" color="dark">
              Tour của tôi
            </SoftButton>
            <SoftButton component={Link} to="/partner/tours/create" variant="gradient" color="info">
              Tạo tour mới
            </SoftButton>
          </SoftBox>
        </SoftBox>

        {loading ? <PageLoader label="Đang tải số liệu tổng quan..." /> : null}
        {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}

        {!loading && !errorMessage ? (
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
                title="Đang chờ duyệt"
                count={overview?.pendingApprovalCount ?? 0}
                icon="hourglass_top"
                bgColor="#A18F7A"
                textColor="#fff"
              />
            </Grid>
            <Grid item xs={12} sm={6} xl={3}>
              <NeoStatCard
                title="Đang mở đăng ký"
                count={overview?.openCount ?? 0}
                icon="event_available"
                bgColor="#3C7A5B"
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
        ) : null}
      </SoftBox>
      <Footer />
    </DashboardLayout>
  );
}

export default PartnerDashboard;
