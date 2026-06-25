import PropTypes from "prop-types";

import CircularProgress from "@mui/material/CircularProgress";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";

function PageLoader({ label, minHeight }) {
  return (
    <SoftBox
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      gap={1.5}
      sx={{ minHeight, width: "100%" }}
    >
      <CircularProgress color="info" size={42} thickness={4} />
      <SoftTypography variant="button" color="text" fontWeight="medium">
        {label}
      </SoftTypography>
    </SoftBox>
  );
}

PageLoader.propTypes = {
  label: PropTypes.string,
  minHeight: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

PageLoader.defaultProps = {
  label: "Đang tải dữ liệu...",
  minHeight: "240px",
};

export default PageLoader;
