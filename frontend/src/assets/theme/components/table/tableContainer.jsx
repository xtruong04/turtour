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

// Bảng luôn được đặt trong 1 <Card> đã có viền đen + bóng offset riêng (Neo-Brutalism) —
// để TableContainer trong suốt, tránh tạo hộp lồng hộp (double-boxing).
const tableContainer = {
  styleOverrides: {
    root: {
      backgroundColor: "transparent",
      boxShadow: "none",
      borderRadius: 0,
    },
  },
};

export default tableContainer;
