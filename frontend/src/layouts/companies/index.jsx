import { useEffect, useState } from "react";

import Alert from "@mui/material/Alert";
import Card from "@mui/material/Card";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Switch from "@mui/material/Switch";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Tooltip from "@mui/material/Tooltip";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftButton from "components/SoftButton";
import SoftInput from "components/SoftInput";
import PageLoader from "components/PageLoader";
import NeoBadge from "components/NeoBadge";

import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

import neoIconButtonSx from "assets/theme/functions/neoIconButtonSx";

import apiService from "../../services/apiService";

function IconEdit() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  );
}

function IconTrash() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
      <path d="M10 11v6M14 11v6"/>
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
    </svg>
  );
}

const emptyForm = {
  name: "",
  description: "",
  address: "",
  website: "",
  email: "",
  phone: "",
  logoUrl: "",
  industry: "",
  isActive: true,
};

function Companies() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [dialogError, setDialogError] = useState("");
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    async function fetchCompanies() {
      setLoading(true);
      setErrorMessage("");
      try {
        const data = await apiService.getCompanies();
        setCompanies(Array.isArray(data) ? data : []);
      } catch (error) {
        setErrorMessage(error?.message || "Không tải được danh sách doanh nghiệp.");
      } finally {
        setLoading(false);
      }
    }

    fetchCompanies();
  }, [refreshToken]);

  const refresh = () => setRefreshToken((value) => value + 1);

  const openEdit = (company) => {
    setEditing(company);
    setForm({
      name: company.name || "",
      description: company.description || "",
      address: company.address || "",
      website: company.website || "",
      email: company.email || "",
      phone: company.phone || "",
      logoUrl: company.logoUrl || "",
      industry: company.industry || "",
      isActive: company.isActive,
    });
    setDialogError("");
  };

  const closeEdit = () => {
    setEditing(null);
    setForm(emptyForm);
  };

  const handleFormChange = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.address.trim()) {
      setDialogError("Vui lòng nhập đủ tên và địa chỉ doanh nghiệp.");
      return;
    }

    setSaving(true);
    setDialogError("");
    try {
      await apiService.updateCompany(editing.id, form);
      closeEdit();
      refresh();
    } catch (error) {
      setDialogError(error?.message || "Cập nhật doanh nghiệp thất bại.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (company) => {
    if (!window.confirm(`Xóa doanh nghiệp "${company.name}"? Nếu doanh nghiệp đã có tour, hệ thống sẽ chuyển sang trạng thái ngừng hoạt động thay vì xóa hẳn.`)) {
      return;
    }

    try {
      await apiService.deleteCompany(company.id);
      refresh();
    } catch (error) {
      setErrorMessage(error?.message || "Xóa doanh nghiệp thất bại.");
    }
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <SoftBox py={3}>
        <Card>
          <SoftBox p={3}>
            <SoftBox mb={2}>
              <SoftTypography variant="h5" fontWeight="bold">Danh sách Doanh nghiệp</SoftTypography>
              <SoftTypography variant="button" color="text">Quản lý thông tin doanh nghiệp đã đăng ký trên hệ thống.</SoftTypography>
            </SoftBox>

            {loading ? <PageLoader label="Đang tải danh sách doanh nghiệp..." /> : null}
            {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}

            {!loading && !errorMessage ? (
              <TableContainer sx={{ overflowX: "auto" }}>
                <Table
                  size="small"
                  sx={{
                    tableLayout: "fixed",
                    minWidth: 800,
                    "& th": {
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      color: "#344767",
                      whiteSpace: "nowrap",
                      py: 1.5,
                    },
                    "& td": {
                      fontSize: "0.875rem",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      py: 1.25,
                    },
                  }}
                >
                  <colgroup>
                    <col style={{ width: "22%" }} />
                    <col style={{ width: "26%" }} />
                    <col style={{ width: "16%" }} />
                    <col style={{ width: "12%" }} />
                    <col style={{ width: "12%" }} />
                    <col style={{ width: "12%" }} />
                    <col style={{ width: "10%" }} />
                  </colgroup>
                  <TableHead sx={{ display: "table-header-group" }}>
                    <TableRow>
                      <TableCell>Tên doanh nghiệp</TableCell>
                      <TableCell>Địa chỉ</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>SĐT</TableCell>
                      <TableCell>Ngành</TableCell>
                      <TableCell align="center">Trạng thái</TableCell>
                      <TableCell align="center">Thao tác</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {companies.map((company) => (
                      <TableRow key={company.id} hover>
                        <TableCell title={company.name}>{company.name || "-"}</TableCell>
                        <TableCell title={company.address}>{company.address || "-"}</TableCell>
                        <TableCell title={company.email}>{company.email || "-"}</TableCell>
                        <TableCell title={company.phone}>{company.phone || "-"}</TableCell>
                        <TableCell title={company.industry}>{company.industry || "-"}</TableCell>
                        <TableCell align="center">
                          <NeoBadge
                            label={company.isActive ? "Hoạt động" : "Ngừng hoạt động"}
                            bgColor={company.isActive ? "#198754" : "#6c757d"}
                          />
                        </TableCell>
                        <TableCell align="center" sx={{ overflow: "visible" }}>
                          <SoftBox display="flex" justifyContent="center" gap={0.5}>
                            <Tooltip title="Sửa thông tin" arrow>
                              <SoftBox component="button" type="button" onClick={() => openEdit(company)} sx={neoIconButtonSx("#17c1e8")}>
                                <IconEdit />
                              </SoftBox>
                            </Tooltip>
                            <Tooltip title="Xóa" arrow>
                              <SoftBox component="button" type="button" onClick={() => handleDelete(company)} sx={neoIconButtonSx("#ea0606")}>
                                <IconTrash />
                              </SoftBox>
                            </Tooltip>
                          </SoftBox>
                        </TableCell>
                      </TableRow>
                    ))}
                    {companies.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7}>
                          <SoftTypography variant="button" color="text">Chưa có doanh nghiệp nào.</SoftTypography>
                        </TableCell>
                      </TableRow>
                    ) : null}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : null}
          </SoftBox>
        </Card>
      </SoftBox>
      <Footer />

      <Dialog open={Boolean(editing)} onClose={closeEdit} fullWidth maxWidth="sm">
        <DialogTitle>Sửa thông tin doanh nghiệp</DialogTitle>
        <DialogContent>
          <SoftBox mb={2} mt={1}>
            <SoftTypography variant="caption" fontWeight="bold">Tên doanh nghiệp *</SoftTypography>
            <SoftInput value={form.name} onChange={(e) => handleFormChange("name", e.target.value)} />
          </SoftBox>
          <SoftBox mb={2}>
            <SoftTypography variant="caption" fontWeight="bold">Địa chỉ *</SoftTypography>
            <SoftInput value={form.address} onChange={(e) => handleFormChange("address", e.target.value)} />
          </SoftBox>
          <SoftBox mb={2}>
            <SoftTypography variant="caption" fontWeight="bold">Email</SoftTypography>
            <SoftInput value={form.email} onChange={(e) => handleFormChange("email", e.target.value)} />
          </SoftBox>
          <SoftBox mb={2}>
            <SoftTypography variant="caption" fontWeight="bold">Số điện thoại</SoftTypography>
            <SoftInput value={form.phone} onChange={(e) => handleFormChange("phone", e.target.value)} />
          </SoftBox>
          <SoftBox mb={2}>
            <SoftTypography variant="caption" fontWeight="bold">Website</SoftTypography>
            <SoftInput value={form.website} onChange={(e) => handleFormChange("website", e.target.value)} />
          </SoftBox>
          <SoftBox mb={2}>
            <SoftTypography variant="caption" fontWeight="bold">Ngành nghề</SoftTypography>
            <SoftInput value={form.industry} onChange={(e) => handleFormChange("industry", e.target.value)} />
          </SoftBox>
          <SoftBox mb={2}>
            <SoftTypography variant="caption" fontWeight="bold">Mô tả</SoftTypography>
            <SoftInput value={form.description} onChange={(e) => handleFormChange("description", e.target.value)} multiline rows={2} />
          </SoftBox>
          <SoftBox display="flex" alignItems="center" gap={1}>
            <Switch checked={form.isActive} onChange={(e) => handleFormChange("isActive", e.target.checked)} />
            <SoftTypography variant="button" fontWeight="regular">Đang hoạt động</SoftTypography>
          </SoftBox>
          {dialogError ? <SoftBox mt={2}><Alert severity="error">{dialogError}</Alert></SoftBox> : null}
        </DialogContent>
        <DialogActions>
          <SoftButton variant="outlined" color="dark" onClick={closeEdit}>Hủy</SoftButton>
          <SoftButton variant="gradient" color="info" onClick={handleSave} disabled={saving}>
            {saving ? "Đang lưu..." : "Lưu thay đổi"}
          </SoftButton>
        </DialogActions>
      </Dialog>
    </DashboardLayout>
  );
}

export default Companies;
