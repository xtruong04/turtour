import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import Alert from "@mui/material/Alert";
import Card from "@mui/material/Card";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftButton from "components/SoftButton";
import PageLoader from "components/PageLoader";

import BasicLayout from "layouts/authentication/components/BasicLayout";

import apiService from "../../../services/apiService";

import curved6 from "assets/images/curved-images/curved14.jpg";

function ConfirmEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function confirm() {
      if (!token) {
        setMessage("Thiếu token xác thực trong đường dẫn.");
        setLoading(false);
        return;
      }

      try {
        const result = await apiService.confirmEmail(token);
        setSuccess(true);
        setMessage(result?.message || "Xác thực email thành công.");
      } catch (error) {
        setMessage(error?.message || "Xác thực email thất bại.");
      } finally {
        setLoading(false);
      }
    }

    confirm();
  }, [token]);

  return (
    <BasicLayout title="Xác thực email" description="" image={curved6}>
      <Card>
        <SoftBox p={4} textAlign="center">
          {loading ? (
            <PageLoader label="Đang xác thực email..." />
          ) : (
            <>
              <SoftTypography variant="h5" fontWeight="medium" mb={2}>
                {success ? "Xác thực thành công" : "Xác thực thất bại"}
              </SoftTypography>
              <Alert severity={success ? "success" : "error"}>{message}</Alert>
              <SoftBox mt={3}>
                <SoftButton component={Link} to="/auth/sign-in" variant="gradient" color="dark" fullWidth>
                  Về trang đăng nhập
                </SoftButton>
              </SoftBox>
            </>
          )}
        </SoftBox>
      </Card>
    </BasicLayout>
  );
}

export default ConfirmEmail;
