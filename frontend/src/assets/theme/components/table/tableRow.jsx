import colors from "assets/theme/base/colors";

const { grey } = colors;

// Row hover dùng grey.100 (#f6efdd) — warm cream, khớp palette kraft paper,
// thay cho cold rgba(0,0,0,0.04) mặc định của MUI.
const tableRow = {
  styleOverrides: {
    root: {
      transition: "background-color 0.15s ease",
      "&.MuiTableRow-hover:hover": {
        backgroundColor: grey[100],
      },
    },
  },
};

export default tableRow;
