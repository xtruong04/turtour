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

// Neo-Brutalism: bỏ kính mờ (backdrop blur) + bo góc nổi, dùng nền đặc đậm màu áp sát
// mép — tương phản rõ với nền kem của trang. Viền/đổ bóng cứng thật sự nằm ở
// SidenavRoot.jsx (nơi style được áp dụng thực tế).
const sidenav = {
  styleOverrides: {
    root: {
      width: pxToRem(250),
      whiteSpace: "nowrap",
      border: "none",
    },

    paper: {
      width: pxToRem(250),
      backgroundColor: black.main,
      height: "100vh",
      margin: 0,
      borderRadius: 0,
      border: "none",
    },

    paperAnchorDockedLeft: {
      borderRight: "none",
    },
  },
};

export default sidenav;
