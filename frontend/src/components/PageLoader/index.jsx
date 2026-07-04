import { useEffect, useRef } from "react";
import PropTypes from "prop-types";
import lottie from "lottie-web";
import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";

function PageLoader({ label, minHeight, size }) {
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

  return (
    <SoftBox
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      sx={{ minHeight, width: "100%" }}
    >
      <div ref={containerRef} style={{ width: size, height: size }} />
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
