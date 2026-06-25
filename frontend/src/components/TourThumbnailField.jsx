import { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftButton from "components/SoftButton";
import SoftInput from "components/SoftInput";
import apiService from "../services/apiService";

const PREVIEW_WIDTH = 360;
const PREVIEW_HEIGHT = 200;
const EXPORT_WIDTH = 1280;
const EXPORT_HEIGHT = 720;

function loadImage(source) {
  return new Promise((resolve, reject) => {
    const image = new Image();

    if (!source.startsWith("data:image/")) {
      image.crossOrigin = "anonymous";
    }

    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Không thể tải ảnh để xử lý thumbnail."));
    image.src = source;
  });
}

function TourThumbnailField({ value, onChange, onError, allowEmptyHint }) {
  const inputRef = useRef(null);
  const dragStateRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [editorSource, setEditorSource] = useState(value || "");
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    setEditorSource(value || "");
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  }, [value]);

  const uploadAndCommit = async (fileOrBlob) => {
    setIsUploading(true);
    try {
      const url = await apiService.uploadImage(fileOrBlob);
      onChange(url);
    } catch (error) {
      onError?.(error?.message || "Không thể upload ảnh lên server.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleFile = (file) => {
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      onError?.("Vui lòng chọn đúng file ảnh cho thumbnail.");
      return;
    }

    const reader = new FileReader();
    reader.addEventListener("load", () => {
      if (typeof reader.result === "string") {
        setEditorSource(reader.result);
        setZoom(1);
        setPosition({ x: 0, y: 0 });
      }
    });
    reader.readAsDataURL(file);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);
    handleFile(event.dataTransfer.files?.[0]);
  };

  const handleInputChange = (nextValue) => {
    setEditorSource(nextValue);
    onChange(nextValue);
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  };

  const applyThumbnailTransform = async () => {
    if (!editorSource) {
      onChange("");
      return;
    }

    try {
      const image = await loadImage(editorSource);
      const canvas = document.createElement("canvas");
      canvas.width = EXPORT_WIDTH;
      canvas.height = EXPORT_HEIGHT;

      const context = canvas.getContext("2d");
      if (!context) {
        throw new Error("Không khởi tạo được bộ xử lý ảnh thumbnail.");
      }

      const scale = Math.min(EXPORT_WIDTH / image.width, EXPORT_HEIGHT / image.height) * zoom;
      const drawWidth = image.width * scale;
      const drawHeight = image.height * scale;
      const offsetX = (EXPORT_WIDTH - drawWidth) / 2 + (position.x / PREVIEW_WIDTH) * EXPORT_WIDTH;
      const offsetY = (EXPORT_HEIGHT - drawHeight) / 2 + (position.y / PREVIEW_HEIGHT) * EXPORT_HEIGHT;

      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, EXPORT_WIDTH, EXPORT_HEIGHT);
      context.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);

      const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92));
      if (!blob) {
        throw new Error("Không thể xuất ảnh thumbnail đã chỉnh sửa.");
      }

      setEditorSource(canvas.toDataURL("image/jpeg", 0.92));
      await uploadAndCommit(new File([blob], "thumbnail.jpg", { type: "image/jpeg" }));
    } catch (error) {
      onError?.(error?.message || "Không thể áp dụng chỉnh sửa cho thumbnail.");
    }
  };

  const startDrag = (clientX, clientY) => {
    dragStateRef.current = {
      startX: clientX,
      startY: clientY,
      originX: position.x,
      originY: position.y,
    };
  };

  const updateDrag = (clientX, clientY) => {
    if (!dragStateRef.current) {
      return;
    }

    const deltaX = clientX - dragStateRef.current.startX;
    const deltaY = clientY - dragStateRef.current.startY;

    setPosition({
      x: dragStateRef.current.originX + deltaX,
      y: dragStateRef.current.originY + deltaY,
    });
  };

  const stopDrag = () => {
    dragStateRef.current = null;
  };

  return (
    <>
      <SoftTypography variant="caption" fontWeight="bold">Thumbnail tour</SoftTypography>
      <SoftBox
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        sx={{
          mt: 1,
          p: 2,
          border: isDragging ? "2px dashed #17c1e8" : "2px dashed #d2d6da",
          borderRadius: "1rem",
          backgroundColor: isDragging ? "rgba(23, 193, 232, 0.08)" : "#f8f9fa",
          transition: "all 0.2s ease",
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={(event) => handleFile(event.target.files?.[0])}
        />
        <SoftTypography variant="button" fontWeight="medium">
          Kéo ảnh từ máy tính vào đây hoặc chọn ảnh để làm thumbnail.
        </SoftTypography>
        <SoftBox mt={1.5} display="flex" gap={1} flexWrap="wrap" alignItems="center">
          <SoftButton
            type="button"
            variant="gradient"
            color="info"
            disabled={isUploading}
            onClick={() => inputRef.current?.click()}
          >
            Chọn ảnh từ PC
          </SoftButton>
          {isUploading ? (
            <SoftTypography variant="caption" color="info">Đang upload ảnh lên R2…</SoftTypography>
          ) : null}
          {editorSource ? (
            <SoftButton
              type="button"
              variant="outlined"
              color="secondary"
              disabled={isUploading}
              onClick={() => {
                setEditorSource("");
                setZoom(1);
                setPosition({ x: 0, y: 0 });
                onChange("");
              }}
            >
              Xóa thumbnail
            </SoftButton>
          ) : null}
        </SoftBox>
      </SoftBox>

      <SoftBox mt={1.5}>
        <SoftInput
          placeholder="Hoặc dán URL ảnh đại diện nếu cần"
          value={editorSource}
          onChange={(event) => handleInputChange(event.target.value)}
        />
      </SoftBox>

      <SoftTypography variant="caption" color="text" display="block" mt={0.75}>
        {allowEmptyHint
          ? "Chỉnh khung/zoom rồi bấm \"Áp dụng zoom và vị trí\" để upload ảnh lên server, hoặc để trống nếu muốn xóa thumbnail hiện tại."
          : "Chỉnh khung/zoom rồi bấm \"Áp dụng zoom và vị trí\" để upload ảnh lên server, hoặc dán URL ảnh có sẵn."}
      </SoftTypography>

      {editorSource ? (
        <SoftBox mt={1.5}>
          <SoftTypography variant="caption" fontWeight="bold">Chỉnh khung thumbnail</SoftTypography>
          <SoftBox
            mt={1}
            sx={{
              width: "100%",
              maxWidth: PREVIEW_WIDTH,
              height: PREVIEW_HEIGHT,
              overflow: "hidden",
              position: "relative",
              borderRadius: "0.75rem",
              border: "1px solid #d2d6da",
              backgroundColor: "#111827",
              cursor: dragStateRef.current ? "grabbing" : "grab",
              touchAction: "none",
            }}
            onMouseDown={(event) => startDrag(event.clientX, event.clientY)}
            onMouseMove={(event) => updateDrag(event.clientX, event.clientY)}
            onMouseUp={stopDrag}
            onMouseLeave={stopDrag}
            onTouchStart={(event) => {
              const touch = event.touches[0];
              if (touch) {
                startDrag(touch.clientX, touch.clientY);
              }
            }}
            onTouchMove={(event) => {
              const touch = event.touches[0];
              if (touch) {
                updateDrag(touch.clientX, touch.clientY);
              }
            }}
            onTouchEnd={stopDrag}
          >
            <SoftBox
              component="img"
              src={editorSource}
              alt="Thumbnail preview"
              draggable={false}
              sx={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
                userSelect: "none",
                transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
                transformOrigin: "center center",
                pointerEvents: "none",
              }}
            />
            <SoftBox
              sx={{
                position: "absolute",
                inset: 0,
                boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.3)",
                pointerEvents: "none",
              }}
            />
          </SoftBox>

          <SoftBox mt={1.5} maxWidth={PREVIEW_WIDTH}>
            <SoftBox display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
              <SoftTypography variant="caption" fontWeight="medium">Phóng to / thu nhỏ</SoftTypography>
              <SoftTypography variant="caption" color="text">{zoom.toFixed(1)}x</SoftTypography>
            </SoftBox>
            <SoftBox
              component="input"
              type="range"
              min="1"
              max="3"
              step="0.1"
              value={zoom}
              onChange={(event) => setZoom(Number(event.target.value))}
              sx={{ width: "100%" }}
            />
          </SoftBox>

          <SoftBox mt={1.5} display="flex" gap={1} flexWrap="wrap">
            <SoftButton type="button" variant="outlined" color="dark" onClick={() => { setZoom(1); setPosition({ x: 0, y: 0 }); }}>
              Đặt lại khung ảnh
            </SoftButton>
            <SoftButton
              type="button"
              variant="gradient"
              color="info"
              disabled={isUploading}
              onClick={applyThumbnailTransform}
            >
              {isUploading ? "Đang upload..." : "Áp dụng zoom và vị trí"}
            </SoftButton>
          </SoftBox>
        </SoftBox>
      ) : null}
    </>
  );
}

TourThumbnailField.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  onError: PropTypes.func,
  allowEmptyHint: PropTypes.bool,
};

TourThumbnailField.defaultProps = {
  value: "",
  onError: undefined,
  allowEmptyHint: false,
};

export default TourThumbnailField;