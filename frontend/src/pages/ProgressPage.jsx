import React, { useEffect, useState } from "react";
import {
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
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [badges, setBadges] = useState([]);
  const [dailyStats, setDailyStats] = useState([]);
  const [weeklyStats, setWeeklyStats] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [notesMonthStats, setNotesMonthStats] = useState({ thisMonth: 0, prevMonth: 0 });

  const API = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const token = localStorage.getItem("token");

  // -------------------- Helper Functions --------------------
  const generateDailyStats = (plansData) => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const dailyStats = days.map(day => ({ date: day, completed: 0 }));

    if (!plansData) return dailyStats;

    const completedTasks = [];
    plansData.forEach(plan => {
      plan.topics?.forEach(topic => {
        if (topic.status === "completed") {
          const completionTime = topic.updatedAt || plan.updatedAt || new Date();
          completedTasks.push({
            date: new Date(completionTime),
            day: new Date(completionTime).getDay(),
          });
        }
      });
    });

    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);

    completedTasks.forEach(task => {
      if (task.date >= lastWeek) {
        const dayIndex = task.day === 0 ? 6 : task.day - 1;
        dailyStats[dayIndex].completed++;
      }
    });

    return dailyStats;
  };

  const generateWeeklyStats = (plansData, notesData, weeklyUploadedCounts) => {
    const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
    const weeklyStats = weeks.map(week => ({ week, notes: 0, tasks: 0 }));

    if (weeklyUploadedCounts?.length === 4) {
      for (let i = 0; i < 4; i++) weeklyStats[i].notes = weeklyUploadedCounts[i];
    } else if (notesData?.length > 0) {
      notesData.forEach(note => {
        if (note.createdAt) {
          const weekIndex = Math.min(Math.floor((Date.now() - new Date(note.createdAt)) / (7 * 24 * 60 * 60 * 1000)), 3);
          if (weekIndex >= 0) weeklyStats[weekIndex].notes++;
        }
      });
    }

    plansData?.forEach(plan => {
      plan.topics?.forEach(topic => {
        if (topic.status === "completed") {
          const weekIndex = Math.min(Math.floor((Date.now() - new Date(topic.updatedAt || plan.updatedAt || new Date())) / (7 * 24 * 60 * 60 * 1000)), 3);
          if (weekIndex >= 0) weeklyStats[weekIndex].tasks++;
        }
      });
    });

    return weeklyStats;
  };

  const fetchProgress = async () => {
    try {
      const plansRes = await fetch(`${API}/planner`, { headers: { Authorization: `Bearer ${token}` } });
      const plansData = plansRes.ok ? await plansRes.json() : [];
      setPlans(plansData);

      const notesRes = await fetch(`${API}/notes?includeDeleted=true`, { headers: { Authorization: `Bearer ${token}` } });
      const notesData = notesRes.ok ? await notesRes.json() : [];
      setNotes(notesData);

      const statsRes = await fetch(`${API}/notes/stats`, { headers: { Authorization: `Bearer ${token}` } });
      const monthlyStats = statsRes.ok ? await statsRes.json() : { thisMonth: 0, prevMonth: 0 };

      const weeklyRes = await fetch(`${API}/notes/stats/weekly`, { headers: { Authorization: `Bearer ${token}` } });
      const weeklyCounts = weeklyRes.ok ? (await weeklyRes.json()).weeks : null;

      generateMockData(plansData, notesData, monthlyStats, weeklyCounts);
    } catch (err) {
      console.error("Error fetching progress:", err);
      setPlans([]);
      setNotes([]);
      setDailyStats([]);
      setWeeklyStats([]);
      setRecentActivity([]);
    } finally {
      setLoading(false);
    }
  };

  const generateMockData = (plansData, notesData, monthlyStats, weeklyCounts) => {
    setDailyStats(generateDailyStats(plansData));
    setWeeklyStats(generateWeeklyStats(plansData, notesData, weeklyCounts));
    setNotesMonthStats(monthlyStats);

    // Recent activity
    const activityData = [];
    notesData.forEach(note => {
      if (note.createdAt) activityData.push({ type: "note", title: `Uploaded "${note.title}"`, category: note.category || "General", date: new Date(note.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), timestamp: new Date(note.createdAt) });
      if (note.isDeleted && note.updatedAt) activityData.push({ type: "note_deleted", title: `Deleted "${note.title}"`, category: note.category || "General", date: new Date(note.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), timestamp: new Date(note.updatedAt) });
    });
    plansData?.forEach(plan => {
      plan.topics?.forEach(topic => {
        const ts = topic.updatedAt || plan.updatedAt || new Date();
        activityData.push({ type: topic.status === "completed" ? "task_completed" : "task_added", title: `${topic.status === "completed" ? "Completed" : "Added"} "${topic.name || topic.title}"`, category: plan.subject, date: new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), timestamp: new Date(ts) });
      });
    });
    activityData.sort((a, b) => b.timestamp - a.timestamp);
    setRecentActivity(activityData.slice(0, 10));

    // Badges
    setBadges([{ name: "7-Day Streak", icon: "🔥", date: new Date() }, { name: "Note Master", icon: "📚", date: new Date() }]);
  };

  useEffect(() => { if (token) fetchProgress(); }, [token]);
  useEffect(() => {
    const handleVisibilityChange = () => { if (!document.hidden && token) fetchProgress(); };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [token]);
  useEffect(() => {
    const interval = setInterval(() => { if (!document.hidden && token) fetchProgress(); }, 10000);
    return () => clearInterval(interval);
  }, [token]);
  useEffect(() => {
    const handleStorageChange = (e) => { if ((e.key === 'planner-updated' || e.key === 'notes-updated') && token) fetchProgress(); };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [token]);

  const overallProgress = () => {
    const totalTopics = plans.reduce((acc, p) => acc + p.topics.length, 0);
    const completedTopics = plans.reduce((acc, p) => acc + p.topics.filter(t => t.status === "completed").length, 0);
    return totalTopics === 0 ? 0 : Math.round((completedTopics / totalTopics) * 100);
  };

  const totalNotes = notesMonthStats.thisMonth || notes.length;
  const tasksCompleted = plans.reduce((acc, plan) => acc + plan.topics.filter(t => t.status === "completed").length, 0);
  const subjectsCovered = plans.length;

  if (loading) return <div className="flex items-center justify-center min-h-screen">Loading progress...</div>;

  const fallbackDailyStats = [
    { date: 'Mon', completed: 0 }, { date: 'Tue', completed: 0 }, { date: 'Wed', completed: 0 },
    { date: 'Thu', completed: 0 }, { date: 'Fri', completed: 0 }, { date: 'Sat', completed: 0 },
    { date: 'Sun', completed: 0 }
  ];

  const fallbackWeeklyStats = [
    { week: 'Week 1', notes: 0, tasks: 0 }, { week: 'Week 2', notes: 0, tasks: 0 },
    { week: 'Week 3', notes: 0, tasks: 0 }, { week: 'Week 4', notes: 0, tasks: 0 }
  ];

  // -------------------- JSX --------------------
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Your Progress</h1>
          <p className="text-white/90 mt-1 text-sm sm:text-base">Track your learning journey and achievements</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {/* Total Notes */}
          <MetricCard title="Total Notes" value={totalNotes} delta={0} deltaText="Uploaded this month" icon="note" />
          {/* Tasks Completed */}
          <MetricCard title="Tasks Completed" value={tasksCompleted} delta={0} deltaText="This week" icon="tasks" />
          {/* Subjects Covered */}
          <MetricCard title="Subjects Covered" value={subjectsCovered} delta={0} deltaText="Active subjects" icon="subjects" />
        </div>

        {/* Overall Progress */}
        <ProgressBarCard title="Overall Progress" percentage={overallProgress()} />

        {/* Analytics Section */}
        <AnalyticsCharts dailyStats={dailyStats.length ? dailyStats : fallbackDailyStats} weeklyStats={weeklyStats.length ? weeklyStats : fallbackWeeklyStats} />

        {/* Recent Activity */}
        <RecentActivityList recentActivity={recentActivity} />

      </div>
    </div>
  );
}

// -------------------- Subcomponents --------------------
const MetricCard = ({ title, value, delta, deltaText, icon }) => (
  <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm flex flex-col sm:flex-row justify-between items-center sm:items-start">
    <div className="text-center sm:text-left">
      <p className="text-sm font-medium text-gray-600">{title}</p>
      <p className="text-2xl sm:text-3xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500">{deltaText}</p>
    </div>
    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mt-4 sm:mt-0">
      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    </div>
  </div>
);

const ProgressBarCard = ({ title, percentage }) => (
  <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm mb-8">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      <span className="text-2xl font-bold text-gray-900">{percentage}%</span>
    </div>
    <div className="w-full bg-gray-200 rounded-full h-3">
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 h-3 rounded-full transition-all duration-500" style={{ width: `${percentage}%` }}></div>
    </div>
  </div>
);

const AnalyticsCharts = ({ dailyStats, weeklyStats }) => (
  <div className="space-y-8 mb-8">
    {/* Daily Tasks */}
    <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Tasks Completed This Week</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={dailyStats}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="completed" fill="#3B82F6" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>

    {/* Weekly Progress */}
    <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Cumulative Progress</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={weeklyStats}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="week" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="notes" stroke="#3B82F6" name="Notes Uploaded" />
            <Line type="monotone" dataKey="tasks" stroke="#8B5CF6" name="Tasks Completed" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  </div>
);

const RecentActivityList = ({ recentActivity }) => (
  <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm">
    <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
    {recentActivity.length === 0 ? (
      <div className="text-center py-8">
        <h4 className="text-lg font-medium text-gray-900 mb-2">No recent activity</h4>
        <p className="text-gray-600">Start uploading notes and completing tasks to see your activity here!</p>
      </div>
    ) : (
      <div className="space-y-4">
        {recentActivity.map((activity, index) => (
          <div key={index} className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-3 border-b border-gray-100 last:border-b-0">
            <div className="flex items-center mb-2 sm:mb-0">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 ${
                activity.type === 'note' ? 'bg-blue-100' :
                activity.type === 'note_deleted' ? 'bg-red-100' : 'bg-green-100'
              }`}>
                {activity.type === 'note' && <span className="text-blue-600">📄</span>}
                {activity.type === 'note_deleted' && <span className="text-red-600">❌</span>}
                {activity.type.includes('task') && <span className="text-green-600">✅</span>}
              </div>
              <div>
                <p className="font-medium text-gray-900">{activity.title}</p>
                <div className="flex flex-wrap gap-2 mt-1 text-xs">
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full">{activity.type}</span>
                  <span className="px-2 py-1 bg-blue-100 text-blue-600 rounded-full">{activity.category}</span>
                </div>
              </div>
            </div>
            <div className="text-gray-500 text-sm flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {activity.date}
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);
