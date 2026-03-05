"use client";

import { useState } from "react";
import AdminLayout from "../../components/AdminLayout";

export default function AdminUploadPage() {
  const [files, setFiles] = useState([]);
    const [uploading, setUploading] = useState(false);

  async function handleUpload(e) {
    //adding multiple files into the upload handler
    const selectedFiles = e.target.files;
    if (selectedFiles.length === 0) return;

    setUploading(true);

    for (const file of selectedFiles) {
        const formData = new FormData();
        formData.append("file", file);
        
        await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        //add files to preview list
        setFiles((prev) => [...prev, file]);
    }
    setUploading(false);
    alert("Uploads complete!");
  }

  return (
    <AdminLayout>
      <section className="admin-hero">
        <div>
          <p className="admin-kicker">Media</p>
          <h1 className="admin-title">Upload Files</h1>
          <p className="admin-subtitle">
            Upload images or videos to your project gallery.
          </p>
        </div>
      </section>

      <section className="admin-card">
        <input
          type="file"
          multiple
          accept="image/*,video/*"
          onChange={handleUpload}
        />

        <div className="upload-preview">
          {files.map((file, i) => (
            <p key={i}>{file.name}</p>
          ))}
        </div>
      </section>
    </AdminLayout>
  );
}