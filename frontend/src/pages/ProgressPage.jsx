import React, { useEffect, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

export default function ProgressPage() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  const API = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const token = localStorage.getItem("token");

  const fetchPlans = async () => {
    try {
      const res = await fetch(`${API}/progress`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setPlans(data.plans);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    fetchPlans();
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

  if (loading) return <div>Loading progress...</div>;

  const pieData = [
    { name: "Completed", value: overallProgress() },
    { name: "Pending", value: 100 - overallProgress() },
  ];

  const COLORS = ["#34D399", "#E5E7EB"]; // green / gray

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
                data={pieData}
                dataKey="value"
                cx="50%"
                cy="50%"
                outerRadius={80}
                innerRadius={50} // donut style
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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

      {/* Subject-wise Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {plans.map((plan) => {
          const completed = plan.topics.filter((t) => t.status === "completed").length;
          const total = plan.topics.length;
          const planProgress = total === 0 ? 0 : Math.round((completed / total) * 100);

          return (
            <div
              key={plan._id}
              className="bg-white p-5 rounded-xl shadow transition"
            >
              <h3 className="text-lg font-semibold mb-2">{plan.subject}</h3>
              <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                <div
                  className="bg-green-500 h-3 rounded-full transition-all"
                  style={{ width: `${planProgress}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600">{planProgress}% completed</p>
            </div>
          );
        })}
      </div>

      <button
        onClick={fetchPlans}
        className="mt-6 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        Refresh Progress
      </button>
    </div>
  );
}
