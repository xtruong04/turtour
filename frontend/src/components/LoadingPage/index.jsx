import { useEffect, useRef } from "react";
import PropTypes from "prop-types";
import lottie from "lottie-web";
import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";

function LoadingPage({ message, overlay }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const anim = lottie.loadAnimation({
      container: containerRef.current,
      renderer: "svg",
      loop: true,
      autoplay: true,
      path: "/running-cat.json",
    });
    return () => anim.destroy();
  }, []);

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

      <div ref={containerRef} style={{ width: 200, height: 200 }} />

      <SoftTypography
        variant="button"
        fontWeight="medium"
        sx={{ color: "#7d6b51", mt: -1.5, letterSpacing: "0.01em" }}
      >
        {message}
      </SoftTypography>

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
