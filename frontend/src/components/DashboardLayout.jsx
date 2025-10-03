import React, { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';

export default function DashboardLayout() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
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
            "Authorization": `Bearer ${token}`
          }
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
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow p-4">
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
              `block p-2 rounded ${isActive ? "bg-indigo-100 font-semibold" : "hover:bg-gray-50"}`
            }
          >
            🏠 Home
          </NavLink>
          <NavLink
            to="/dashboard/notes"
            className={({ isActive }) =>
              `block p-2 rounded ${isActive ? "bg-indigo-100 font-semibold" : "hover:bg-gray-50"}`
            }
          >
            📒 Notes
          </NavLink>
          <NavLink
            to="/dashboard/planner"
            className={({ isActive }) =>
              `block p-2 rounded ${isActive ? "bg-indigo-100 font-semibold" : "hover:bg-gray-50"}`
            }
          >
            📅 Planner
          </NavLink>
          <NavLink
            to="/dashboard/progress"
            className={({ isActive }) =>
              `block p-2 rounded ${isActive ? "bg-indigo-100 font-semibold" : "hover:bg-gray-50"}`
            }
          >
            📊 Progress
          </NavLink>
        </nav>

        <div className="mt-6">
          <button
            onClick={logout}
            className="w-full py-2 px-3 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-6">
        <header className="mb-6">
          <h2 className="text-2xl font-bold">Dashboard</h2>
          <p className="text-sm text-gray-500">
            Quick access to your Notes, Planner and Progress
          </p>
        </header>
        <Outlet />
      </main>
    </div>
  );
}
