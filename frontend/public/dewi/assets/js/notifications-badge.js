(function () {
  var API_BASE = 'http://localhost:5041/api';

  function fmtDate(dateStr) {
    if (!dateStr) return '';
    var d = new Date(dateStr);
    return d.toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  }

  function iconForType(type) {
    return type === 'Payment' ? 'bi-cash-coin' : 'bi-bell-fill';
  }

  function init() {
    var bell = document.getElementById('notif-bell');
    var badge = document.getElementById('notif-badge');
    var listEl = document.getElementById('notif-dropdown-list');
    if (!bell || !badge || !listEl) return;

    var session = null;
    try {
      session = JSON.parse(localStorage.getItem('turtour.admin.session'));
    } catch (e) {}

    if (!session || !session.token) return;

    bell.style.display = 'flex';

    function updateBadge(notifications) {
      var unread = notifications.filter(function (n) { return !n.isRead; }).length;
      if (unread > 0) {
        badge.textContent = unread > 9 ? '9+' : String(unread);
        badge.style.display = 'block';
      } else {
        badge.style.display = 'none';
      }
    }

    function renderList(notifications) {
      if (!notifications || notifications.length === 0) {
        listEl.innerHTML = '<div class="notif-dropdown-empty">Bạn chưa có thông báo nào.</div>';
        return;
      }

      listEl.innerHTML = notifications.slice(0, 8).map(function (n) {
        return '<div class="notif-dropdown-item' + (n.isRead ? '' : ' unread') + '" data-notif-id="' + n.id + '">'
          + '<div class="notif-dropdown-icon' + (n.isRead ? ' read' : '') + '"><i class="bi ' + iconForType(n.type) + '"></i></div>'
          + '<div class="flex-grow-1">'
          + '<div class="notif-dropdown-title">' + n.title + '</div>'
          + '<div class="notif-dropdown-content">' + n.content + '</div>'
          + '<div class="notif-dropdown-date">' + fmtDate(n.createdAt) + '</div>'
          + '</div>'
          + '</div>';
      }).join('');

      listEl.querySelectorAll('[data-notif-id]').forEach(function (el) {
        el.addEventListener('click', function () {
          if (!el.classList.contains('unread')) return;
          var id = el.getAttribute('data-notif-id');
          fetch(API_BASE + '/notifications/' + id + '/read', {
            method: 'PUT',
            headers: { Authorization: 'Bearer ' + session.token }
          })
            .then(function (res) {
              if (!res.ok) throw new Error('HTTP ' + res.status);
              el.classList.remove('unread');
              var icon = el.querySelector('.notif-dropdown-icon');
              if (icon) icon.classList.add('read');
              updateBadge(currentNotifications.map(function (n) {
                return n.id === id ? Object.assign({}, n, { isRead: true }) : n;
              }));
              currentNotifications = currentNotifications.map(function (n) {
                return n.id === id ? Object.assign({}, n, { isRead: true }) : n;
              });
            })
            .catch(function () {});
        });
      });
    }

    var currentNotifications = [];

    function loadNotifications() {
      fetch(API_BASE + '/notifications/my', {
        headers: { Authorization: 'Bearer ' + session.token }
      })
        .then(function (res) {
          return res.ok ? res.json() : [];
        })
        .then(function (list) {
          currentNotifications = Array.isArray(list) ? list : [];
          updateBadge(currentNotifications);
          renderList(currentNotifications);
        })
        .catch(function () {});
    }

    loadNotifications();
    // Poll mỗi 60s làm dự phòng — khi real-time hoạt động, badge/danh sách cập nhật ngay
    // lúc có thông báo mới (không cần chờ tới lượt poll).
    setInterval(loadNotifications, 60000);

    var bellToggle = bell.querySelector('.notif-bell-toggle');
    if (bellToggle) {
      bellToggle.addEventListener('show.bs.dropdown', loadNotifications);
    }

    if (window.TurTourRealtime) {
      window.TurTourRealtime.onNotification(function () {
        loadNotifications();
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
