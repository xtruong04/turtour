import { useEffect, useRef } from "react";
import PropTypes from "prop-types";

import { Html5Qrcode } from "html5-qrcode";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";

const SCANNER_ELEMENT_ID = "qr-camera-scanner-viewport";

function QrCameraScanner({ onScan, onError, active }) {
  const scannerRef = useRef(null);
  const hasScannedRef = useRef(false);

  useEffect(() => {
    if (!active) {
      return undefined;
    }

    hasScannedRef.current = false;
    const html5QrCode = new Html5Qrcode(SCANNER_ELEMENT_ID);
    scannerRef.current = html5QrCode;

    html5QrCode
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 240 },
        (decodedText) => {
          if (hasScannedRef.current) {
            return;
          }
          hasScannedRef.current = true;
          onScan(decodedText);
        },
        () => {
          // Lỗi giải mã từng khung hình — bỏ qua, đây là điều bình thường khi chưa thấy mã QR.
        }
      )
      .catch((error) => {
        onError?.(error?.message || "Không thể mở camera. Vui lòng cấp quyền truy cập camera.");
      });

    return () => {
      html5QrCode
        .stop()
        .then(() => html5QrCode.clear())
        .catch(() => {
          // camera có thể đã dừng trước đó, bỏ qua lỗi dọn dẹp
        });
    };
  }, [active, onScan, onError]);

  return (
    <SoftBox>
      <SoftBox
        id={SCANNER_ELEMENT_ID}
        sx={{
          width: "100%",
          minHeight: 280,
          borderRadius: "0.75rem",
          overflow: "hidden",
          backgroundColor: "#111827",
          "& video": { width: "100% !important" },
        }}
      />
      <SoftTypography variant="caption" color="text" display="block" mt={1} textAlign="center">
        Hướng camera vào mã QR check-in của sinh viên.
      </SoftTypography>
    </SoftBox>
  );
}

QrCameraScanner.propTypes = {
  onScan: PropTypes.func.isRequired,
  onError: PropTypes.func,
  active: PropTypes.bool,
};

QrCameraScanner.defaultProps = {
  onError: undefined,
  active: true,
};

export default QrCameraScanner;
