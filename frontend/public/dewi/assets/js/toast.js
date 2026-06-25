/**
 * Lightweight toast notification utility — no external dependency.
 * Usage:
 *   showToast('Đăng ký thành công!', 'success');
 *   showToast('Có lỗi xảy ra.', 'error');
 *   showToast('Bạn cần đăng nhập.', 'info', { actionLabel: 'Đăng nhập', actionHref: '/auth/sign-in' });
 */
(function () {
  var COLORS = {
    success: '#4caf50',
    error: '#e84545',
    info: '#2196f3',
    warning: '#ff9800'
  };

  var ICONS = {
    success: 'bi-check-circle-fill',
    error: 'bi-x-circle-fill',
    info: 'bi-info-circle-fill',
    warning: 'bi-exclamation-triangle-fill'
  };

  function ensureContainer() {
    var container = document.getElementById('toast-container');
    if (container) return container;

    container = document.createElement('div');
    container.id = 'toast-container';
    container.style.position = 'fixed';
    container.style.top = '90px';
    container.style.right = '16px';
    container.style.zIndex = '99999';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = '10px';
    container.style.maxWidth = '340px';
    document.body.appendChild(container);

    var style = document.createElement('style');
    style.textContent =
      '@keyframes toast-in { from { opacity: 0; transform: translateX(30px); } to { opacity: 1; transform: translateX(0); } }' +
      '@keyframes toast-out { from { opacity: 1; transform: translateX(0); } to { opacity: 0; transform: translateX(30px); } }' +
      '.toast-item { animation: toast-in 0.25s ease; }' +
      '.toast-item.toast-closing { animation: toast-out 0.2s ease forwards; }';
    document.head.appendChild(style);

    return container;
  }

  function showToast(message, type, options) {
    type = type || 'info';
    options = options || {};
    var color = COLORS[type] || COLORS.info;
    var icon = ICONS[type] || ICONS.info;
    var container = ensureContainer();

    var toast = document.createElement('div');
    toast.className = 'toast-item';
    toast.style.background = '#fff';
    toast.style.borderLeft = '4px solid ' + color;
    toast.style.borderRadius = '8px';
    toast.style.boxShadow = '0 6px 20px rgba(0,0,0,0.12)';
    toast.style.padding = '14px 16px';
    toast.style.display = 'flex';
    toast.style.alignItems = 'flex-start';
    toast.style.gap = '10px';
    toast.style.fontSize = '0.88rem';
    toast.style.color = '#212529';

    var iconEl = document.createElement('i');
    iconEl.className = 'bi ' + icon;
    iconEl.style.color = color;
    iconEl.style.fontSize = '1.2rem';
    iconEl.style.flexShrink = '0';
    iconEl.style.marginTop = '2px';

    var bodyEl = document.createElement('div');
    bodyEl.style.flexGrow = '1';

    var msgEl = document.createElement('div');
    msgEl.textContent = message;
    bodyEl.appendChild(msgEl);

    if (options.actionLabel && options.actionHref) {
      var actionEl = document.createElement('a');
      actionEl.href = options.actionHref;
      actionEl.target = options.actionTarget || '_top';
      actionEl.textContent = options.actionLabel;
      actionEl.style.display = 'inline-block';
      actionEl.style.marginTop = '8px';
      actionEl.style.fontWeight = '700';
      actionEl.style.color = color;
      actionEl.style.textDecoration = 'underline';
      bodyEl.appendChild(actionEl);
    }

    var closeEl = document.createElement('button');
    closeEl.type = 'button';
    closeEl.innerHTML = '&times;';
    closeEl.setAttribute('aria-label', 'Đóng');
    closeEl.style.background = 'transparent';
    closeEl.style.border = 'none';
    closeEl.style.fontSize = '1.1rem';
    closeEl.style.lineHeight = '1';
    closeEl.style.cursor = 'pointer';
    closeEl.style.color = '#868e96';
    closeEl.style.flexShrink = '0';

    function close() {
      toast.classList.add('toast-closing');
      setTimeout(function () {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 200);
    }

    closeEl.addEventListener('click', close);

    toast.appendChild(iconEl);
    toast.appendChild(bodyEl);
    toast.appendChild(closeEl);
    container.appendChild(toast);

    var duration = options.duration || (type === 'error' ? 6000 : 4000);
    if (duration > 0) {
      setTimeout(close, duration);
    }

    return { close: close };
  }

  window.showToast = showToast;
})();
