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

  async function handleDelete(fileUrl) {
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

      <section className="admin-card">
        <h2>Gallery</h2>
        <div className="upload-preview">
          {galleryFiles.map((file, i) => (
            <div key={i} style={{ marginBottom: "20px" }}>
              {file.type === "image" ? (
                <img src={file.src} width={150} />
              ) : (
                <video src={file.src} width={150} controls />
              )}
              <p>{file.pathname.split("/").pop()}</p>
              <button onClick={() => handleDelete(file.src)}>Delete</button>
            </div>
          ))}
        </div>
      </section>
    </AdminLayout>
  );
}



