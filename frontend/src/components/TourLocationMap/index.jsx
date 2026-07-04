import { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";

async function nominatim(query) {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`,
    { headers: { "User-Agent": "TurTour/1.0" } }
  );
  const data = await res.json();
  if (!Array.isArray(data) || data.length === 0) return null;
  return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
}

// Thử geocode từng mức: địa chỉ đầy đủ → cắt bớt phần đầu (tên POI) → chỉ giữ quận/tỉnh
async function geocodeAddress(address) {
  const suffix = /việt nam/i.test(address) ? "" : ", Việt Nam";
  const parts = address.split(",").map((s) => s.trim()).filter(Boolean);

  for (let i = 0; i < parts.length; i++) {
    const query = parts.slice(i).join(", ") + suffix;
    const result = await nominatim(query);
    if (result) return result;
  }
  return null;
}

function TourLocationMap({ address }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const [status, setStatus] = useState("loading"); // loading | found | notfound | empty

  useEffect(() => {
    if (!address?.trim()) {
      setStatus("empty");
      return;
    }

    setStatus("loading");

    // Dùng dynamic import để tránh lỗi SSR / khởi tạo sớm của Leaflet
    let cancelled = false;
    Promise.all([
      import("leaflet"),
      import("leaflet/dist/leaflet.css"),
      geocodeAddress(address),
    ]).then(([{ default: L }, , coords]) => {
      if (cancelled || !containerRef.current) return;

      if (!coords) {
        setStatus("notfound");
        return;
      }

      // Huỷ map cũ nếu có (address thay đổi)
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }

      // Fix lỗi icon path trong Vite build
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const map = L.map(containerRef.current, { scrollWheelZoom: false }).setView(
        [coords.lat, coords.lng],
        15
      );
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);
      L.marker([coords.lat, coords.lng]).addTo(map).bindPopup(address).openPopup();

      mapRef.current = map;
      setStatus("found");
    }).catch(() => {
      if (!cancelled) setStatus("notfound");
    });

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [address]);

  const containerStyle = {
    height: 300,
    width: "100%",
    borderRadius: 12,
    border: "1px solid #d9caa6",
    overflow: "hidden",
    position: "relative",
  };

  if (status === "empty") {
    return (
      <div style={{ ...containerStyle, display: "flex", alignItems: "center", justifyContent: "center", background: "#f8f9fa", height: 56 }}>
        <span style={{ fontSize: 13, color: "#8392ab" }}>Tour chưa có địa chỉ cụ thể.</span>
      </div>
    );
  }

  if (status === "notfound") {
    return (
      <div style={{ ...containerStyle, display: "flex", alignItems: "center", justifyContent: "center", background: "#f8f9fa", height: 56 }}>
        <span style={{ fontSize: 13, color: "#8392ab" }}>Không tìm thấy vị trí trên bản đồ cho địa chỉ này.</span>
      </div>
    );
  }

  return (
    <div style={{ position: "relative" }}>
      {status === "loading" && (
        <div style={{
          position: "absolute", inset: 0, zIndex: 10,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "#f8f9fa", borderRadius: 12, border: "1px solid #d9caa6",
          height: 300,
        }}>
          <span style={{ fontSize: 13, color: "#8392ab" }}>Đang tải bản đồ...</span>
        </div>
      )}
      <div ref={containerRef} style={{ ...containerStyle, visibility: status === "found" ? "visible" : "hidden" }} />
    </div>
  );
}

TourLocationMap.propTypes = {
  address: PropTypes.string,
};

TourLocationMap.defaultProps = {
  address: "",
};

export default TourLocationMap;
