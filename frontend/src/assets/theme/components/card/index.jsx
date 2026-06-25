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

// Soft UI Dashboard React Base Styles
import colors from "assets/theme/base/colors";

const { black, white } = colors;

// Neo-Brutalism: viền đen dày, không bo góc, đổ bóng offset cứng (không blur) —
// áp dụng toàn cục cho mọi <Card> trong app (mọi trang admin dùng chung component này).
const card = {
  styleOverrides: {
    root: {
      display: "flex",
      flexDirection: "column",
      position: "relative",
      minWidth: 0,
      wordWrap: "break-word",
      backgroundColor: white.main,
      backgroundClip: "border-box",
      border: `3px solid ${black.main}`,
      borderRadius: 0,
      boxShadow: `6px 6px 0 ${black.main}`,
      overflow: "hidden",
    },
  },
};

export default card;
