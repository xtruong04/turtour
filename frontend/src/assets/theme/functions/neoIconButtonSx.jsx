// Style dùng chung cho các nút icon hành động trong bảng (xem/sửa/xoá...) theo
// Neo-Brutalism: viền đen, không bo góc, chỉ tô màu khi hover kèm bóng offset nhỏ.
function neoIconButtonSx(color) {
  return {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: 32,
    height: 32,
    borderRadius: 0,
    border: "2px solid #2b2a27",
    color: "#2b2a27",
    background: "#fff",
    cursor: "pointer",
    textDecoration: "none",
    transition: "transform 0.15s, box-shadow 0.15s, background 0.15s, color 0.15s",
    boxShadow: "none",
    "&:hover": {
      background: color,
      color: "#fff",
      transform: "translate(-1px, -1px)",
      boxShadow: "2px 2px 0 #2b2a27",
    },
    "&:active": {
      transform: "translate(0, 0)",
      boxShadow: "none",
    },
  };
}

export default neoIconButtonSx;
