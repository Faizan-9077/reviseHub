import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function DashboardHome() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const [plans, setPlans] = useState([]);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

  // Fetch user data, plans, and notes
  const fetchDashboardData = async () => {
    try {
      // Fetch user info
      const userRes = await fetch(`${API}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (userRes.ok) {
        const userData = await userRes.json();
        setUser(userData);
      }

      // Fetch plans
      const plansRes = await fetch(`${API}/planner`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (plansRes.ok) {
        const plansData = await plansRes.json();
        setPlans(plansData);
      }

      // Fetch notes
      const notesRes = await fetch(`${API}/notes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (notesRes.ok) {
        const notesData = await notesRes.json();
        setNotes(notesData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchDashboardData();
    }
  }, [token]);

  // Listen for storage changes (when other tabs update data)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'planner-updated' && token) {
        fetchDashboardData();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [token]);

  // Auto-refresh data every 10 seconds when page is visible
  useEffect(() => {
    const interval = setInterval(() => {
      if (!document.hidden && token) {
        fetchDashboardData();
      }
    }, 10000); // 10 seconds for more frequent updates

    return () => clearInterval(interval);
  }, [token]);

  // Refresh data when the page becomes visible (user switches back to this tab)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && token) {
        fetchDashboardData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [token]);


  // Get today's tasks
  const getTodaysTasks = () => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    return plans.flatMap(plan => 
      plan.topics
        .filter(topic => {
          // Show pending tasks that are either:
          // 1. Have no due date (newly added tasks)
          // 2. Have a due date that's today or earlier
          // 3. Were created today (recently added)
          if (topic.status !== 'pending') return false;
          
          const hasNoDueDate = !topic.dueDate;
          const dueTodayOrEarlier = topic.dueDate && new Date(topic.dueDate).toISOString().split('T')[0] <= todayStr;
          const createdToday = topic.createdAt && new Date(topic.createdAt).toISOString().split('T')[0] === todayStr;
          
          return hasNoDueDate || dueTodayOrEarlier || createdToday;
        })
        .map(topic => ({ ...topic, planSubject: plan.subject, planId: plan._id }))
    ).slice(0, 3);
  };

  // Get recent notes
  const getRecentNotes = () => {
    return notes
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 3);
  };

  // Get recent activity
  const getRecentActivity = () => {
    const activities = [];
    
    // Add note activities
    notes.forEach(note => {
      activities.push({
        type: 'note',
        title: `You uploaded "${note.title}"`,
        date: new Date(note.createdAt),
        icon: 'document'
      });
    });

    // Add task activities (both added and completed)
    plans.forEach(plan => {
      plan.topics.forEach(topic => {
        if (topic.status === 'completed') {
          activities.push({
            type: 'task',
            title: `You completed "${topic.name}"`,
            date: new Date(topic.updatedAt || plan.updatedAt),
            icon: 'check'
          });
        } else {
          // Add newly created tasks to recent activity
          activities.push({
            type: 'task',
            title: `You added "${topic.name}"`,
            date: new Date(topic.createdAt || plan.createdAt || plan.updatedAt),
            icon: 'plus'
          });
        }
      });
    });

    return activities
      .sort((a, b) => b.date - a.date)
      .slice(0, 4);
  };

  // Calculate completion rate
  const getCompletionRate = () => {
    const allTopics = plans.flatMap(plan => plan.topics);
    if (allTopics.length === 0) return 0;
    const completed = allTopics.filter(topic => topic.status === 'completed').length;
    return Math.round((completed / allTopics.length) * 100);
  };

  // Get tasks done this week
  const getTasksDoneThisWeek = () => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const completedThisWeek = plans.flatMap(plan => 
      plan.topics.filter(topic => 
        topic.status === 'completed' && 
        new Date(topic.updatedAt || plan.updatedAt) >= weekAgo
      )
    );
    
    const totalTasks = plans.flatMap(plan => plan.topics);
    return `${completedThisWeek.length}/${totalTasks.length}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const todaysTasks = getTodaysTasks();
  const recentNotes = getRecentNotes();
  const recentActivity = getRecentActivity();
  const completionRate = getCompletionRate();
  const tasksDone = getTasksDoneThisWeek();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Welcome Banner */}
        <div className="bg-white rounded-xl p-6 mb-8 shadow-sm">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900">
              Welcome back, {user?.name || 'Student'}! Here's your study overview for today.
            </h2>
            <p className="text-gray-600 mt-1 italic">"Every study session counts. Keep it up!"</p>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Total Notes */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Notes</p>
                <p className="text-3xl font-bold text-gray-900">{notes.length}</p>
                <p className="text-sm text-gray-500">This week</p>
                <p className="text-sm text-green-600 flex items-center mt-1">
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                  ↑ 3% from last week
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
                <p className="text-3xl font-bold text-gray-900">
                  {plans.reduce((acc, plan) => acc + plan.topics.filter(t => t.status === 'completed').length, 0)}
                </p>
                <p className="text-sm text-gray-500">This month</p>
                <p className="text-sm text-green-600 flex items-center mt-1">
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                  ↑ 8% from last week
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="space-y-8">
            {/* Today's Planner */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Today's Planner
                </h3>
                <button 
                  onClick={() => navigate('/dashboard/planner')}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  View All →
                </button>
              </div>
              
              <div className="space-y-3">
                {todaysTasks.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No tasks for today. Great job!</p>
                ) : (
                  todaysTasks.map((task, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition">
                      <div className="flex items-start space-x-3">
                        <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{task.name}</h4>
                          <div className="flex items-center space-x-2 mt-2">
                            <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                              {task.planSubject}
                            </span>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              task.priority === 'high' ? 'bg-red-100 text-red-800' :
                              task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {task.priority}
                            </span>
                            {task.dueDate && (
                              <span className="text-xs text-gray-500">
                                Due: {new Date(task.dueDate).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Recent Notes */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Recent Notes
                </h3>
                <button 
                  onClick={() => {
                    navigate('/dashboard/notes');
                    // Scroll to notes collection section after navigation
                    setTimeout(() => {
                      const notesSection = document.querySelector('[data-section="notes-collection"]');
                      if (notesSection) {
                        notesSection.scrollIntoView({ behavior: 'smooth' });
                      }
                    }, 100);
                  }}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  View All Notes →
                </button>
              </div>
              
              <div className="space-y-3">
                {recentNotes.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No notes uploaded yet.</p>
                ) : (
                  recentNotes.map((note, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <div>
                            <h4 className="font-medium text-gray-900">{note.title}</h4>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className="text-xs text-gray-500">{note.category}</span>
                              <span className="text-xs text-gray-500">•</span>
                              <span className="text-xs text-gray-500">
                                {new Date(note.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </span>
                            </div>
                          </div>
                        </div>
                        <button className="text-gray-400 hover:text-gray-600">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            {/* This Week's Progress */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center mb-6">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <h3 className="text-lg font-semibold text-gray-900">This Week's Progress</h3>
              </div>
              
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600">Completion Rate</span>
                    <span className="text-2xl font-bold text-gray-900">{completionRate}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-purple-600 to-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${completionRate}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-green-600 flex items-center mt-1">
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                    </svg>
                    ↑ +12%
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">{tasksDone}</p>
                    <p className="text-sm text-gray-500">Tasks Done</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">8.5h</p>
                    <p className="text-sm text-gray-500">Study Hours</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center mb-6">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
              </div>
              
              <div className="space-y-4">
                {recentActivity.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No recent activity.</p>
                ) : (
                  recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                        {activity.icon === 'document' ? (
                          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        ) : activity.icon === 'check' ? (
                          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        ) : activity.icon === 'plus' ? (
                          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">{activity.title}</p>
                        <p className="text-xs text-gray-500">
                          {activity.date.toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true
                          })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-gray-600">
            Small progress every day leads to big results. Keep revising 💪
          </p>
        </div>
      </div>
    </div>
  );
}