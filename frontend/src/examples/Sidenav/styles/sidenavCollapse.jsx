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
// Neo-Brutalism: mục đang active là 1 khối màu đặc viền đen, không bo góc,
// đổ bóng offset cứng — thay cho pill trắng mờ + soft shadow mặc định.
function collapseItem(theme, ownerState) {
  const { palette, transitions, breakpoints, functions } = theme;
  const { active, color } = ownerState;

  const { black, white, transparent } = palette;
  const { pxToRem } = functions;
  const activeColor = color === "default" ? palette.info.main : palette[color]?.main || palette.info.main;
  // Chữ mục chưa active dùng tông sáng ấm (không phải text.main màu nâu sậm) để đủ
  // tương phản trên nền sidebar đậm màu.
  const inactiveTextColor = "#c9c5bc";

  return {
    background: active ? activeColor : transparent.main,
    color: active ? white.main : inactiveTextColor,
    display: "flex",
    alignItems: "center",
    width: "100%",
    padding: `${pxToRem(10.8)} ${pxToRem(12.8)} ${pxToRem(10.8)} ${pxToRem(16)}`,
    margin: `0 ${pxToRem(16)}`,
    borderRadius: 0,
    border: active ? `2px solid ${black.main}` : "2px solid transparent",
    cursor: "pointer",
    userSelect: "none",
    whiteSpace: "nowrap",
    boxShadow: active ? `4px 4px 0 ${black.main}` : "none",
    [breakpoints.up("xl")]: {
      transition: transitions.create(["box-shadow", "background", "border-color"], {
        easing: transitions.easing.easeInOut,
        duration: transitions.duration.shorter,
      }),
    },
  };
}

// Khi active, khối icon đổi sang nền trắng (tương phản với khối màu của item cha)
// thay vì cùng màu — tạo hiệu ứng "khối trong khối" rõ nét kiểu Neo-Brutalism.
function collapseIconBox(theme, ownerState) {
  const { palette, transitions, functions } = theme;
  const { active, color } = ownerState;

  const { white, light, black } = palette;
  const { pxToRem } = functions;
  const activeColor = color === "default" ? palette.info.main : palette[color]?.main || palette.info.main;

  return {
    background: active ? white.main : light.main,
    minWidth: pxToRem(32),
    minHeight: pxToRem(32),
    borderRadius: 0,
    border: `2px solid ${black.main}`,
    display: "grid",
    placeItems: "center",
    boxShadow: "none",
    transition: transitions.create("margin", {
      easing: transitions.easing.easeInOut,
      duration: transitions.duration.standard,
    }),

    "& svg, svg g": {
      fill: active ? activeColor : black.main,
    },
  };
}

const collapseIcon = (theme, { active, color }) => {
  const { palette } = theme;
  const { black } = palette;
  const activeColor = color === "default" ? palette.info.main : palette[color]?.main || palette.info.main;
  return { color: active ? activeColor : black.main };
};

function collapseText(theme, ownerState) {
  const { typography, transitions, breakpoints, functions } = theme;
  const { miniSidenav, transparentSidenav, active } = ownerState;

  const { size, fontWeightMedium, fontWeightRegular } = typography;
  const { pxToRem } = functions;

  return {
    marginLeft: pxToRem(12.8),

    [breakpoints.up("xl")]: {
      opacity: miniSidenav || (miniSidenav && transparentSidenav) ? 0 : 1,
      maxWidth: miniSidenav || (miniSidenav && transparentSidenav) ? 0 : "100%",
      marginLeft: miniSidenav || (miniSidenav && transparentSidenav) ? 0 : pxToRem(12.8),
      transition: transitions.create(["opacity", "margin"], {
        easing: transitions.easing.easeInOut,
        duration: transitions.duration.standard,
      }),
    },

    "& span": {
      fontWeight: active ? fontWeightMedium : fontWeightRegular,
      fontSize: size.sm,
      lineHeight: 0,
    },
  };
}

export { collapseItem, collapseIconBox, collapseIcon, collapseText };
