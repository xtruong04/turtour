import PropTypes from "prop-types";

import SoftBox from "components/SoftBox";

// Badge phong cách Neo-Brutalism: khối màu đặc, viền đen, không bo góc —
// dùng cho mọi nhãn trạng thái trong admin (tour, doanh nghiệp, thanh toán...).
function NeoBadge({ label, bgColor, textColor }) {
  return (
    <SoftBox
      component="span"
      sx={{
        display: "inline-flex",
        alignItems: "center",
        px: 1.1,
        py: 0.35,
        backgroundColor: bgColor,
        color: textColor,
        border: "2px solid #2b2a27",
        borderRadius: 0,
        fontSize: "0.7rem",
        fontWeight: 800,
        textTransform: "uppercase",
        letterSpacing: "0.03em",
        lineHeight: 1.5,
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </SoftBox>
  );
}

NeoBadge.propTypes = {
  label: PropTypes.node.isRequired,
  bgColor: PropTypes.string,
  textColor: PropTypes.string,
};

NeoBadge.defaultProps = {
  bgColor: "#8392ab",
  textColor: "#fff",
};

export default NeoBadge;
