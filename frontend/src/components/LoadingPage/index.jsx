/**
 * LoadingPage — full-screen loading overlay with Lottie animation.
 * Use this for route-level loading, initial auth check, or any full-page transition.
 *
 * Usage:
 *   if (appLoading) return <LoadingPage />;
 *   if (appLoading) return <LoadingPage message="Đang xác thực tài khoản..." />;
 */

import PropTypes from "prop-types";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";

const LOTTIE_URL =
  "https://lottie.host/3ff9baf3-3e77-4906-a454-ccb295313a7f/Ms4tMee3Lz.lottie";

function LoadingPage({ message, overlay }) {
  const containerSx = overlay
    ? {
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        backgroundColor: "#f2e6c9",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }
    : {
        minHeight: "100dvh",
        width: "100%",
        backgroundColor: "#f2e6c9",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      };

  return (
    <SoftBox sx={containerSx}>
      {/* Brand wordmark */}
      <SoftTypography
        variant="h4"
        fontWeight="bold"
        sx={{
          color: "#2b2a27",
          letterSpacing: "-0.02em",
          mb: 1,
          fontFamily: "'Poppins', sans-serif",
        }}
      >
        TurTour
      </SoftTypography>

      {/* Lottie */}
      <DotLottieReact
        src={LOTTIE_URL}
        loop
        autoplay
        style={{ width: 200, height: 200 }}
      />

      {/* Message */}
      <SoftTypography
        variant="button"
        fontWeight="medium"
        sx={{ color: "#7d6b51", mt: -1.5, letterSpacing: "0.01em" }}
      >
        {message}
      </SoftTypography>

      {/* Neo-Brutalism bottom accent bar */}
      <SoftBox
        sx={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 5,
          background: "linear-gradient(90deg, #b5281f, #2b2a27)",
        }}
      />
    </SoftBox>
  );
}

LoadingPage.propTypes = {
  message: PropTypes.string,
  overlay: PropTypes.bool,
};
LoadingPage.defaultProps = {
  message: "Đang tải...",
  overlay: false,
};

export default LoadingPage;
