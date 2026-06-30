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

import { useEffect, useMemo, useState } from "react";

// react-router components
import { useLocation, useNavigate } from "react-router-dom";

// prop-types is a library for typechecking of props.
import PropTypes from "prop-types";

// @material-ui core components
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Divider from "@mui/material/Divider";
import Badge from "@mui/material/Badge";
import Icon from "@mui/material/Icon";

// Soft UI Dashboard React components
import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftInput from "components/SoftInput";

// Soft UI Dashboard React examples
import Breadcrumbs from "examples/Breadcrumbs";
import NotificationItem from "examples/Items/NotificationItem";
import apiService, { normalizeNotification } from "../../../services/apiService";
import realtimeService from "../../../services/realtime";

// Custom styles for DashboardNavbar
import {
  navbar,
  navbarContainer,
  navbarRow,
  navbarIconButton,
  navbarMobileMenu,
} from "examples/Navbars/DashboardNavbar/styles";

// Soft UI Dashboard React context
import {
  useSoftUIController,
  setTransparentNavbar,
  setMiniSidenav,
  setOpenConfigurator,
} from "context";

function formatNotificationDate(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function notificationIcon(type) {
  if (type === "Payment") return "payments";
  return "notifications";
}

function DashboardNavbar({ absolute, light, isMini }) {
  const [controller, dispatch] = useSoftUIController();
  const { miniSidenav, transparentNavbar, openConfigurator } = controller;
  const [openMenu, setOpenMenu] = useState(false);
  const [openAccountMenu, setOpenAccountMenu] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const navigate = useNavigate();
  const route = useLocation().pathname.split("/").slice(1);
  const routeKey = route.join("/");
  const session = useMemo(() => apiService.getAuthSession(), [routeKey]);
  const displayName = session?.fullName?.trim() || session?.email || "Sign in";
  const roleLabel = (session?.roles || [])[0] || "";
  const isAuthenticated = Boolean(session?.token);
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMiniSidenav = () => setMiniSidenav(dispatch, !miniSidenav);
  const handleConfiguratorOpen = () => setOpenConfigurator(dispatch, !openConfigurator);
  const handleOpenMenu = (event) => setOpenMenu(event.currentTarget);
  const handleCloseMenu = () => setOpenMenu(false);
  const handleOpenAccountMenu = (event) => setOpenAccountMenu(event.currentTarget);
  const handleCloseAccountMenu = () => setOpenAccountMenu(false);

  const handleNotificationClick = async (notification) => {
    handleCloseMenu();
    if (!notification.isRead) {
      try {
        await apiService.markNotificationRead(notification.id);
        setNotifications((current) =>
          current.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n))
        );
      } catch {
        // ignore — non-critical, will just retry to mark as read next time
      }
    }

    const tourId = notification.raw?.tourId;
    if (!tourId) return;
    const type = notification.raw?.type;
    const roles = apiService.getAuthSession()?.roles || [];
    const base = roles.includes("Admin") ? "/admin" : "/partner";
    navigate(type === "Tour" ? `${base}/tours/${tourId}` : `${base}/tours/${tourId}/registrations`);
  };

  const handleLogout = async () => {
    handleCloseAccountMenu();
    try {
      await apiService.logout();
    } catch {
      // ignore network errors on logout — clear the session client-side regardless
    } finally {
      navigate("/auth/sign-in", { replace: true });
    }
  };

  useEffect(() => {
    setTransparentNavbar(dispatch, false);
  }, [dispatch]);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    let isMounted = true;

    async function fetchNotifications() {
      try {
        const data = await apiService.getMyNotifications();
        if (isMounted) {
          setNotifications(Array.isArray(data) ? data : []);
        }
      } catch {
        // ignore — notification bell just stays empty on failure
      }
    }

    fetchNotifications();
    // Poll mỗi 60s làm dự phòng — khi real-time hoạt động, danh sách cập nhật ngay lúc có
    // thông báo mới; phòng trường hợp socket rớt/chưa kết nối lại thì vẫn có thông báo sau tối đa 60s.
    const intervalId = setInterval(fetchNotifications, 60000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      return undefined;
    }

    const unsubscribe = realtimeService.onNotification((raw) => {
      const incoming = normalizeNotification(raw);
      setNotifications((current) => {
        if (current.some((n) => n.id === incoming.id)) {
          return current;
        }
        return [incoming, ...current];
      });
    });

    return unsubscribe;
  }, [isAuthenticated]);

  // Render the notifications menu
  const renderMenu = () => (
    <Menu
      anchorEl={openMenu}
      anchorReference={null}
      anchorOrigin={{
        vertical: "bottom",
        horizontal: "left",
      }}
      open={Boolean(openMenu)}
      onClose={handleCloseMenu}
      sx={{ mt: 2 }}
    >
      {notifications.length === 0 ? (
        <SoftBox px={2} py={1.5} minWidth={220}>
          <SoftTypography variant="button" color="text">
            Chưa có thông báo nào.
          </SoftTypography>
        </SoftBox>
      ) : (
        notifications.map((notification) => (
          <NotificationItem
            key={notification.id}
            color={notification.isRead ? "secondary" : "info"}
            image={
              <Icon fontSize="small" sx={{ color: ({ palette: { white } }) => white.main }}>
                {notificationIcon(notification.raw?.type)}
              </Icon>
            }
            title={[notification.title, notification.isRead ? "" : "• mới"]}
            date={`${notification.message} — ${formatNotificationDate(notification.createdAt)}`}
            onClick={() => handleNotificationClick(notification)}
          />
        ))
      )}
    </Menu>
  );

  return (
    <AppBar
      position="static"
      color="inherit"
      sx={(theme) => navbar(theme, { transparentNavbar, absolute, light })}
    >
      <Toolbar sx={(theme) => navbarContainer(theme)}>
        <SoftBox color="inherit" mb={{ xs: 1, md: 0 }} sx={(theme) => navbarRow(theme, { isMini })}>
          <Breadcrumbs icon="home" title={route[route.length - 1]} route={route} light={light} />
        </SoftBox>
        {isMini ? null : (
          <SoftBox sx={(theme) => navbarRow(theme, { isMini })}>
            <SoftBox pr={1}>
              <SoftInput
                placeholder="Type here..."
                icon={{ component: "search", direction: "left" }}
              />
            </SoftBox>
            <SoftBox color={light ? "white" : "inherit"}>
              <IconButton sx={navbarIconButton} size="small" onClick={isAuthenticated ? handleOpenAccountMenu : undefined}>
                <Icon
                  sx={({ palette: { dark, white } }) => ({
                    color: light ? white.main : dark.main,
                  })}
                >
                  account_circle
                </Icon>
                <SoftTypography
                  variant="button"
                  fontWeight="medium"
                  color={light ? "white" : "dark"}
                  sx={{ maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                >
                  {displayName}
                </SoftTypography>
              </IconButton>
              <Menu
                anchorEl={openAccountMenu}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                transformOrigin={{ vertical: "top", horizontal: "right" }}
                open={Boolean(openAccountMenu)}
                onClose={handleCloseAccountMenu}
                sx={{ mt: 1 }}
              >
                <SoftBox px={2} py={1} minWidth={180}>
                  <SoftTypography variant="button" fontWeight="bold" display="block">
                    {displayName}
                  </SoftTypography>
                  {roleLabel ? (
                    <SoftTypography variant="caption" color="text">
                      {roleLabel}
                    </SoftTypography>
                  ) : null}
                </SoftBox>
                <Divider sx={{ my: 0.5 }} />
                <MenuItem onClick={handleLogout}>
                  <Icon sx={{ mr: 1 }} fontSize="small">logout</Icon>
                  Đăng xuất
                </MenuItem>
              </Menu>
              <IconButton
                size="small"
                color="inherit"
                sx={navbarMobileMenu}
                onClick={handleMiniSidenav}
              >
                <Icon className={light ? "text-white" : "text-dark"}>
                  {miniSidenav ? "menu_open" : "menu"}
                </Icon>
              </IconButton>
              <IconButton
                size="small"
                color="inherit"
                sx={navbarIconButton}
                onClick={handleConfiguratorOpen}
              >
                <Icon>settings</Icon>
              </IconButton>
              <IconButton
                size="small"
                color="inherit"
                sx={navbarIconButton}
                aria-controls="notification-menu"
                aria-haspopup="true"
                variant="contained"
                onClick={handleOpenMenu}
              >
                <Badge badgeContent={unreadCount} color="error" max={9} invisible={unreadCount === 0}>
                  <Icon className={light ? "text-white" : "text-dark"}>notifications</Icon>
                </Badge>
              </IconButton>
              {renderMenu()}
            </SoftBox>
          </SoftBox>
        )}
      </Toolbar>
    </AppBar>
  );
}

// Setting default values for the props of DashboardNavbar
DashboardNavbar.defaultProps = {
  absolute: false,
  light: false,
  isMini: false,
};

// Typechecking props for the DashboardNavbar
DashboardNavbar.propTypes = {
  absolute: PropTypes.bool,
  light: PropTypes.bool,
  isMini: PropTypes.bool,
};

export default DashboardNavbar;
