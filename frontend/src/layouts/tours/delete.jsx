import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import Alert from "@mui/material/Alert";
import Card from "@mui/material/Card";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftButton from "components/SoftButton";
import PageLoader from "components/PageLoader";

import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

import apiService from "../../services/apiService";
import useTourBasePath from "../../hooks/useTourBasePath";

function TourDelete() {
  const { id } = useParams();
  const navigate = useNavigate();
  const base = useTourBasePath();

  const [tour, setTour] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function fetchTour() {
      setLoading(true);
      setErrorMessage("");

      try {
        const data = await apiService.getTourById(id);
        setTour(data);
      } catch (error) {
        setErrorMessage(error?.message || "Không tải được thông tin tour.");
      } finally {
        setLoading(false);
      }
    }

    fetchTour();
  }, [id]);

  const handleDelete = async () => {
    setSubmitting(true);
    setErrorMessage("");

    try {
      await apiService.deleteTour(id);
      navigate(`${base}/tours`, { replace: true });
    } catch (error) {
      setErrorMessage(error?.message || "Xóa tour thất bại.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <SoftBox py={3}>
        <Card>
          <SoftBox p={3}>
            <SoftTypography variant="h5" fontWeight="bold">Xóa Tour</SoftTypography>
            <SoftTypography variant="button" color="text">Bạn có chắc chắn muốn xóa tour này không?</SoftTypography>

            {loading ? <PageLoader label="Đang tải dữ liệu tour..." /> : null}
            {errorMessage ? <SoftBox mt={2}><Alert severity="error">{errorMessage}</Alert></SoftBox> : null}

            {tour ? (
              <SoftBox mt={2}>
                <SoftTypography variant="caption" fontWeight="bold">Mã tour</SoftTypography>
                <SoftTypography variant="body2">{tour.code}</SoftTypography>
                <SoftTypography variant="caption" fontWeight="bold">Tên tour</SoftTypography>
                <SoftTypography variant="body2">{tour.title}</SoftTypography>
                <SoftTypography variant="caption" fontWeight="bold">Doanh nghiệp</SoftTypography>
                <SoftTypography variant="body2">{tour.companyName || "-"}</SoftTypography>
              </SoftBox>
            ) : null}

            <SoftBox mt={3} display="flex" justifyContent="flex-end" gap={1}>
              <SoftButton component={Link} to={tour ? `${base}/tours/${tour.id}` : `${base}/tours`} variant="outlined" color="dark">
                Hủy
              </SoftButton>
              <SoftButton variant="gradient" color="error" onClick={handleDelete} disabled={submitting || loading || !tour}>
                {submitting ? "Đang xóa..." : "Xác nhận xóa"}
              </SoftButton>
            </SoftBox>
          </SoftBox>
        </Card>
      </SoftBox>
      <Footer />
    </DashboardLayout>
  );
}

export default TourDelete;
