(function () {
  var AUTH_STORAGE_KEY = 'turtour.admin.session';
  var originalFetch = window.fetch;
  var redirecting = false;

  function hasAuthHeader(options) {
    var headers = (options && options.headers) || {};
    return Boolean(headers.Authorization || headers.authorization);
  }

  // Mọi request có gửi token mà bị 401 (hết hạn / token không hợp lệ) thì tự xoá session
  // và đưa về trang đăng nhập — tránh để các trang public hiện lỗi 401 thô cho người dùng.
  window.fetch = function (url, options) {
    return originalFetch(url, options).then(function (res) {
      if (res.status === 401 && hasAuthHeader(options) && !redirecting) {
        redirecting = true;
        localStorage.removeItem(AUTH_STORAGE_KEY);
        if (window.showToast) {
          window.showToast('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.', 'info');
        }
        setTimeout(function () {
          window.location.href = '/auth/sign-in';
        }, 1200);
      }
      return res;
    });
  };
})();
