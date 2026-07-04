import { useState } from "react";
import PropTypes from "prop-types";

import { Editor } from "@tinymce/tinymce-react";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Snackbar from "@mui/material/Snackbar";

import apiService from "../services/apiService";

import "tinymce/tinymce";
import "tinymce/icons/default";
import "tinymce/models/dom/model";
import "tinymce/themes/silver";
import "tinymce/plugins/advlist";
import "tinymce/plugins/autolink";
import "tinymce/plugins/code";
import "tinymce/plugins/image";
import "tinymce/plugins/link";
import "tinymce/plugins/lists";
import "tinymce/plugins/media";
import "tinymce/plugins/preview";
import "tinymce/plugins/table";
import "tinymce/plugins/wordcount";
import "tinymce/skins/ui/oxide/skin.css";
import "tinymce/skins/content/default/content.css";

function TourDescriptionEditor({ value, onChange, height = 360 }) {
  const [uploadError, setUploadError] = useState("");

  return (
    <Box
      sx={{
        border: "1px solid #d2d6da",
        borderRadius: "0.75rem",
        overflow: "hidden",
        "& .tox": {
          border: "none !important",
        },
      }}
    >
      <Editor
        value={value}
        onEditorChange={onChange}
        init={{
          height,
          menubar: false,
          branding: false,
          promotion: false,
          license_key: "gpl",
          plugins: ["advlist", "autolink", "lists", "link", "image", "media", "table", "preview", "code", "wordcount"],
          toolbar:
            "undo redo | blocks | bold italic underline | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link image media table | removeformat preview code",
          block_formats: "Paragraph=p; Heading 2=h2; Heading 3=h3; Heading 4=h4",
          automatic_uploads: true,
          paste_data_images: true,
          file_picker_types: "image",
          images_upload_handler: async (blobInfo) => {
            const file = new File([blobInfo.blob()], blobInfo.filename(), { type: blobInfo.blob().type });
            return apiService.uploadImage(file);
          },
          file_picker_callback: (callback, _value, meta) => {
            if (meta.filetype !== "image") {
              return;
            }

            const input = document.createElement("input");
            input.setAttribute("type", "file");
            input.setAttribute("accept", "image/*");
            input.addEventListener("change", async () => {
              const file = input.files?.[0];
              if (!file) {
                return;
              }

              try {
                const url = await apiService.uploadImage(file);
                callback(url, { title: file.name });
              } catch (error) {
                setUploadError(error?.message || "Upload ảnh thất bại.");
              }
            });
            input.click();
          },
          content_style:
            "body { font-family: Roboto, Helvetica, Arial, sans-serif; font-size: 14px; padding: 12px; } img { max-width: 100%; height: auto; border-radius: 12px; }",
        }}
      />
      <Snackbar
        open={Boolean(uploadError)}
        autoHideDuration={4000}
        onClose={() => setUploadError("")}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="error" variant="filled" onClose={() => setUploadError("")}>
          {uploadError}
        </Alert>
      </Snackbar>
    </Box>
  );
}

TourDescriptionEditor.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  height: PropTypes.number,
};

TourDescriptionEditor.defaultProps = {
  value: "",
  height: 360,
};

export default TourDescriptionEditor;