import { Link } from "react-router-dom";

import Card from "@mui/material/Card";
import Icon from "@mui/material/Icon";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftButton from "components/SoftButton";

// Trang 403 dùng phong cách Neo-Brutalism (khối màu đặc, viền đen 2px, không bo góc)
// thay vì màn hình lỗi chung chung của Material/Soft UI.
function Forbidden403() {
  return (
    <SoftBox
      display="flex"
      alignItems="center"
      justifyContent="center"
      p={3}
      sx={{
        backgroundColor: "#f4f1ec",
        position: "fixed",
        inset: 0,
        zIndex: 1300,
      }}
    >
        <Card sx={{ maxWidth: 560, width: "100%", borderRadius: 0, border: "3px solid #2b2a27", boxShadow: "8px 8px 0 #2b2a27" }}>
          <SoftBox p={4} textAlign="center">
            <SoftBox
              display="inline-flex"
              alignItems="center"
              justifyContent="center"
              width={88}
              height={88}
              mb={3}
              sx={{ backgroundColor: "#dc3545", border: "2px solid #2b2a27" }}
            >
              <Icon sx={{ fontSize: 48, color: "#fff" }}>block</Icon>
            </SoftBox>

            <SoftTypography
              variant="h1"
              fontWeight="bold"
              sx={{ fontSize: "4rem", letterSpacing: "-0.02em", lineHeight: 1 }}
            >
              403
            </SoftTypography>

            <SoftBox mt={1} mb={2}>
              <SoftTypography variant="h5" fontWeight="bold" textTransform="uppercase">
                Không có quyền truy cập
              </SoftTypography>
            </SoftBox>

            <SoftTypography variant="button" color="text" fontWeight="regular">
              Tài khoản của bạn không có quyền sử dụng chức năng này. Nếu cho rằng đây là
              nhầm lẫn, hãy liên hệ quản trị viên để được cấp quyền.
            </SoftTypography>

            <SoftBox mt={4}>
              <SoftButton
                component={Link}
                to="/"
                variant="gradient"
                color="dark"
                sx={{
                  borderRadius: 0,
                  border: "2px solid #2b2a27",
                  boxShadow: "4px 4px 0 #2b2a27",
                  transition: "transform 0.12s ease, box-shadow 0.12s ease",
                  "&:hover": {
                    transform: "translate(2px, 2px)",
                    boxShadow: "2px 2px 0 #2b2a27",
                  },
                }}
              >
                Về trang chủ
              </SoftButton>
            </SoftBox>
          </SoftBox>
        </Card>
    </SoftBox>
  );
}

export default Forbidden403;
