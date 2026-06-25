import { useEffect, useMemo } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import Icon from "@mui/material/Icon";
import { CacheProvider } from "@emotion/react";
import createCache from "@emotion/cache";
import rtlPlugin from "stylis-plugin-rtl";
import SoftBox from "components/SoftBox";
import Sidenav from "examples/Sidenav";
import Configurator from "examples/Configurator";
import theme from "assets/theme";
import themeRTL from "assets/theme/theme-rtl";
import routes from "./routes";
import { useSoftUIController, setOpenConfigurator } from "context";
import brand from "assets/images/logo-ct.png";
import UserLandingPage from "./components/UserLandingPage";
import apiService from "./services/apiService";

const ADMIN_PANEL_ROLES = ["Admin", "Organizator", "Company"];

function App() {
  const [controller, dispatch] = useSoftUIController();
  const { direction, layout, openConfigurator, sidenavColor } = controller;
  const { pathname } = useLocation();
  const isAuthRoute = pathname.startsWith("/auth/");
  const isAdminRoute = pathname.startsWith("/admin");
  const showConfigurator = false;

  const session = apiService.getAuthSession();
  const sessionRoles = session?.roles || [];
  const hasAdminAccess = ADMIN_PANEL_ROLES.some((role) => sessionRoles.includes(role));

  const rtlCache = useMemo(
    () =>
      createCache({
      key: "rtl",
      stylisPlugins: [rtlPlugin],
      }),
    []
  );

  const handleConfiguratorOpen = () => setOpenConfigurator(dispatch, !openConfigurator);

  useEffect(() => {
    document.body.setAttribute("dir", direction);
  }, [direction]);

  useEffect(() => {
    document.documentElement.scrollTop = 0;
    document.scrollingElement.scrollTop = 0;
  }, [pathname]);

  const getRoutes = (allRoutes) =>
    allRoutes.map((route) => {
      if (route.collapse) {
        return getRoutes(route.collapse);
      }

      if (route.route) {
        return <Route exact path={route.route} element={route.component} key={route.key} />;
      }

      return null;
    });

  const navRoutes = routes.filter((route) => route.type === "collapse" && !route.hidden);

  const configsButton = (
    <SoftBox
      display="flex"
      justifyContent="center"
      alignItems="center"
      width="3.5rem"
      height="3.5rem"
      bgColor="white"
      shadow="sm"
      borderRadius="50%"
      position="fixed"
      right="2rem"
      bottom="2rem"
      zIndex={99}
      color="dark"
      sx={{ cursor: "pointer" }}
      onClick={handleConfiguratorOpen}
    >
      <Icon fontSize="default" color="inherit">
        settings
      </Icon>
    </SoftBox>
  );

  if (isAdminRoute && !isAuthRoute && !hasAdminAccess) {
    return <Navigate to="/auth/sign-in" replace />;
  }

  return direction === "rtl" ? (
    <CacheProvider value={rtlCache}>
      <ThemeProvider theme={themeRTL}>
        <CssBaseline />
        {isAdminRoute && !isAuthRoute && layout === "dashboard" && (
          <>
            <Sidenav
              color={sidenavColor}
              brand={brand}
              brandName="TurTour Admin"
              routes={navRoutes}
            />
            {showConfigurator ? <Configurator /> : null}
            {showConfigurator ? configsButton : null}
          </>
        )}
        <Routes>
          {getRoutes(routes)}
          <Route path="/" element={<UserLandingPage />} />
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/auth/sign-in" />} />
        </Routes>
      </ThemeProvider>
    </CacheProvider>
  ) : (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {isAdminRoute && !isAuthRoute && layout === "dashboard" && (
        <>
          <Sidenav
            color={sidenavColor}
            brand={brand}
            brandName="TurTour Admin"
            routes={navRoutes}
          />
          {showConfigurator ? <Configurator /> : null}
          {showConfigurator ? configsButton : null}
        </>
      )}
      <Routes>
        {getRoutes(routes)}
        <Route path="/" element={<UserLandingPage />} />
        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/auth/sign-in" />} />
      </Routes>
    </ThemeProvider>
  );
}

export default App;
