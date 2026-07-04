import { useEffect, useState } from "react";
import PropTypes from "prop-types";

import Grid from "@mui/material/Grid";
import CircularProgress from "@mui/material/CircularProgress";

import SoftBox from "components/SoftBox";
import SoftInput from "components/SoftInput";
import SoftTypography from "components/SoftTypography";
import NeoDropdown from "components/NeoDropdown";

const API_BASE = import.meta.env.VITE_API_URL || "https://localhost:7186/api";

async function fetchProvinces() {
  const res = await fetch(`${API_BASE}/address/provinces`);
  const json = await res.json();
  return json.success ? json.data : [];
}

async function fetchWards(provinceCode) {
  const res = await fetch(`${API_BASE}/address/provinces/${provinceCode}/wards`);
  const json = await res.json();
  return json.success ? json.data : [];
}

function buildAddress(province, ward, detail) {
  const parts = [];
  if (detail?.trim()) parts.push(detail.trim());
  if (ward) parts.push(ward.name);
  if (province) parts.push(province.name);
  return parts.join(", ");
}

// Component chọn địa chỉ Việt Nam (tỉnh/thành → phường/xã → chi tiết tuỳ chọn).
// Output: một chuỗi địa chỉ đầy đủ qua prop onChange(string).
// showDetail=true thêm field nhập số nhà/đường — dùng cho địa chỉ công ty/người dùng.
function AddressPicker({ value, onChange, showDetail, disabled }) {
  const [provinces, setProvinces] = useState([]);
  const [wards, setWards] = useState([]);
  const [selectedProvince, setSelectedProvince] = useState(null);
  const [selectedWard, setSelectedWard] = useState(null);
  const [detail, setDetail] = useState("");
  const [loadingProvinces, setLoadingProvinces] = useState(true);
  const [loadingWards, setLoadingWards] = useState(false);

  // Load danh sách tỉnh/thành một lần khi mount
  useEffect(() => {
    fetchProvinces()
      .then(setProvinces)
      .finally(() => setLoadingProvinces(false));
  }, []);

  // Khi đổi tỉnh → reset ward, load ward mới
  const handleProvinceChange = (code) => {
    const province = provinces.find((p) => p.code === code) || null;
    setSelectedProvince(province);
    setSelectedWard(null);
    setWards([]);

    if (!province) {
      onChange(buildAddress(null, null, detail));
      return;
    }

    setLoadingWards(true);
    fetchWards(code)
      .then(setWards)
      .finally(() => setLoadingWards(false));

    onChange(buildAddress(province, null, detail));
  };

  const handleWardChange = (code) => {
    const ward = wards.find((w) => w.code === code) || null;
    setSelectedWard(ward);
    onChange(buildAddress(selectedProvince, ward, detail));
  };

  const handleDetailChange = (e) => {
    setDetail(e.target.value);
    onChange(buildAddress(selectedProvince, selectedWard, e.target.value));
  };

  const provinceOptions = provinces.map((p) => ({ value: p.code, label: `${p.type} ${p.name}` }));
  const wardOptions = wards.map((w) => ({ value: w.code, label: `${w.type} ${w.name}` }));

  return (
    <SoftBox>
      {loadingProvinces ? (
        <SoftBox display="flex" alignItems="center" gap={1} py={1}>
          <CircularProgress size={16} />
          <SoftTypography variant="caption" color="text">Đang tải danh sách tỉnh/thành...</SoftTypography>
        </SoftBox>
      ) : (
        <Grid container spacing={1.5}>
          <Grid item xs={12} sm={showDetail ? 6 : 6}>
            <SoftTypography variant="caption" color="text">Tỉnh / Thành phố</SoftTypography>
            <NeoDropdown
              value={selectedProvince?.code || ""}
              options={provinceOptions}
              placeholder="-- Chọn tỉnh/thành --"
              onChange={handleProvinceChange}
              disabled={disabled}
            />
          </Grid>

          <Grid item xs={12} sm={showDetail ? 6 : 6}>
            <SoftTypography variant="caption" color="text">Phường / Xã</SoftTypography>
            {loadingWards ? (
              <SoftBox display="flex" alignItems="center" gap={1} minHeight={44}>
                <CircularProgress size={14} />
                <SoftTypography variant="caption" color="text">Đang tải...</SoftTypography>
              </SoftBox>
            ) : (
              <NeoDropdown
                value={selectedWard?.code || ""}
                options={wardOptions}
                placeholder={selectedProvince ? "-- Chọn phường/xã --" : "-- Chọn tỉnh trước --"}
                onChange={handleWardChange}
                disabled={disabled || !selectedProvince}
              />
            )}
          </Grid>

          {showDetail && (
            <Grid item xs={12}>
              <SoftTypography variant="caption" color="text">Số nhà, tên đường</SoftTypography>
              <SoftInput
                placeholder="VD: 123 Đường Nguyễn Huệ"
                value={detail}
                onChange={handleDetailChange}
                disabled={disabled}
              />
            </Grid>
          )}

          {value && (
            <Grid item xs={12}>
              <SoftBox
                sx={{
                  mt: 0.25,
                  px: 1.25,
                  py: 0.75,
                  background: "#f8f9fa",
                  border: "1px solid #e0e0e0",
                  borderRadius: 1,
                }}
              >
                <SoftTypography variant="caption" color="text">
                  <strong>Địa chỉ:</strong> {value}
                </SoftTypography>
              </SoftBox>
            </Grid>
          )}
        </Grid>
      )}
    </SoftBox>
  );
}

AddressPicker.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  showDetail: PropTypes.bool,
  disabled: PropTypes.bool,
};

AddressPicker.defaultProps = {
  value: "",
  showDetail: false,
  disabled: false,
};

export default AddressPicker;
