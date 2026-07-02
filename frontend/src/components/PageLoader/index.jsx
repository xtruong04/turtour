import PropTypes from "prop-types";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";

const LOTTIE_URL =
  "https://lottie.host/3ff9baf3-3e77-4906-a454-ccb295313a7f/Ms4tMee3Lz.lottie";

function PageLoader({ label, minHeight, size }) {
  return (
    <SoftBox
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      sx={{ minHeight, width: "100%" }}
    >
      <DotLottieReact
        src={LOTTIE_URL}
        loop
        autoplay
        style={{ width: size, height: size }}
      />
      {label ? (
        <SoftTypography
          variant="button"
          fontWeight="medium"
          sx={{ color: "#7d6b51", mt: -1 }}
        >
          {label}
        </SoftTypography>
      ) : null}
    </SoftBox>
  );
}

PageLoader.propTypes = {
  label: PropTypes.string,
  minHeight: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  size: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

PageLoader.defaultProps = {
  label: "Đang tải...",
  minHeight: "220px",
  size: 120,
};

export default PageLoader;
