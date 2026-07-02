/**
 * header-avatar.js
 * Chèn card profile (avatar + tên + email) vào đầu dropdown menu khi đăng nhập.
 * Nút toggle ngoài header giữ nguyên icon mặc định (bi-person-circle).
 */
(function () {
  'use strict';

  /* ── CSS cho card bên trong dropdown ── */
  (function injectStyles() {
    if (document.getElementById('header-avatar-styles')) return;
    var s = document.createElement('style');
    s.id = 'header-avatar-styles';
    s.textContent =
      '.dp-profile-card{display:flex;align-items:center;gap:12px;padding:14px 16px 12px;pointer-events:none;}' +
      '.dp-avatar{width:46px;height:46px;border-radius:50%;overflow:hidden;flex-shrink:0;' +
        'display:flex;align-items:center;justify-content:center;' +
        'background:linear-gradient(135deg,#e84545,#ff7b7b);' +
        'border:2px solid #f1f3f5;' +
        'color:#fff;font-size:.95rem;font-weight:800;text-transform:uppercase;}' +
      '.dp-avatar img{width:100%;height:100%;object-fit:cover;border-radius:50%;display:block;}' +
      '.dp-info{min-width:0;}' +
      '.dp-name{display:block;font-size:.88rem;font-weight:700;color:#1a1a2e;' +
        'white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:170px;}' +
      '.dp-email{display:block;font-size:.74rem;color:#868e96;margin-top:2px;' +
        'white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:170px;}' +
      '.dp-divider{margin:4px 0 0!important;}';
    (document.head || document.documentElement).appendChild(s);
  })();

  function applyAvatar(el, url, initial) {
    if (!el) return;
    if (url) {
      var img = new Image();
      img.alt = 'avatar';
      img.style.cssText = 'width:100%;height:100%;object-fit:cover;border-radius:50%;display:block;';
      img.onload  = function () { el.innerHTML = ''; el.appendChild(img); };
      img.onerror = function () { el.innerHTML = ''; el.textContent = initial; };
      img.src = url;
    } else {
      el.innerHTML = '';
      el.textContent = initial;
    }
  }

  function buildCard(menu, initial, name, email) {
    if (!menu || menu.querySelector('.dp-profile-card')) return;

    var card = document.createElement('li');
    card.innerHTML =
      '<div class="dp-profile-card">' +
        '<div class="dp-avatar" id="dp-avatar-inner">' + initial + '</div>' +
        '<div class="dp-info">' +
          '<span class="dp-name">' + (name || '') + '</span>' +
          '<span class="dp-email">' + (email || '') + '</span>' +
        '</div>' +
      '</div>';

    var divider = document.createElement('li');
    divider.innerHTML = '<hr class="dropdown-divider dp-divider">';

    menu.insertBefore(divider, menu.firstChild);
    menu.insertBefore(card, menu.firstChild);
  }

  window.initHeaderAvatar = function () {
    var menu = document.querySelector('.auth-profile-menu');
    if (!menu) return;

    var session = null;
    try { session = JSON.parse(localStorage.getItem('turtour.admin.session')); } catch { /* ignore */ }
    if (!session || !session.token) return;

    var name    = session.fullName || session.email || '?';
    var email   = session.email || '';
    var initial = name.trim().charAt(0).toUpperCase();

    buildCard(menu, initial, name, email);

    /* Dùng cache nếu có */
    if (session.avatarUrl) {
      applyAvatar(document.getElementById('dp-avatar-inner'), session.avatarUrl, initial);
      return;
    }

    /* Fetch API để lấy avatarUrl */
    var apiBase = window.TURTOUR_API_BASE;
    if (!apiBase) return;

    fetch(apiBase + '/auth/me', { headers: { Authorization: 'Bearer ' + session.token } })
      .then(function (res) { return res.ok ? res.json() : null; })
      .then(function (profile) {
        if (!profile) return;

        var nameEl  = document.querySelector('.dp-name');
        var emailEl = document.querySelector('.dp-email');
        if (nameEl)  nameEl.textContent  = profile.fullName  || name;
        if (emailEl) emailEl.textContent = profile.email     || email;

        if (!profile.avatarUrl) return;
        session.avatarUrl = profile.avatarUrl;
        try { localStorage.setItem('turtour.admin.session', JSON.stringify(session)); } catch { /* ignore */ }

        applyAvatar(document.getElementById('dp-avatar-inner'), profile.avatarUrl, initial);
      })
      .catch(function () {});
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', window.initHeaderAvatar);
  } else {
    window.initHeaderAvatar();
  }
})();
