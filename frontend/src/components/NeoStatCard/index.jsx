import PropTypes from "prop-types";

import Icon from "@mui/material/Icon";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";

// Thẻ thống kê phong cách Neo-Brutalism: viền đen dày, không bo góc, đổ bóng
// offset cứng (không blur), màu nền rực rỡ riêng cho từng thẻ.
function NeoStatCard({ title, count, icon, bgColor, textColor }) {
  return (
    <SoftBox
      sx={{
        backgroundColor: bgColor,
        border: "3px solid #2b2a27",
        borderRadius: 0,
        boxShadow: "6px 6px 0 #2b2a27",
        p: 2.5,
        height: "100%",
        transition: "transform 0.15s ease, box-shadow 0.15s ease",
        cursor: "default",
        "&:hover": {
          transform: "translate(-2px, -2px)",
          boxShadow: "8px 8px 0 #2b2a27",
        },
        "&:active": {
          transform: "translate(0px, 0px)",
          boxShadow: "3px 3px 0 #2b2a27",
        },
      }}
    >
      <SoftBox display="flex" alignItems="center" justifyContent="space-between" mb={1.5}>
        <SoftTypography
          variant="caption"
          fontWeight="bold"
          textTransform="uppercase"
          letterSpacing={0.5}
          sx={{ color: textColor, opacity: 0.85 }}
        >
          {title}
        </SoftTypography>
        <SoftBox
          sx={{
            width: 38,
            height: 38,
            border: `2px solid ${textColor}`,
            borderRadius: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Icon fontSize="small" sx={{ color: textColor }}>
            {icon}
          </Icon>
        </SoftBox>
      </SoftBox>
      <SoftTypography variant="h3" fontWeight="bold" sx={{ color: textColor }}>
        {count}
      </SoftTypography>
    </SoftBox>
  );
}

NeoStatCard.propTypes = {
  title: PropTypes.string.isRequired,
  count: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  icon: PropTypes.node.isRequired,
  bgColor: PropTypes.string.isRequired,
  textColor: PropTypes.string,
};

NeoStatCard.defaultProps = {
  textColor: "#fff",
};

export default NeoStatCard;
