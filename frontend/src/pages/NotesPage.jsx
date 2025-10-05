import React, { useEffect, useState, useMemo } from "react";
import PageHeader from "../components/PageHeader";

export default function NotesPage() {
  const [notes, setNotes] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [category, setCategory] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const API = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const token = localStorage.getItem("token");

  const fetchNotes = async () => {
    try {
      const res = await fetch(`${API}/notes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setNotes(data);
    } catch (err) {
      console.error("Error fetching notes:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchNotes();
  }, []);

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!title || !file) return alert("Title and file are required");

    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("file", file);
    formData.append("category", category);

    try {
      const res = await fetch(`${API}/notes`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Upload failed' }));
        alert(err.message || 'Failed to upload note');
        return;
      }

      const newNote = await res.json();
      setNotes([newNote, ...notes]);

      setTitle("");
      setDescription("");
      setFile(null);
      setCategory("");
      document.getElementById("fileInput").value = null;

      setTimeout(() => {
        const section = document.querySelector('[data-section="notes-collection"]');
        if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);

      try { localStorage.setItem('notes-updated', String(Date.now())); } catch {}
    } catch (err) {
      console.error("Error uploading note:", err);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this note?")) return;
    try {
      const res = await fetch(`${API}/notes/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Delete failed' }));
        alert(err.message || 'Failed to delete note');
        return;
      }
      setNotes((prev) => prev.filter((n) => n._id !== id));
      try { localStorage.setItem('notes-updated', String(Date.now())); } catch {}
    } catch (err) {
      console.error("Error deleting note:", err);
    }
  };

  const toggleFavorite = async (noteId, currentValue) => {
    try {
      const res = await fetch(`${API}/notes/${noteId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ favorite: !currentValue }),
      });
      const updatedNote = await res.json();
      setNotes(notes.map((n) => (n._id === noteId ? updatedNote : n)));
    } catch (err) {
      console.error("Error updating favorite:", err);
    }
  };

  const filteredNotes = useMemo(() => {
    return notes.filter(
      (n) =>
        n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        n.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (n.category && n.category.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [notes, searchTerm]);

  if (loading) return <div className="flex items-center justify-center min-h-screen">Loading notes...</div>;

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-gray-50 p-4 sm:p-6 md:p-0">
      {/* Page Header */}
      <PageHeader
        title="Your Notes"
        subtitle="Upload, organize, and access your study materials."
        action={(
          <button
            onClick={() =>
              document
                .querySelector('[data-section="notes-collection"]')
                ?.scrollIntoView({ behavior: "smooth" })
            }
            className="inline-flex items-center px-5 py-2 bg-black text-white rounded-xl hover:bg-gray-800 transition font-medium"
          >
            Go to My Notes
          </button>
        )}
      />

      {/* Upload Section */}
      <div id="upload-section" className="max-w-7xl mx-auto mt-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Upload Your Notes</h2>
          <p className="text-lg text-gray-600">Get started by uploading your first study material</p>
        </div>

        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-xl p-5 sm:p-8 shadow-sm">
            <form onSubmit={handleAddNote} className="space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Note Title *</label>
                <input
                  type="text"
                  placeholder="Enter a descriptive title for your note"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  placeholder="Add a brief description of your note"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows="3"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category (Subject/Exam)</label>
                <input
                  type="text"
                  placeholder="e.g., Mathematics, Physics, Final Exam"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                />
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Upload File *</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition">
                  <input
                    type="file"
                    id="fileInput"
                    className="hidden"
                    onChange={(e) => setFile(e.target.files[0])}
                    required
                  />
                  <label htmlFor="fileInput" className="cursor-pointer">
                    {file ? (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-900">{file.name}</p>
                        <p className="text-xs text-gray-500">Click to change file</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-900">Choose file to upload</p>
                        <p className="text-xs text-gray-500">PDF, DOC, Images, or Text files</p>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition font-medium"
              >
                Upload Note
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Notes Collection */}
      <div data-section="notes-collection" className="max-w-7xl mx-auto mt-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Your Notes Collection</h2>
          <p className="text-lg text-gray-600">Search and organize your study materials</p>
        </div>

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-12">
          <input
            type="text"
            placeholder="Search notes by title, description, or category..."
            className="w-full pl-3 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Notes Grid */}
        {filteredNotes.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-600">No notes found. Upload your first note to get started!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8">
            {filteredNotes.map((note) => (
              <div key={note._id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition p-4 sm:p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{note.title}</h3>
                    {note.description && <p className="text-gray-600 text-sm mb-3">{note.description}</p>}
                    {note.category && (
                      <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                        {note.category}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => toggleFavorite(note._id, note.favorite)}
                      className={`p-2 rounded-full transition ${
                        note.favorite ? "text-yellow-500 bg-yellow-50" : "text-gray-400 hover:text-yellow-500 hover:bg-yellow-50"
                      }`}
                    >
                      ★
                    </button>
                    <button
                      onClick={() => handleDelete(note._id)}
                      className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full transition"
                    >
                      🗑
                    </button>
                  </div>
                </div>

                {/* File Preview */}
                {note.fileUrl && (
                  <div className="mb-4">
                    {note.fileUrl.endsWith(".pdf") ? (
                      <iframe src={note.fileUrl} className="w-full h-48 rounded-md border" />
                    ) : note.fileUrl.match(/\.(jpg|jpeg|png)$/) ? (
                      <img src={note.fileUrl} alt={note.title} className="w-full h-48 object-cover rounded-md" />
                    ) : (
                      <p className="text-center text-gray-500 p-4">Document File</p>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <button
                    onClick={() => window.open(note.fileUrl, "_blank")}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    View Full
                  </button>
                  <span className="text-xs text-gray-500">
                    {new Date(note.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Fullscreen Preview Modal */}
      {previewUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-auto relative">
            <button
              className="absolute top-2 right-4 text-red-500 font-bold text-lg"
              onClick={() => setPreviewUrl(null)}
            >
              ✖
            </button>
            {previewUrl.endsWith(".pdf") ? (
              <iframe src={previewUrl} className="w-full h-[80vh] rounded-b-lg" />
            ) : (
              <img src={previewUrl} alt="preview" className="w-full h-auto rounded-b-lg" />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
