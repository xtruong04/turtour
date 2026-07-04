import { useEffect, useState } from "react";

import Alert from "@mui/material/Alert";
import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Tooltip from "@mui/material/Tooltip";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import PageLoader from "components/PageLoader";

import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

import apiService from "../../services/apiService";
import { hideSplash } from "utils/splash";

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Contacts() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setErrorMessage("");
      try {
        const data = await apiService.getContacts();
        setContacts(data);
      } catch (err) {
        setErrorMessage(err?.message || "Không tải được danh sách liên hệ.");
      } finally {
        setLoading(false);
        hideSplash();
      }
    }
    fetchData();
  }, []);

  async function handleOpen(contact) {
    setSelected(contact);
    if (!contact.isRead) {
      try {
        await apiService.markContactRead(contact.id);
        setContacts((prev) =>
          prev.map((c) => (c.id === contact.id ? { ...c, isRead: true } : c))
        );
      } catch {
        // non-critical
      }
    }
  }

  const unreadCount = contacts.filter((c) => !c.isRead).length;

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <SoftBox py={3}>
        <Card>
          <SoftBox p={3}>
            <SoftBox mb={2} display="flex" justifyContent="space-between" alignItems="center">
              <div>
                <SoftTypography variant="h5" fontWeight="bold">Liên hệ từ người dùng</SoftTypography>
                <SoftTypography variant="button" color="text">
                  Danh sách các tin nhắn liên hệ từ trang chủ.
                  {unreadCount > 0 && ` ${unreadCount} tin chưa đọc.`}
                </SoftTypography>
              </div>
            </SoftBox>

            {loading && <PageLoader label="Đang tải dữ liệu..." />}
            {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

            {!loading && !errorMessage && (
              <TableContainer sx={{ overflowX: "auto" }}>
                <Table
                  size="small"
                  sx={{
                    tableLayout: "fixed",
                    minWidth: 700,
                    "& th": { fontSize: "0.75rem", fontWeight: 700, color: "#2b2a27", whiteSpace: "nowrap", py: 1.5 },
                    "& td": { fontSize: "0.875rem", py: 1.25, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
                  }}
                >
                  <colgroup>
                    <col style={{ width: "4%" }} />
                    <col style={{ width: "20%" }} />
                    <col style={{ width: "22%" }} />
                    <col style={{ width: "30%" }} />
                    <col style={{ width: "16%" }} />
                    <col style={{ width: "8%" }} />
                  </colgroup>
                  <TableHead sx={{ display: "table-header-group" }}>
                    <TableRow>
                      <TableCell></TableCell>
                      <TableCell>Họ tên</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Tiêu đề</TableCell>
                      <TableCell>Thời gian</TableCell>
                      <TableCell>Trạng thái</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {contacts.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 4, color: "#aaa" }}>
                          Chưa có liên hệ nào.
                        </TableCell>
                      </TableRow>
                    )}
                    {contacts.map((c) => (
                      <TableRow
                        key={c.id}
                        hover
                        onClick={() => handleOpen(c)}
                        sx={{
                          cursor: "pointer",
                          fontWeight: c.isRead ? "normal" : "bold",
                          backgroundColor: c.isRead ? "inherit" : "rgba(25, 118, 210, 0.04)",
                        }}
                      >
                        <TableCell sx={{ px: 1 }}>
                          {!c.isRead && (
                            <Tooltip title="Chưa đọc">
                              <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", backgroundColor: "#1976d2" }} />
                            </Tooltip>
                          )}
                        </TableCell>
                        <TableCell sx={{ fontWeight: c.isRead ? 400 : 700 }}>{c.fullName}</TableCell>
                        <TableCell>{c.email}</TableCell>
                        <TableCell>{c.subject}</TableCell>
                        <TableCell>{formatDate(c.createdAt)}</TableCell>
                        <TableCell>
                          <Chip
                            label={c.isRead ? "Đã đọc" : "Mới"}
                            size="small"
                            sx={{
                              backgroundColor: c.isRead ? "#e0e0e0" : "#1976d2",
                              color: c.isRead ? "#555" : "#fff",
                              fontWeight: 600,
                              fontSize: "0.7rem",
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </SoftBox>
        </Card>
      </SoftBox>

      <Dialog open={!!selected} onClose={() => setSelected(null)} maxWidth="sm" fullWidth>
        {selected && (
          <>
            <DialogTitle sx={{ pr: 6 }}>
              {selected.subject}
              <IconButton
                onClick={() => setSelected(null)}
                size="small"
                sx={{ position: "absolute", right: 12, top: 12 }}
                aria-label="Đóng"
              >
                ✕
              </IconButton>
            </DialogTitle>
            <DialogContent dividers>
              <SoftBox mb={1}>
                <SoftTypography variant="caption" color="text">Họ tên</SoftTypography>
                <SoftTypography variant="body2" fontWeight="medium">{selected.fullName}</SoftTypography>
              </SoftBox>
              <SoftBox mb={1}>
                <SoftTypography variant="caption" color="text">Email</SoftTypography>
                <SoftTypography variant="body2">
                  <a href={`mailto:${selected.email}`} style={{ color: "#1976d2" }}>{selected.email}</a>
                </SoftTypography>
              </SoftBox>
              <SoftBox mb={2}>
                <SoftTypography variant="caption" color="text">Thời gian</SoftTypography>
                <SoftTypography variant="body2">{formatDate(selected.createdAt)}</SoftTypography>
              </SoftBox>
              <SoftBox
                p={2}
                sx={{ backgroundColor: "#f5f5f5", borderRadius: 1, whiteSpace: "pre-wrap", wordBreak: "break-word" }}
              >
                <SoftTypography variant="body2">{selected.message}</SoftTypography>
              </SoftBox>
            </DialogContent>
          </>
        )}
      </Dialog>

      <Footer />
    </DashboardLayout>
  );
}

export default Contacts;
