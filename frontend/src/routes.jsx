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

/** 
  All of the routes for the Soft UI Dashboard React are added here,
  You can add a new route, customize the routes and delete the routes here.

  Once you add a new route on this file it will be visible automatically on
  the Sidenav.

  For adding a new route you can follow the existing routes in the routes array.
  1. The `type` key with the `collapse` value is used for a route.
  2. The `type` key with the `title` value is used for a title inside the Sidenav. 
  3. The `type` key with the `divider` value is used for a divider between Sidenav items.
  4. The `name` key is used for the name of the route on the Sidenav.
  5. The `key` key is used for the key of the route (It will help you with the key prop inside a loop).
  6. The `icon` key is used for the icon of the route on the Sidenav, you have to add a node.
  7. The `collapse` key is used for making a collapsible item on the Sidenav that has other routes
  inside (nested routes), you need to pass the nested routes inside an array as a value for the `collapse` key.
  8. The `route` key is used to store the route location which is used for the react router.
  9. The `href` key is used to store the external links location.
  10. The `title` key is only for the item with the type of `title` and its used for the title text on the Sidenav.
  10. The `component` key is used to store the component of its route.
*/

import Dashboard from "layouts/dashboard";
import PartnerDashboard from "layouts/partner/dashboard";
import PartnerReports from "layouts/partner/reports";
import PartnerPaymentSettings from "layouts/partner/payment-settings";
import Tours from "layouts/tours";
import TourPendingApproval from "layouts/tours/pending-approval";
import TourCreate from "layouts/tours/create";
import TourDetails from "layouts/tours/details";
import TourEdit from "layouts/tours/edit";
import TourDelete from "layouts/tours/delete";
import TourRegistrations from "layouts/tours/registrations";
import Companies from "layouts/companies";
import Contacts from "layouts/contacts";
import Payments from "layouts/payments";
import Reports from "layouts/reports";
import Tables from "layouts/tables";
import Billing from "layouts/billing";
import VirtualReality from "layouts/virtual-reality";
import RTL from "layouts/rtl";
import Profile from "layouts/profile";
import SignIn from "layouts/authentication/sign-in";
import SignUp from "layouts/authentication/sign-up";
import ConfirmEmail from "layouts/authentication/confirm-email";

import Shop from "examples/Icons/Shop";
import Office from "examples/Icons/Office";
import Settings from "examples/Icons/Settings";
import Document from "examples/Icons/Document";
import SpaceShip from "examples/Icons/SpaceShip";
import CustomerSupport from "examples/Icons/CustomerSupport";
import CreditCard from "examples/Icons/CreditCard";
import Basket from "examples/Icons/Basket";
import Cube from "examples/Icons/Cube";

const routes = [
  {
    type: "collapse",
    name: "Admin Dashboard",
    key: "dashboard",
    route: "/admin/dashboard",
    icon: <Shop size="12px" />,
    component: <Dashboard />,
    noCollapse: true,
    roles: ["Admin"],
  },
  {
    type: "collapse",
    name: "Tour",
    key: "tours",
    route: "/admin/tours",
    icon: <Office size="12px" />,
    component: <Tours />,
    noCollapse: true,
    roles: ["Admin"],
  },
  {
    type: "collapse",
    name: "Tour chờ duyệt",
    key: "tour-pending-approval",
    route: "/admin/tours/pending-approval",
    icon: <Office size="12px" />,
    component: <TourPendingApproval />,
    noCollapse: true,
    roles: ["Admin"],
  },
  {
    type: "collapse",
    name: "Tour Create",
    key: "tour-create",
    route: "/admin/tours/create",
    icon: <Office size="12px" />,
    component: <TourCreate />,
    noCollapse: true,
    hidden: true,
    roles: ["Admin"],
  },
  {
    type: "collapse",
    name: "Tour Details",
    key: "tour-details",
    route: "/admin/tours/:id",
    icon: <Office size="12px" />,
    component: <TourDetails />,
    noCollapse: true,
    hidden: true,
    roles: ["Admin"],
  },
  {
    type: "collapse",
    name: "Tour Edit",
    key: "tour-edit",
    route: "/admin/tours/:id/edit",
    icon: <Office size="12px" />,
    component: <TourEdit />,
    noCollapse: true,
    hidden: true,
    roles: ["Admin"],
  },
  {
    type: "collapse",
    name: "Tour Delete",
    key: "tour-delete",
    route: "/admin/tours/:id/delete",
    icon: <Office size="12px" />,
    component: <TourDelete />,
    noCollapse: true,
    hidden: true,
    roles: ["Admin"],
  },
  {
    type: "collapse",
    name: "Tour Registrations",
    key: "tour-registrations",
    route: "/admin/tours/:id/registrations",
    icon: <Office size="12px" />,
    component: <TourRegistrations />,
    noCollapse: true,
    hidden: true,
    roles: ["Admin"],
  },
  {
    type: "collapse",
    name: "Đối tác Dashboard",
    key: "partner-dashboard",
    route: "/partner/dashboard",
    icon: <Shop size="12px" />,
    component: <PartnerDashboard />,
    noCollapse: true,
    roles: ["Organizator", "Company"],
  },
  {
    type: "collapse",
    name: "Tour của tôi",
    key: "partner-tours",
    route: "/partner/tours",
    icon: <Office size="12px" />,
    component: <Tours />,
    noCollapse: true,
    roles: ["Organizator", "Company"],
  },
  {
    type: "collapse",
    name: "Partner Tour Create",
    key: "partner-tour-create",
    route: "/partner/tours/create",
    icon: <Office size="12px" />,
    component: <TourCreate />,
    noCollapse: true,
    hidden: true,
    roles: ["Organizator", "Company"],
  },
  {
    type: "collapse",
    name: "Partner Tour Details",
    key: "partner-tour-details",
    route: "/partner/tours/:id",
    icon: <Office size="12px" />,
    component: <TourDetails />,
    noCollapse: true,
    hidden: true,
    roles: ["Organizator", "Company"],
  },
  {
    type: "collapse",
    name: "Partner Tour Edit",
    key: "partner-tour-edit",
    route: "/partner/tours/:id/edit",
    icon: <Office size="12px" />,
    component: <TourEdit />,
    noCollapse: true,
    hidden: true,
    roles: ["Organizator", "Company"],
  },
  {
    type: "collapse",
    name: "Partner Tour Delete",
    key: "partner-tour-delete",
    route: "/partner/tours/:id/delete",
    icon: <Office size="12px" />,
    component: <TourDelete />,
    noCollapse: true,
    hidden: true,
    roles: ["Organizator", "Company"],
  },
  {
    type: "collapse",
    name: "Partner Tour Registrations",
    key: "partner-tour-registrations",
    route: "/partner/tours/:id/registrations",
    icon: <Office size="12px" />,
    component: <TourRegistrations />,
    noCollapse: true,
    hidden: true,
    roles: ["Organizator", "Company"],
  },
  {
    type: "collapse",
    name: "Báo cáo",
    key: "partner-reports",
    route: "/partner/reports",
    icon: <Document size="12px" />,
    component: <PartnerReports />,
    noCollapse: true,
    roles: ["Organizator", "Company"],
  },
  {
    type: "collapse",
    name: "Tài khoản thanh toán",
    key: "partner-payment-settings",
    route: "/partner/payment-settings",
    icon: <Settings size="12px" />,
    component: <PartnerPaymentSettings />,
    noCollapse: true,
    roles: ["Company"],
  },
  {
    type: "collapse",
    name: "Doanh nghiệp",
    key: "companies",
    route: "/admin/companies",
    icon: <Basket size="12px" />,
    component: <Companies />,
    noCollapse: true,
    roles: ["Admin"],
  },
  {
    type: "collapse",
    name: "Liên hệ",
    key: "contacts",
    route: "/admin/contacts",
    icon: <CustomerSupport size="12px" />,
    component: <Contacts />,
    noCollapse: true,
    roles: ["Admin"],
  },
  {
    type: "collapse",
    name: "Thanh toán",
    key: "payments",
    route: "/admin/payments",
    icon: <CreditCard size="12px" />,
    component: <Payments />,
    noCollapse: true,
    roles: ["Admin"],
  },
  {
    type: "collapse",
    name: "Báo cáo",
    key: "reports",
    route: "/admin/reports",
    icon: <Document size="12px" />,
    component: <Reports />,
    noCollapse: true,
    roles: ["Admin"],
  },
  {
    type: "collapse",
    name: "Tables",
    key: "tables",
    route: "/tables",
    icon: <Office size="12px" />,
    component: <Tables />,
    noCollapse: true,
    hidden: true,
  },
  {
    type: "collapse",
    name: "Billing",
    key: "billing",
    route: "/billing",
    icon: <CreditCard size="12px" />,
    component: <Billing />,
    noCollapse: true,
    hidden: true,
  },
  {
    type: "collapse",
    name: "Virtual Reality",
    key: "virtual-reality",
    route: "/virtual-reality",
    icon: <Cube size="12px" />,
    component: <VirtualReality />,
    noCollapse: true,
    hidden: true,
  },
  {
    type: "collapse",
    name: "RTL",
    key: "rtl",
    route: "/rtl",
    icon: <Settings size="12px" />,
    component: <RTL />,
    noCollapse: true,
    hidden: true,
  },
  {
    type: "collapse",
    name: "Profile",
    key: "profile",
    route: "/profile",
    icon: <CustomerSupport size="12px" />,
    component: <Profile />,
    noCollapse: true,
    hidden: true,
  },
  {
    type: "collapse",
    name: "Auth Sign In",
    key: "sign-in",
    route: "/auth/sign-in",
    icon: <Document size="12px" />,
    component: <SignIn />,
    noCollapse: true,
    hidden: true,
  },
  {
    type: "collapse",
    name: "Auth Sign Up",
    key: "sign-up",
    route: "/auth/sign-up",
    icon: <SpaceShip size="12px" />,
    component: <SignUp />,
    noCollapse: true,
    hidden: true,
  },
  {
    type: "collapse",
    name: "Confirm Email",
    key: "confirm-email",
    route: "/auth/confirm-email",
    icon: <Document size="12px" />,
    component: <ConfirmEmail />,
    noCollapse: true,
    hidden: true,
  },
];

export default routes;
