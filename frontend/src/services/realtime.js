import * as signalR from "@microsoft/signalr";

const API_BASE_URL = import.meta.env.VITE_API_URL || "https://localhost:5000/api";
const HUB_URL = `${API_BASE_URL.replace(/\/api\/?$/, "")}/hubs/app`;
const AUTH_STORAGE_KEY = "turtour.admin.session";

function getToken() {
  try {
    const session = JSON.parse(localStorage.getItem(AUTH_STORAGE_KEY));
    return session?.token || null;
  } catch {
    return null;
  }
}

let connection = null;

// Kết nối SignalR dùng chung cho toàn app admin — gọi nhiều lần chỉ trả về connection đã có,
// tránh mở nhiều socket trùng lặp giữa các trang/component.
function getConnection() {
  if (connection) {
    return connection;
  }

  connection = new signalR.HubConnectionBuilder()
    .withUrl(HUB_URL, {
      accessTokenFactory: () => getToken() || "",
      withCredentials: false,
    })
    .withAutomaticReconnect()
    .build();

  connection.start().catch(() => {
    // Không chặn UI nếu real-time tạm thời không kết nối được — các trang vẫn hoạt động
    // bình thường qua API thông thường, chỉ là không tự cập nhật ngay lập tức.
  });

  return connection;
}

function on(event, callback) {
  const conn = getConnection();
  conn.on(event, callback);
  return () => conn.off(event, callback);
}

const realtimeService = {
  onNotification(callback) {
    return on("ReceiveNotification", callback);
  },
  onTourUpdated(callback) {
    return on("TourUpdated", callback);
  },
  onAdminBoardUpdated(callback) {
    return on("AdminBoardUpdated", callback);
  },
};

export default realtimeService;
