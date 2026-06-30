import { useState } from "react";
import PropTypes from "prop-types";

import Icon from "@mui/material/Icon";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";

// Dropdown chọn 1 giá trị, phong cách Neo-Brutalism (viền đen 2px, không bo góc) — thay cho
// MUI Select/TextField-select vì theme đã ẩn icon mặc định của Select (assets/theme/components/
// form/select.jsx), gây ra khung rỗng/lệch khi chưa có lựa chọn. Cùng cách làm với TourStatusButton.
function NeoDropdown({ value, options, placeholder, onChange, disabled }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const selected = options.find((option) => option.value === value);

  const handleSelect = (optionValue) => {
    setAnchorEl(null);
    onChange(optionValue);
  };

  return (
    <>
      <SoftBox
        component="button"
        type="button"
        disabled={disabled}
        onClick={(event) => setAnchorEl(event.currentTarget)}
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          minHeight: 44,
          px: 1.5,
          border: "2px solid #2b2a27",
          borderRadius: 0,
          background: "#fff",
          cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? 0.6 : 1,
          textAlign: "left",
        }}
      >
        <SoftTypography
          variant="button"
          fontWeight={selected ? "regular" : "regular"}
          sx={{ color: selected ? "#1a1a2e" : "#8392ab", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
        >
          {selected ? selected.label : placeholder}
        </SoftTypography>
        <Icon sx={{ color: "#2b2a27", flexShrink: 0 }}>arrow_drop_down</Icon>
      </SoftBox>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={() => setAnchorEl(null)}
        PaperProps={{ sx: { maxHeight: 320, minWidth: anchorEl?.offsetWidth } }}
      >
        {options.length === 0 ? (
          <MenuItem disabled>Không có lựa chọn</MenuItem>
        ) : (
          options.map((option) => (
            <MenuItem key={option.value} selected={option.value === value} onClick={() => handleSelect(option.value)}>
              {option.label}
            </MenuItem>
          ))
        )}
      </Menu>
    </>
  );
}

NeoDropdown.propTypes = {
  value: PropTypes.string,
  options: PropTypes.arrayOf(
    PropTypes.shape({ value: PropTypes.string.isRequired, label: PropTypes.node.isRequired })
  ).isRequired,
  placeholder: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};

NeoDropdown.defaultProps = {
  value: "",
  placeholder: "Chọn...",
  disabled: false,
};

export default NeoDropdown;
