import { useLocation } from "react-router-dom";

// Các trang quản lý Tour (list/create/edit/details/delete/registrations) được dùng chung
// cho cả Admin ("/admin/tours/...") và đối tác Company/Organizator ("/partner/tours/...") —
// hook này cho biết đang ở namespace nào để các Link nội bộ trỏ đúng chỗ.
export default function useTourBasePath() {
  const { pathname } = useLocation();
  return pathname.startsWith("/partner") ? "/partner" : "/admin";
}
