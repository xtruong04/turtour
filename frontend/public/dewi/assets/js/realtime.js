(function () {
  var HUB_URL = window.TURTOUR_HUB_URL;
  var AUTH_STORAGE_KEY = 'turtour.admin.session';

  function getToken() {
    try {
      var session = JSON.parse(localStorage.getItem(AUTH_STORAGE_KEY));
      return (session && session.token) || '';
    } catch (e) {
      return '';
    }
  }

  var connection = null;

  function getConnection() {
    if (connection) {
      return connection;
    }
    if (!window.signalR) {
      return null;
    }

    connection = new window.signalR.HubConnectionBuilder()
      .withUrl(HUB_URL, { accessTokenFactory: getToken, withCredentials: false })
      .withAutomaticReconnect()
      .build();

    connection.start().catch(function () {
      // Real-time tạm thời không kết nối được — trang vẫn dùng được bình thường,
      // chỉ là không tự cập nhật ngay lập tức (đã có poll/F5 dự phòng ở từng trang).
    });

    return connection;
  }

  function on(event, callback) {
    var conn = getConnection();
    if (!conn) return function () {};
    conn.on(event, callback);
    return function () { conn.off(event, callback); };
  }

  window.TurTourRealtime = {
    onNotification: function (callback) { return on('ReceiveNotification', callback); },
    onTourUpdated: function (callback) { return on('TourUpdated', callback); },
    onAdminBoardUpdated: function (callback) { return on('AdminBoardUpdated', callback); },
    onNewContact: function (callback) { return on('NewContact', callback); },
  };
})();
