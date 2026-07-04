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

import { useState } from "react";

// react-router-dom components
import { Link } from "react-router-dom";

// @mui material components
import Card from "@mui/material/Card";
import Checkbox from "@mui/material/Checkbox";
import Grid from "@mui/material/Grid";

// Soft UI Dashboard React components
import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftInput from "components/SoftInput";
import SoftButton from "components/SoftButton";
import AppToast from "components/AppToast";

// Authentication layout components
import BasicLayout from "layouts/authentication/components/BasicLayout";
import Separator from "layouts/authentication/components/Separator";

import apiService from "../../../services/apiService";
import AddressPicker from "components/AddressPicker";

// Images
import curved6 from "assets/images/curved-images/curved14.jpg";

const accountOptions = [
  {
    value: "student",
    label: "Sinh viên",
    title: "Đăng ký tài khoản sinh viên",
    description: "Điền thông tin cá nhân cơ bản để tham gia tour.",
    submitLabel: "Đăng ký sinh viên",
    required: [
      { name: "fullName", label: "Họ và tên", placeholder: "Ví dụ: Nguyễn Văn A",              type: "text"     },
      { name: "email",    label: "Email",      placeholder: "Ví dụ: nguyenvana@student.edu.vn", type: "email"    },
      { name: "password", label: "Mật khẩu",  placeholder: "Ít nhất 6 ký tự",                  type: "password", fullWidth: true },
    ],
    optional: [],
  },
  {
    value: "company",
    label: "Doanh nghiệp",
    title: "Đăng ký tài khoản doanh nghiệp",
    description: "Cung cấp thông tin doanh nghiệp để tạo tài khoản đối tác.",
    submitLabel: "Đăng ký doanh nghiệp",
    required: [
      { name: "companyName",  label: "Tên doanh nghiệp",  placeholder: "Ví dụ: Công ty TNHH ABC Tech", type: "text"     },
      { name: "companyEmail", label: "Email doanh nghiệp", placeholder: "Ví dụ: contact@abctech.vn",   type: "email"    },
      { name: "address",      label: "Địa chỉ",            placeholder: "",                             type: "address",  fullWidth: true },
      { name: "password",     label: "Mật khẩu",           placeholder: "Ít nhất 6 ký tự",             type: "password", fullWidth: true },
    ],
    optional: [
      { name: "companyPhone", label: "Số điện thoại", placeholder: "Ví dụ: 028 1234 5678",       type: "tel"  },
      { name: "website",      label: "Website",        placeholder: "Ví dụ: https://abctech.vn",  type: "url"  },
      { name: "industry",     label: "Ngành nghề",     placeholder: "Ví dụ: Công nghệ thông tin", type: "text", fullWidth: true },
    ],
  },
  {
    value: "organizator",
    label: "Người tổ chức",
    title: "Đăng ký tài khoản người tổ chức",
    description: "Điền thông tin đơn vị tổ chức để quản lý tour và lịch trình.",
    submitLabel: "Đăng ký người tổ chức",
    required: [
      { name: "organizatorName",  label: "Tên đơn vị tổ chức", placeholder: "Ví dụ: Trung tâm Hỗ trợ Sinh viên", type: "text"     },
      { name: "organizatorEmail", label: "Email liên hệ",       placeholder: "Ví dụ: event@turtour.vn",           type: "email"    },
      { name: "address",          label: "Địa chỉ",             placeholder: "",                                   type: "address",  fullWidth: true },
      { name: "password",         label: "Mật khẩu",            placeholder: "Ít nhất 6 ký tự",                   type: "password", fullWidth: true },
    ],
    optional: [
      { name: "organizatorPhone", label: "Số điện thoại", placeholder: "Ví dụ: 028 1234 5678",      type: "tel" },
      { name: "website",          label: "Website",        placeholder: "Ví dụ: https://turtour.vn", type: "url" },
    ],
  },
];

const initialFormState = {
  fullName: "",
  email: "",
  password: "",
  companyName: "",
  companyEmail: "",
  companyPhone: "",
  website: "",
  industry: "",
  organizatorName: "",
  organizatorEmail: "",
  organizatorPhone: "",
  address: "",
};

function SignUp() {
  const [accountType, setAccountType] = useState("student");
  const [agreement, setAgremment] = useState(true);
  const [form, setForm] = useState(initialFormState);
  const [submitting, setSubmitting] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [resending, setResending] = useState(false);
  const [toast, setToast] = useState({ open: false, severity: "error", message: "" });

  const showToast = (severity, message) => setToast({ open: true, severity, message });
  const closeToast = () => setToast((current) => ({ ...current, open: false }));

  const handleSetAgremment = () => setAgremment(!agreement);

  const activeOption = accountOptions.find((option) => option.value === accountType) || accountOptions[0];

  const handleAccountTypeChange = (nextType) => {
    setAccountType(nextType);
  };

  const handleChange = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const validateRequiredFields = () => {
    const missingField = activeOption.required.find((field) => !form[field.name]?.trim());

    if (missingField) {
      return `Vui lòng nhập ${missingField.label.toLowerCase()}.`;
    }

    if (!agreement) {
      return "Vui lòng đồng ý với điều khoản để tiếp tục.";
    }

    return "";
  };

  const opt = (key) => form[key]?.trim() || undefined;

  const buildPayload = () => {
    if (accountType === "company") {
      return {
        companyName: form.companyName.trim(),
        companyEmail: form.companyEmail.trim(),
        address: form.address.trim(),
        password: form.password,
        companyPhone: opt("companyPhone"),
        website: opt("website"),
        industry: opt("industry"),
      };
    }

    if (accountType === "organizator") {
      return {
        organizatorName: form.organizatorName.trim(),
        organizatorEmail: form.organizatorEmail.trim(),
        address: form.address.trim(),
        password: form.password,
        organizatorPhone: opt("organizatorPhone"),
        website: opt("website"),
      };
    }

    return {
      fullName: form.fullName.trim(),
      email: form.email.trim(),
      password: form.password,
    };
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validationMessage = validateRequiredFields();
    if (validationMessage) {
      showToast("error", validationMessage);
      return;
    }

    setSubmitting(true);

    try {
      const payload = buildPayload();
      const email = accountType === "company"
        ? form.companyEmail.trim()
        : accountType === "organizator"
          ? form.organizatorEmail.trim()
          : form.email.trim();

      if (accountType === "company") {
        await apiService.registerCompany(payload);
      } else if (accountType === "organizator") {
        await apiService.registerOrganizator(payload);
      } else {
        await apiService.registerStudent(payload);
      }

      setForm(initialFormState);
      setAgremment(true);
      setRegisteredEmail(email);
    } catch (error) {
      showToast("error", error?.message || "Đăng ký thất bại.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      const result = await apiService.resendConfirmation(registeredEmail);
      showToast("info", result?.message || "Đã gửi lại email xác thực.");
    } catch (error) {
      showToast("error", error?.message || "Gửi lại email xác thực thất bại.");
    } finally {
      setResending(false);
    }
  };

  return (
    <BasicLayout
      title="Đăng ký tài khoản"
      description="Chọn đúng loại tài khoản và điền các thông tin bắt buộc để tạo tài khoản mới."
      image={curved6}
    >
      <Card>
        {registeredEmail ? (
          <SoftBox p={4} textAlign="center">
            <SoftTypography variant="h5" fontWeight="medium" mb={1}>
              Kiểm tra email của bạn
            </SoftTypography>
            <SoftTypography variant="button" color="text">
              Chúng tôi đã gửi link xác thực tới <strong>{registeredEmail}</strong>. Bấm vào link
              trong email để hoàn tất đăng ký, sau đó mới đăng nhập được.
            </SoftTypography>

            <SoftBox mt={3} display="flex" flexDirection="column" gap={1.5} alignItems="center">
              <SoftButton variant="outlined" color="dark" onClick={handleResend} disabled={resending}>
                {resending ? "Đang gửi lại..." : "Gửi lại email xác thực"}
              </SoftButton>
              <SoftTypography
                component={Link}
                to="/auth/sign-in"
                variant="button"
                color="dark"
                fontWeight="bold"
                textGradient
              >
                Về trang đăng nhập
              </SoftTypography>
            </SoftBox>
          </SoftBox>
        ) : (
          <>
            <SoftBox p={3} mb={1} textAlign="center">
              <SoftTypography variant="h5" fontWeight="medium">
                {activeOption.title}
              </SoftTypography>
              <SoftTypography variant="button" color="text">
                {activeOption.description}
              </SoftTypography>
            </SoftBox>
            <SoftBox mb={2}>
              <SoftBox px={3} display="flex" flexWrap="wrap" gap={1.5} justifyContent="center">
                {accountOptions.map((option) => (
                  <SoftButton
                    key={option.value}
                    variant={accountType === option.value ? "gradient" : "outlined"}
                    color={accountType === option.value ? "info" : "dark"}
                    onClick={() => handleAccountTypeChange(option.value)}
                  >
                    {option.label}
                  </SoftButton>
                ))}
              </SoftBox>
            </SoftBox>
            <Separator />
            <SoftBox pt={2} pb={3} px={3}>
              <SoftBox component="form" role="form" onSubmit={handleSubmit}>
                <Grid container spacing={2}>
                  {[...activeOption.required.map((f) => ({ ...f, required: true })), ...activeOption.optional].map((field) => (
                    <Grid item xs={12} sm={field.fullWidth ? 12 : 6} key={field.name}>
                      <SoftBox mb={1} ml={0.5}>
                        <SoftTypography component="label" variant="caption" fontWeight="bold">
                          {field.label}
                          {field.required && (
                            <SoftTypography component="span" variant="caption" sx={{ color: "#ea0606", ml: 0.25 }}>*</SoftTypography>
                          )}
                        </SoftTypography>
                      </SoftBox>
                      {field.type === "address" ? (
                        <AddressPicker
                          value={form.address}
                          onChange={(v) => handleChange("address", v)}
                          showDetail
                        />
                      ) : (
                        <SoftInput
                          type={field.type}
                          placeholder={field.placeholder}
                          value={form[field.name]}
                          onChange={(event) => handleChange(field.name, event.target.value)}
                        />
                      )}
                    </Grid>
                  ))}
                </Grid>

                <SoftBox display="flex" alignItems="center">
                  <Checkbox checked={agreement} onChange={handleSetAgremment} />
                  <SoftTypography
                    variant="button"
                    fontWeight="regular"
                    onClick={handleSetAgremment}
                    sx={{ cursor: "pointer", userSelect: "none" }}
                  >
                    &nbsp;&nbsp;Tôi đồng ý với&nbsp;
                  </SoftTypography>
                  <SoftTypography
                    component="a"
                    href="#"
                    variant="button"
                    fontWeight="bold"
                    textGradient
                  >
                    Điều khoản sử dụng
                  </SoftTypography>
                </SoftBox>
                <SoftBox mt={4} mb={1}>
                  <SoftButton type="submit" variant="gradient" color="dark" fullWidth disabled={submitting}>
                    {submitting ? "Đang đăng ký..." : activeOption.submitLabel}
                  </SoftButton>
                </SoftBox>
                <SoftBox mt={3} textAlign="center">
                  <SoftTypography variant="button" color="text" fontWeight="regular">
                    Đã có tài khoản?&nbsp;
                    <SoftTypography
                      component={Link}
                      to="/auth/sign-in"
                      variant="button"
                      color="dark"
                      fontWeight="bold"
                      textGradient
                    >
                      Đăng nhập
                    </SoftTypography>
                  </SoftTypography>
                </SoftBox>
              </SoftBox>
            </SoftBox>
          </>
        )}
      </Card>

      <AppToast
        open={toast.open}
        severity={toast.severity}
        message={toast.message}
        onClose={closeToast}
      />
    </BasicLayout>
  );
}

export default SignUp;
