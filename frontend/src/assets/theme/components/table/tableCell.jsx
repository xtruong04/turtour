/**
=========================================================
* Soft UI Dashboard React - v3.1.0
=========================================================

* Product Page: https://www.creative-tim.com/product/soft-ui-dashboard-pro-react
* Copyright 2023 Creative Tim (https://www.creative-tim.com)

Coded by www.creative-tim.com

 =========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
*/

// Soft UI Dashboard React base styles
import colors from "assets/theme/base/colors";

// Soft UI Dashboard React helper functions
import pxToRem from "assets/theme/functions/pxToRem";

const { black } = colors;

// Neo-Brutalism: dòng tiêu đề bảng in hoa đậm + viền đáy đen dày, các dòng dữ liệu
// có hàng kẻ đen mảnh hơn — tách bạch tiêu đề/dữ liệu rõ ràng thay vì viền mờ xám.
const tableCell = {
  styleOverrides: {
    root: ({ ownerState }) => {
      const isHead = ownerState?.variant === "head";

      return {
        padding: `${pxToRem(12)} ${pxToRem(16)}`,
        borderBottom: isHead ? `3px solid ${black.main}` : `2px solid ${black.main}`,
        ...(isHead && {
          fontWeight: 800,
          fontSize: pxToRem(11),
          textTransform: "uppercase",
          letterSpacing: "0.04em",
        }),
      };
    },
  },
};

export default tableCell;
