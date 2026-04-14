"use client";

import { useState, useEffect } from "react";
import AdminLayout from "../../components/AdminLayout";

export default function AdminUploadPage() {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [galleryFiles, setGalleryFiles] = useState([]);

  //fetch the gallery media on mount
  useEffect(() => {
  async function fetchGallery() {
    try {
      const res = await fetch("/api/ScanMedia");
      const data = await res.json();
      setGalleryFiles(data || []); // data is the array returned from your GET API
    } catch (err) {
      console.error("Failed to fetch gallery files:", err);
    }
  }

  fetchGallery();
}, []);

  // In your AdminUploadPage component
  async function handleUpload(e) {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length === 0) return;

    setUploading(true);

    const uploadedFiles = [];
    const uploadErrors = [];
    
    try {
      for (const file of selectedFiles) {
        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        const data = await res.json();
        
        if (res.ok && data.url) {
          uploadedFiles.push({
            name: file.name,
            url: data.url,
            type: file.type.startsWith('video/') ? 'video' : 'image'
          });
          continue;
        }

        uploadErrors.push(`${file.name}: ${data.error || 'Upload failed'}`);
      }

      setFiles(prev => [...prev, ...uploadedFiles]);

      if (uploadedFiles.length > 0) {
        const refreshed = await fetch("/api/ScanMedia");
        const refreshedData = await refreshed.json();
        setGalleryFiles(refreshedData || []);
      }

      const messages = [];
      if (uploadedFiles.length > 0) messages.push(`${uploadedFiles.length} files uploaded.`);
      if (uploadErrors.length > 0) messages.push(uploadErrors.join("\n"));

      alert(messages.join("\n\n") || "No files were uploaded.");
    } catch (err) {
      console.error("Upload failed:", err);
      alert("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(fileUrl) {
    //asks user whether you wnat to confirm the delete action, if not, return early
    const confirmDelete = window.confirm("Are you sure you want to delete this file?");
    if (!confirmDelete) return; // user clicked cancel
    
    try {
      const formData = new FormData();
      formData.append("url", fileUrl); // could also append pathname

      const res = await fetch("/api/DeleteMedia", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (data.success) {
        setGalleryFiles(prev => prev.filter(file => file.src !== fileUrl));
      } else {
        alert("Delete failed");
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting file");
    }
}


  return (
    <AdminLayout>
      <section className="admin-hero">
        <div>
          <h1 className="admin-title">Upload Files</h1>
          <p className="admin-subtitle">
            Upload images or videos to your project gallery.
          </p>
        </div>
      </section>

      <section className="admin-card max-h-23">
        <input
          type="file"
          multiple
          accept="image/*,video/*"
          onChange={handleUpload}
          className="p-4 rounded-2xl text-white bg-[#477a40] active:scale-95 hover:scale-105 hover:cursor-pointer hover:border-2 hover:shadow-lg items-center text-center"
        />

        <div className="upload-preview">
          {files.map((file, i) => (
            <p key={i}>{file.name}</p>
          ))}
        </div>
      </section>

      <section className="admin-card">
        <h2 className="admin-section-title">Gallery</h2>
        <br />
        <div className="upload-preview">
          {galleryFiles.map((file, i) => (
            <div key={i} style={{ marginBottom: "20px" }}>
              <p className="admin-subtitle">{file.pathname.split("/").pop()}</p>
              {file.type === "image" ? (
                <img src={file.src} width={150} />
              ) : (
                <video src={file.src} width={150} controls />
              )}
              <button onClick={() => handleDelete(file.src)} className="admin-btn admin-btn--danger mt-4">
                Delete
              </button>
            </div>
          ))}
        </div>
      </section>
    </AdminLayout>
  );
}



