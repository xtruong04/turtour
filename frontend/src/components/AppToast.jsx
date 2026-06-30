import PropTypes from "prop-types";

// @mui material components
import Snackbar from "@mui/material/Snackbar";
import Slide from "@mui/material/Slide";
import IconButton from "@mui/material/IconButton";

// @mui icons
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import ErrorRoundedIcon from "@mui/icons-material/ErrorRounded";
import InfoRoundedIcon from "@mui/icons-material/InfoRounded";
import WarningRoundedIcon from "@mui/icons-material/WarningRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";

// Soft UI Dashboard React components
import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";

// Soft UI Dashboard React base styles
import colors from "assets/theme/base/colors";
import borders from "assets/theme/base/borders";

const ICONS = {
  success: CheckCircleRoundedIcon,
  error: ErrorRoundedIcon,
  warning: WarningRoundedIcon,
  info: InfoRoundedIcon,
};

function SlideDown(props) {
  return <Slide {...props} direction="down" />;
}

function AppToast({ open, severity, message, onClose, autoHideDuration }) {
  const accent = colors[severity]?.main || colors.info.main;
  const RawIcon = ICONS[severity] || InfoRoundedIcon;
  // Một số bundler (vd. Vite 8) bọc icon CJS thành { default: Component } thay vì trả component trực tiếp.
  const Icon = RawIcon?.default ?? RawIcon;
  const ResolvedCloseIcon = CloseRoundedIcon?.default ?? CloseRoundedIcon;

  return (
    <Snackbar
      open={open}
      autoHideDuration={autoHideDuration}
      onClose={onClose}
      anchorOrigin={{ vertical: "top", horizontal: "right" }}
      TransitionComponent={SlideDown}
    >
      <SoftBox
        display="flex"
        alignItems="flex-start"
        gap={1.25}
        sx={{
          position: "relative",
          overflow: "hidden",
          minWidth: "320px",
          maxWidth: "380px",
          backgroundColor: colors.white.main,
          borderRadius: `${borders.borderRadius.lg}`,
          borderLeft: `4px solid ${accent}`,
          boxShadow: "0 12px 30px -8px rgba(43, 42, 39, 0.25), 0 2px 6px rgba(43, 42, 39, 0.08)",
          py: 1.5,
          pl: 1.75,
          pr: 1,
        }}
      >
        <SoftBox color={accent} display="flex" mt={0.25}>
          <Icon fontSize="small" />
        </SoftBox>
        <SoftTypography
          variant="button"
          fontWeight="regular"
          color="text"
          sx={{ flex: 1, lineHeight: 1.4, pt: 0.1 }}
        >
          {message}
        </SoftTypography>
        <IconButton size="small" onClick={onClose} sx={{ mt: -0.5, mr: -0.5 }}>
          <ResolvedCloseIcon fontSize="small" sx={{ color: colors.text.main, opacity: 0.5 }} />
        </IconButton>
        <SoftBox
          sx={{
            position: "absolute",
            left: 0,
            bottom: 0,
            height: "2px",
            width: "100%",
            backgroundColor: accent,
            opacity: 0.35,
            transformOrigin: "left",
            animation: open ? `appToastShrink ${autoHideDuration}ms linear forwards` : "none",
            "@keyframes appToastShrink": {
              from: { transform: "scaleX(1)" },
              to: { transform: "scaleX(0)" },
            },
          }}
        />
      </SoftBox>
    </Snackbar>
  );
}

AppToast.propTypes = {
  open: PropTypes.bool.isRequired,
  severity: PropTypes.oneOf(["success", "error", "warning", "info"]),
  message: PropTypes.node,
  onClose: PropTypes.func.isRequired,
  autoHideDuration: PropTypes.number,
};

AppToast.defaultProps = {
  severity: "info",
  message: "",
  autoHideDuration: 5000,
};

export default AppToast;
