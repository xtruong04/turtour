/**
=========================================================
* Soft UI Dashboard React - v4.0.1
=========================================================

* Product Page: https://www.creative-tim.com/product/soft-ui-dashboard-react
* Copyright 2023 Creative Tim (https://www.creative-tim.com)

Coded by www.creative-tim.com

 =========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
*/

// @mui material components
import Drawer from "@mui/material/Drawer";
import { styled } from "@mui/material/styles";

// Neo-Brutalism: sidebar nền đậm màu (khác hẳn nền kem của trang), không kính mờ,
// đổ bóng offset cứng để tách bạch khỏi nội dung. Cố định luôn dùng nền đậm, không
// phụ thuộc cờ "transparentSidenav" (tính năng demo cho phép đổi sidebar trong suốt/trắng
// của template gốc — không còn phù hợp với thiết kế Neo-Brutalism cố định của app này).
export default styled(Drawer)(({ theme, ownerState }) => {
  const { palette, transitions, breakpoints, functions } = theme;
  const { miniSidenav } = ownerState;

  const sidebarWidth = 250;
  const { black } = palette;
  const { pxToRem } = functions;
  const hardShadow = `6px 0 0 ${black.main}`;

  // styles for the sidenav when miniSidenav={false}
  const drawerOpenStyles = () => ({
    transform: "translateX(0)",
    transition: transitions.create("transform", {
      easing: transitions.easing.sharp,
      duration: transitions.duration.shorter,
    }),

    [breakpoints.up("xl")]: {
      backgroundColor: black.main,
      boxShadow: hardShadow,
      left: "0",
      width: sidebarWidth,
      transform: "translateX(0)",
      transition: transitions.create(["width", "background-color"], {
        easing: transitions.easing.sharp,
        duration: transitions.duration.enteringScreen,
      }),
    },
  });

  // styles for the sidenav when miniSidenav={true}
  const drawerCloseStyles = () => ({
    transform: `translateX(${pxToRem(-320)})`,
    transition: transitions.create("transform", {
      easing: transitions.easing.sharp,
      duration: transitions.duration.shorter,
    }),

    [breakpoints.up("xl")]: {
      backgroundColor: black.main,
      boxShadow: hardShadow,
      left: "0",
      width: pxToRem(96),
      overflowX: "hidden",
      transform: "translateX(0)",
      transition: transitions.create(["width", "background-color"], {
        easing: transitions.easing.sharp,
        duration: transitions.duration.shorter,
      }),
    },
  });

  return {
    "& .MuiDrawer-paper": {
      boxShadow: hardShadow,
      border: "none",
      borderRadius: 0,

      ...(miniSidenav ? drawerCloseStyles() : drawerOpenStyles()),
    },
  };
});
