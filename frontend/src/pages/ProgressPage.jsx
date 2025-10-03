import React, { useEffect, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
  Legend,
} from "recharts";

export default function ProgressPage() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [badges, setBadges] = useState([]);
  const [dailyStats, setDailyStats] = useState([]);
  const [weeklyStats, setWeeklyStats] = useState([]);

  const API = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const token = localStorage.getItem("token");

  const fetchProgress = async () => {
    try {
      const res = await fetch(`${API}/progress`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setPlans(data.plans);
      setBadges(data.badges || []);
      setDailyStats(data.dailyStats || []);
      setWeeklyStats(data.weeklyStats || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    fetchProgress();
  }, []);

  const overallProgress = () => {
    let totalTopics = 0;
    let completedTopics = 0;
    plans.forEach((plan) => {
      totalTopics += plan.topics.length;
      completedTopics += plan.topics.filter((t) => t.status === "completed").length;
    });
    if (totalTopics === 0) return 0;
    return Math.round((completedTopics / totalTopics) * 100);
  };

  const COLORS = ["#34D399", "#E5E7EB"]; // green / gray

  const weakSubjects = plans.filter(plan => {
    const completed = plan.topics.filter(t => t.status === "completed").length;
    const total = plan.topics.length;
    return total > 0 && (completed / total) * 100 < 50;
  });

  if (loading) return <div>Loading progress...</div>;

  return (
    <div className="p-6 min-h-screen bg-gray-50">
      <h1 className="text-3xl font-bold mb-6">Study Progress Dashboard</h1>

      {/* Overall Progress Pie Chart */}
      <div className="bg-white p-6 rounded-xl shadow w-full max-w-md mx-auto mb-8">
        <h2 className="text-xl font-semibold mb-4 text-center">Overall Progress</h2>
        <div className="w-full h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={[
                  { name: "Completed", value: overallProgress() },
                  { name: "Pending", value: 100 - overallProgress() },
                ]}
                dataKey="value"
                cx="50%"
                cy="50%"
                outerRadius={80}
                innerRadius={50}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {[overallProgress(), 100 - overallProgress()].map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="text-center mt-4 text-2xl font-bold text-green-500">
          {overallProgress()}%
        </div>
      </div>

      {/* Daily Stats */}
      {dailyStats.length > 0 && (
        <div className="bg-white p-4 rounded-xl shadow mb-6">
          <h2 className="text-lg font-semibold mb-2">Daily Progress</h2>
          <ResponsiveContainer width="100%" height={100}>
            <BarChart data={dailyStats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="completed" fill="#34D399" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Weekly Stats */}
      {weeklyStats.length > 0 && (
        <div className="bg-white p-4 rounded-xl shadow mb-6">
          <h2 className="text-lg font-semibold mb-2">Weekly Progress</h2>
          <ResponsiveContainer width="100%" height={100}>
            <BarChart data={weeklyStats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="completed" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Subject-wise Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {plans.map((plan) => {
          const completed = plan.topics.filter((t) => t.status === "completed").length;
          const total = plan.topics.length;
          const planProgress = total === 0 ? 0 : Math.round((completed / total) * 100);
          return (
            <div key={plan._id} className="bg-white p-5 rounded-xl shadow transition">
              <h3 className="text-lg font-semibold mb-2">{plan.subject}</h3>
              <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                <div
                  className="bg-green-500 h-3 rounded-full transition-all"
                  style={{ width: `${planProgress}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600">{planProgress}% completed</p>

              {/* Predictive Progress Line Chart */}
              {plan.predictedProgress && (
                <div className="mt-4 w-full h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={plan.predictedProgress}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="completed" stroke="#34D399" name="Actual" />
                      <Line type="monotone" dataKey="predicted" stroke="#F59E0B" name="Predicted" strokeDasharray="5 5"/>
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Weak Subjects */}
      {weakSubjects.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-3 text-red-500">Weak Subjects</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {weakSubjects.map(plan => (
              <div key={plan._id} className="bg-red-100 p-4 rounded shadow">
                <h3 className="font-semibold">{plan.subject}</h3>
                <p className="text-sm text-red-600">
                  Only {Math.round((plan.topics.filter(t => t.status === "completed").length / plan.topics.length) * 100)}% completed
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Achievements / Badges */}
      {badges.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-3">Achievements</h2>
          <div className="flex flex-wrap gap-3">
            {badges.map((badge, idx) => (
              <div key={idx} className="bg-yellow-100 p-3 rounded shadow flex items-center gap-2">
                <span className="text-2xl">{badge.icon}</span>
                <div>
                  <p className="font-medium">{badge.name}</p>
                  <p className="text-xs text-gray-500">{new Date(badge.date).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={fetchProgress}
        className="mt-6 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        Refresh Progress
      </button>
    </div>
  );
}
