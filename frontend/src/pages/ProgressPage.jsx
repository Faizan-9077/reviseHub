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

  const API = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const token = localStorage.getItem("token");

  // Helper functions - defined early to avoid hoisting issues

  const generateDailyStats = (plansData) => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const dailyStats = days.map(day => ({ date: day, completed: 0 }));

    if (!plansData || plansData.length === 0) {
      return dailyStats;
    }

    // Get all completed tasks with their completion dates
    const completedTasks = [];
    plansData.forEach(plan => {
      if (plan.topics && plan.topics.length > 0) {
        plan.topics.forEach(topic => {
          if (topic.status === "completed") {
            const completionTime = topic.updatedAt || plan.updatedAt || new Date();
            completedTasks.push({
              date: new Date(completionTime),
              day: new Date(completionTime).getDay()
            });
          }
        });
      }
    });


    // Count tasks completed on each day of the week (last 7 days)
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);

    completedTasks.forEach(task => {
      if (task.date >= lastWeek) {
        const dayIndex = task.day === 0 ? 6 : task.day - 1; // Convert Sunday=0 to Sunday=6
        dailyStats[dayIndex].completed++;
      }
    });

    return dailyStats;
  };

  const generateWeeklyStats = (plansData, notesData) => {
    const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
    const weeklyStats = weeks.map(week => ({ week, notes: 0, tasks: 0 }));

    if (!notesData || notesData.length === 0) {
      // No notes data available
    } else {
      // Calculate notes uploaded per week
      notesData.forEach(note => {
        if (note.createdAt) {
          const noteDate = new Date(note.createdAt);
          const weekIndex = Math.min(Math.floor((Date.now() - noteDate) / (7 * 24 * 60 * 60 * 1000)), 3);
          if (weekIndex >= 0 && weekIndex < 4) {
            weeklyStats[weekIndex].notes++;
          }
        }
      });
    }

    if (!plansData || plansData.length === 0) {
      // No plans data available
    } else {
      // Calculate tasks completed per week
      plansData.forEach(plan => {
        if (plan.topics && plan.topics.length > 0) {
        plan.topics.forEach(topic => {
          if (topic.status === "completed") {
            const completionTime = topic.updatedAt || plan.updatedAt || new Date();
            const taskDate = new Date(completionTime);
            const weekIndex = Math.min(Math.floor((Date.now() - taskDate) / (7 * 24 * 60 * 60 * 1000)), 3);
            if (weekIndex >= 0 && weekIndex < 4) {
              weeklyStats[weekIndex].tasks++;
            }
          }
        });
        }
      });
    }

    return weeklyStats;
  };

  const fetchProgress = async () => {
    try {
      // Fetch plans
      const plansRes = await fetch(`${API}/planner`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!plansRes.ok) {
        throw new Error(`Plans fetch failed: ${plansRes.status}`);
      }
      
      const plansData = await plansRes.json();
      setPlans(plansData);

      // Fetch notes
      const notesRes = await fetch(`${API}/notes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!notesRes.ok) {
        throw new Error(`Notes fetch failed: ${notesRes.status}`);
      }
      
      const notesData = await notesRes.json();
      setNotes(notesData);

      // Generate data for charts and stats
      generateMockData(plansData, notesData);
    } catch (err) {
      console.error('Error fetching progress:', err);
      // Set empty data to prevent crashes
      setPlans([]);
      setNotes([]);
      setDailyStats([]);
      setWeeklyStats([]);
      setRecentActivity([]);
    } finally {
      setLoading(false);
    }
  };

  const generateMockData = (plansData, notesData) => {
    // Generate real daily stats based on actual task completions
    const dailyStatsData = generateDailyStats(plansData);
    setDailyStats(dailyStatsData);

    // Generate real weekly stats based on actual data
    const weeklyStatsData = generateWeeklyStats(plansData, notesData);
    setWeeklyStats(weeklyStatsData);

    // Generate real recent activity from notes and plans
    const activityData = [];
    
    // Add note activities
    notesData.forEach(note => {
      activityData.push({
        type: "note",
        title: note.title,
        category: note.category || "General",
        date: new Date(note.updatedAt).toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        }),
        timestamp: new Date(note.updatedAt)
      });
    });

    // Add task activities from plans (both added and completed)
    if (plansData && plansData.length > 0) {
      plansData.forEach(plan => {
        if (plan.topics && plan.topics.length > 0) {
          plan.topics.forEach(topic => {
            if (topic.status === "completed") {
              // Use topic.updatedAt if available, otherwise use plan.updatedAt, otherwise use current time
              const completionTime = topic.updatedAt || plan.updatedAt || new Date();
              activityData.push({
                type: "task",
                title: `Completed "${topic.name || topic.title}"`,
                category: plan.subject,
                date: new Date(completionTime).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric' 
                }),
                timestamp: new Date(completionTime)
              });
            } else {
              // Add newly created tasks to recent activity
              const creationTime = topic.createdAt || plan.createdAt || plan.updatedAt || new Date();
              activityData.push({
                type: "task",
                title: `Added "${topic.name || topic.title}"`,
                category: plan.subject,
                date: new Date(creationTime).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric' 
                }),
                timestamp: new Date(creationTime)
              });
            }
          });
        }
      });
    }

    // Sort by timestamp (most recent first) and limit to 10 items
    activityData.sort((a, b) => b.timestamp - a.timestamp);
    setRecentActivity(activityData.slice(0, 10));

    // Generate badges
    const badgesData = [
      { name: "7-Day Streak", icon: "🔥", date: new Date() },
      { name: "Note Master", icon: "📚", date: new Date() }
    ];
    setBadges(badgesData);
  };

  useEffect(() => {
    if (!token) return;
    fetchProgress();
  }, []);

  // Refresh data when the page becomes visible (user switches back to this tab)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && token) {
        fetchProgress();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [token]);

  // Also refresh when the component mounts (user navigates to this page)
  useEffect(() => {
    if (token) {
      fetchProgress();
    }
  }, [token]);

  // Auto-refresh data every 10 seconds when page is visible
  useEffect(() => {
    const interval = setInterval(() => {
      if (!document.hidden && token) {
        fetchProgress();
      }
    }, 10000); // 10 seconds for more frequent updates

    return () => clearInterval(interval);
  }, [token]);

  // Listen for storage changes (when other tabs update data)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'planner-updated' && token) {
        fetchProgress();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [token]);

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

  // Calculate metrics
  const totalNotes = notes.length;
  const tasksCompleted = plans.reduce((acc, plan) => 
    acc + plan.topics.filter(t => t.status === "completed").length, 0
  );
  const subjectsCovered = plans.length;



  if (loading) return <div className="flex items-center justify-center min-h-screen">Loading progress...</div>;

  // Fallback data when no data is available
  const fallbackDailyStats = [
    { date: 'Mon', completed: 0 },
    { date: 'Tue', completed: 0 },
    { date: 'Wed', completed: 0 },
    { date: 'Thu', completed: 0 },
    { date: 'Fri', completed: 0 },
    { date: 'Sat', completed: 0 },
    { date: 'Sun', completed: 0 }
  ];

  const fallbackWeeklyStats = [
    { week: 'Week 1', notes: 0, tasks: 0 },
    { week: 'Week 2', notes: 0, tasks: 0 },
    { week: 'Week 3', notes: 0, tasks: 0 },
    { week: 'Week 4', notes: 0, tasks: 0 }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Your Progress</h1>
              <p className="text-gray-600 mt-1">Track your learning journey and achievements</p>
            </div>
        </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Total Notes */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Notes</p>
                <p className="text-3xl font-bold text-gray-900">{totalNotes}</p>
                <p className="text-sm text-gray-500">Uploaded this month</p>
                <p className="text-sm text-green-600 flex items-center mt-1">
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                  12% from last week
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Tasks Completed */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tasks Completed</p>
                <p className="text-3xl font-bold text-gray-900">{tasksCompleted}</p>
                <p className="text-sm text-gray-500">This week</p>
                <p className="text-sm text-green-600 flex items-center mt-1">
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                  8% from last week
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Subjects Covered */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Subjects Covered</p>
                <p className="text-3xl font-bold text-gray-900">{subjectsCovered}</p>
                <p className="text-sm text-gray-500">Active subjects</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
            </div>
          </div>

        </div>

        {/* Overall Progress */}
        <div className="bg-white rounded-xl p-6 shadow-sm mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Overall Progress</h3>
                <p className="text-sm text-gray-600">Your completion rate this month</p>
              </div>
            </div>
            <div className="flex items-center">
              <span className="text-2xl font-bold text-gray-900 mr-2">{overallProgress()}%</span>
              <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-purple-600 to-blue-600 h-3 rounded-full transition-all duration-500"
              style={{ width: `${overallProgress()}%` }}
            ></div>
          </div>
        </div>

        {/* Analytics Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Analytics</h2>
          {/* Tasks Completed This Week */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Tasks Completed This Week</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyStats.length > 0 ? dailyStats : fallbackDailyStats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
                  <Bar dataKey="completed" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
          </div>
      </div>

        {/* Cumulative Progress */}
        <div className="bg-white rounded-xl p-6 shadow-sm mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Cumulative Progress</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklyStats.length > 0 ? weeklyStats : fallbackWeeklyStats}>
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

        {/* Recent Activity */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          {recentActivity.length === 0 ? (
            <div className="text-center py-8">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <h4 className="text-lg font-medium text-gray-900 mb-2">No recent activity</h4>
              <p className="text-gray-600">Start uploading notes and completing tasks to see your activity here!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                  <div className="flex items-center">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 ${
                      activity.type === 'note' ? 'bg-blue-100' : 
                      activity.title.startsWith('Completed') ? 'bg-green-100' : 'bg-purple-100'
                    }`}>
                      {activity.type === 'note' ? (
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      ) : activity.title.startsWith('Completed') ? (
                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
              )}
            </div>
                    <div>
                      <p className="font-medium text-gray-900">{activity.title}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                          {activity.type === 'note' ? 'Notes Uploaded' : 
                           activity.title.startsWith('Completed') ? 'Task Completed' : 'Task Added'}
                        </span>
                        <span className="px-2 py-1 bg-blue-100 text-blue-600 text-xs rounded-full">
                          {activity.category}
                        </span>
              </div>
          </div>
        </div>
                  <div className="flex items-center text-gray-500 text-sm">
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
        </div>
    </div>
  );
}
