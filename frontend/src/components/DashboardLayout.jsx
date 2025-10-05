import React, { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";

export default function DashboardLayout() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    const fetchProfile = async () => {
      try {
        const res = await fetch(`${API}/auth/profile`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.status === 401) {
          localStorage.removeItem("token");
          navigate("/login");
          return;
        }

        const data = await res.json();
        setUser(data);
      } catch (err) {
        console.error("Error fetching profile:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate, API]);

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* Sidebar Overlay for Mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full bg-white shadow-lg z-30 transform transition-transform duration-300
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} 
          lg:translate-x-0 lg:w-64 w-64 flex flex-col`}
      >
        <div className="p-4 flex-1 overflow-y-auto">
          <div className="mb-6">
            <h1 className="text-xl font-bold">ReviseHub</h1>
            <p className="text-sm text-gray-500">Welcome,</p>
            <div className="mt-2 font-medium">{user?.name}</div>
            <div className="text-xs text-gray-400">{user?.email}</div>
          </div>

          <nav className="space-y-2">
            <NavLink
              to="/dashboard"
              end
              className={({ isActive }) =>
                `block p-2 rounded ${
                  isActive
                    ? "bg-indigo-100 font-semibold"
                    : "hover:bg-gray-50"
                }`
              }
              onClick={() => setSidebarOpen(false)}
            >
              🏠 Home
            </NavLink>
            <NavLink
              to="/dashboard/notes"
              className={({ isActive }) =>
                `block p-2 rounded ${
                  isActive
                    ? "bg-indigo-100 font-semibold"
                    : "hover:bg-gray-50"
                }`
              }
              onClick={() => setSidebarOpen(false)}
            >
              📒 Notes
            </NavLink>
            <NavLink
              to="/dashboard/planner"
              className={({ isActive }) =>
                `block p-2 rounded ${
                  isActive
                    ? "bg-indigo-100 font-semibold"
                    : "hover:bg-gray-50"
                }`
              }
              onClick={() => setSidebarOpen(false)}
            >
              📅 Planner
            </NavLink>
            <NavLink
              to="/dashboard/progress"
              className={({ isActive }) =>
                `block p-2 rounded ${
                  isActive
                    ? "bg-indigo-100 font-semibold"
                    : "hover:bg-gray-50"
                }`
              }
              onClick={() => setSidebarOpen(false)}
            >
              📊 Progress
            </NavLink>
          </nav>
        </div>

        <div className="p-4 border-t border-gray-200">
          <button
            onClick={logout}
            className="w-full py-2 px-3 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 overflow-y-auto">
        {/* Header for Mobile */}
        
        <div className="lg:hidden flex items-center justify-between p-4 bg-white shadow-sm">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 text-gray-700 hover:text-gray-900"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="font-semibold text-lg">ReviseHub</h1>
        </div>

        {/* Hero Section (All screens) */}
        {location.pathname === "/dashboard" && (
          <div className="bg-gradient-to-r from-purple-600 to-blue-600">
            <div className="max-w-7xl mx-auto px-6 py-6 text-center">
              <h1 className="text-2xl sm:text-3xl font-bold text-white">
                Welcome back{user?.name ? `, ${user.name}` : ""}!
              </h1>
              <p className="text-white/90 text-sm sm:text-base">
                Quick access to your Notes, Planner and Progress
              </p>
            </div>
          </div>
        )}


        <div className="sm:p-6 md:p-0">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
