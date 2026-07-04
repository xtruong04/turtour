let _hidden = false;

export function hideSplash() {
  if (_hidden) return;
  _hidden = true;
  const loader = document.getElementById("app-loader");
  if (!loader) return;
  loader.classList.add("fade-out");
  setTimeout(() => loader.remove(), 320);
}

// Safety: always hide after 10s regardless
setTimeout(hideSplash, 10000);
