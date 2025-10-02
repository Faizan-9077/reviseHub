import React, { useEffect, useState } from "react";

export default function NotesPage() {
  const [notes, setNotes] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [previewUrl, setPreviewUrl] = useState(null); // for modal preview

  const API = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const token = localStorage.getItem("token");

  // Fetch all notes
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
    if (!token) return;
    fetchNotes();
  }, []);

  // Add new note
  const handleAddNote = async () => {
    if (!title || !file) return alert("Title and file are required");

    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("file", file);

    try {
      const res = await fetch(`${API}/notes`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const newNote = await res.json();
      setNotes([newNote, ...notes]);

      setTitle("");
      setDescription("");
      setFile(null);
      document.getElementById("fileInput").value = null;
    } catch (err) {
      console.error("Error uploading note:", err);
    }
  };

  // Delete note
  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this note?")) return;

    try {
      await fetch(`${API}/notes/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotes(notes.filter((n) => n._id !== id));
    } catch (err) {
      console.error("Error deleting note:", err);
    }
  };

  if (loading) return <div>Loading notes...</div>;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Your Notes</h2>

      {/* Upload Form */}
      <div className="mb-6 p-4 bg-white rounded shadow">
        <input
          type="text"
          placeholder="Title"
          className="w-full p-2 mb-2 border rounded"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <input
          type="text"
          placeholder="Description"
          className="w-full p-2 mb-2 border rounded"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        {/* Styled File Upload */}
        <div className="mb-2">
          <label
            htmlFor="fileInput"
            className="cursor-pointer inline-block bg-indigo-500 text-white py-2 px-4 rounded hover:bg-indigo-600"
          >
            {file ? file.name : "Choose File"}
          </label>
          <input
            type="file"
            id="fileInput"
            className="hidden"
            onChange={(e) => setFile(e.target.files[0])}
          />
        </div>

        {/* Preview selected file */}
        {file && file.type.startsWith("image/") && (
          <img
            src={URL.createObjectURL(file)}
            alt="preview"
            className="max-w-full max-h-64 mb-2 rounded shadow object-contain"
          />
        )}
        {file && file.type === "application/pdf" && (
          <iframe
            src={URL.createObjectURL(file)}
            title="PDF Preview"
            className="w-full max-h-96 mb-2 border rounded"
          />
        )}

        {file && (
          <button
            onClick={() => setPreviewUrl(URL.createObjectURL(file))}
            className="text-indigo-500 hover:underline text-sm mb-2"
          >
            View Full
          </button>
        )}

        <button
          onClick={handleAddNote}
          className="bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 mt-2"
        >
          Upload Note
        </button>
      </div>

      {/* Notes List */}
      {notes.length === 0 ? (
        <div>No notes yet. Upload your first note!</div>
      ) : (
        <div className="grid gap-4">
          {notes.map((note) => (
            <div key={note._id} className="p-4 bg-white rounded shadow">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold">{note.title}</h3>
                  <p className="text-gray-700">{note.description}</p>

                  {/* File Preview / Download */}
                  {note.fileUrl.endsWith(".pdf") && (
                    <iframe
                      src={note.fileUrl}
                      title={note.title}
                      className="w-full max-h-96 my-2 border rounded"
                    />
                  )}
                  {note.fileUrl.match(/\.(jpg|jpeg|png)$/) && (
                    <img
                      src={note.fileUrl}
                      alt={note.title}
                      className="w-32 h-32 object-cover my-2 rounded shadow"
                    />
                  )}
                  {!note.fileUrl.match(/\.(pdf|jpg|jpeg|png)$/) && (
                    <a
                      href={note.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-500 hover:underline text-sm"
                    >
                      Download File
                    </a>
                  )}

                <button
                onClick={() => window.open(note.fileUrl, "_blank")}
                className="text-indigo-500 hover:underline text-sm mt-1"
                >
                View Full
                </button>

                  <div className="text-xs text-gray-400 mt-1">
                    Last updated: {new Date(note.updatedAt).toLocaleString()}
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(note._id)}
                  className="text-red-500 hover:underline"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Preview */}
      {previewUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
          <div className="bg-white p-4 rounded max-w-3xl max-h-full overflow-auto relative">
            <button
              className="absolute top-2 right-2 text-red-500 font-bold"
              onClick={() => setPreviewUrl(null)}
            >
              X
            </button>
            {previewUrl.endsWith(".pdf") ? (
              <iframe src={previewUrl} className="w-full h-96" />
            ) : (
              <img src={previewUrl} alt="preview" className="w-full h-auto" />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
