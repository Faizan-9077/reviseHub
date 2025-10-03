import React from "react";

export default function CustomModal({ show, onClose, title, children }) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-lg animate-fadeIn relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-red-500 font-bold text-lg hover:text-red-600 transition"
        >
          ×
        </button>

        {/* Modal Title */}
        {title && <h3 className="text-xl font-bold mb-4">{title}</h3>}

        {/* Modal Content */}
        <div>{children}</div>
      </div>
    </div>
  );
}
