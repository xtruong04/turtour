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

const { black, grey } = colors;

// Header: viền đáy đen dày để tạo điểm nhấn Neo-Brutalism rõ ràng.
// Data rows: viền warm-grey mỏng (1px) thay vì 2px black — nhẹ hơn, dễ đọc hơn,
// khớp với palette giấy kraft tổng thể.
const tableCell = {
  styleOverrides: {
    root: ({ ownerState }) => {
      const isHead = ownerState?.variant === "head";

      return {
        padding: `${pxToRem(11)} ${pxToRem(16)}`,
        borderBottom: isHead ? `2px solid ${black.main}` : `1px solid ${grey[300]}`,
        ...(isHead && {
          fontWeight: 800,
          fontSize: pxToRem(11),
          textTransform: "uppercase",
          letterSpacing: "0.04em",
          color: black.main,
          backgroundColor: grey[100],
        }),
      };
    },
  },
};

export default tableCell;
