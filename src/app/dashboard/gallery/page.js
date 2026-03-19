"use client";

import { useState } from "react";
import AdminLayout from "../../components/AdminLayout";

export default function AdminUploadPage() {
  const [files, setFiles] = useState([]);
    const [uploading, setUploading] = useState(false);

  // In your AdminUploadPage component
  async function handleUpload(e) {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length === 0) return;

    setUploading(true);

    const uploadedFiles = [];
    
    for (const file of selectedFiles) {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      
      if (data.url) {
        uploadedFiles.push({
          name: file.name,
          url: data.url,
          type: file.type.startsWith('video/') ? 'video' : 'image'
        });
      }
    }

    setFiles(prev => [...prev, ...uploadedFiles]);
    setUploading(false);
    alert(`${uploadedFiles.length} files uploaded!`);
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



