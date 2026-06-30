import PropTypes from "prop-types";
import { Navigate } from "react-router-dom";

import apiService from "../../services/apiService";
import Forbidden403 from "layouts/forbidden";

// Chặn theo role ngay tại route, không chỉ chặn theo "có quyền vào admin nói chung" như
// App.jsx — dùng cho các trang chỉ một số role cụ thể được vào (vd. payments chỉ Admin/Organizator).
function RoleGate({ allowedRoles, children }) {
  const session = apiService.getAuthSession();

  if (!session?.token) {
    return <Navigate to="/auth/sign-in" replace />;
  }

  const roles = session.roles || [];
  const hasAccess = allowedRoles.some((role) => roles.includes(role));

  if (!hasAccess) {
    return <Forbidden403 />;
  }

  return children;
}

RoleGate.propTypes = {
  allowedRoles: PropTypes.arrayOf(PropTypes.string).isRequired,
  children: PropTypes.node.isRequired,
};

export default RoleGate;
