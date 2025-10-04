import React, { useEffect, useState } from "react";

export default function PlannerPage() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newSubject, setNewSubject] = useState("");
  const [newTopics, setNewTopics] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("active");
  
  // New task form states
  const [taskTitle, setTaskTitle] = useState("");
  const [taskSubject, setTaskSubject] = useState("");
  const [taskPriority, setTaskPriority] = useState("medium");
  const [taskDeadline, setTaskDeadline] = useState("");
  const [taskNotes, setTaskNotes] = useState("");

  const API = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const token = localStorage.getItem("token");

  // Fetch plans
  const fetchPlans = async () => {
    try {
      const res = await fetch(`${API}/planner`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setPlans(data);
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

  // Add new task
  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!taskTitle || !taskSubject) return;

    // Check if plan with this subject already exists
    let existingPlan = plans.find(plan => plan.subject === taskSubject);
    
    if (existingPlan) {
      // Add topic to existing plan
      try {
        const res = await fetch(`${API}/planner/${existingPlan._id}/topics`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ 
            name: taskTitle, 
            dueDate: taskDeadline || null,
            priority: taskPriority,
            description: taskNotes
          }),
        });
        const updatedPlan = await res.json();
        setPlans(prevPlans => 
          prevPlans.map(plan => 
            plan._id === existingPlan._id ? updatedPlan : plan
          )
        );
        
        // Notify other tabs that planner data has been updated
        localStorage.setItem('planner-updated', Date.now().toString());
        localStorage.removeItem('planner-updated');
      } catch (err) {
        console.error(err);
      }
    } else {
      // Create new plan with this topic
      const topicsArray = [{
        name: taskTitle,
      status: "pending",
        dueDate: taskDeadline || null,
        priority: taskPriority,
        description: taskNotes
      }];

    try {
      const res = await fetch(`${API}/planner/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
          body: JSON.stringify({ subject: taskSubject, topics: topicsArray }),
      });
      const plan = await res.json();
      setPlans([...plans, plan]);
      
      // Notify other tabs that planner data has been updated
      localStorage.setItem('planner-updated', Date.now().toString());
      localStorage.removeItem('planner-updated');
    } catch (err) {
      console.error(err);
    }
    }

    // Reset form
    setTaskTitle("");
    setTaskSubject("");
    setTaskPriority("medium");
    setTaskDeadline("");
    setTaskNotes("");
    setShowModal(false);
  };


  // Toggle topic status
  const toggleTopicStatus = async (planId, topicId, currentStatus) => {
    try {
      const response = await fetch(`${API}/planner/${planId}/topics/${topicId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: currentStatus === "pending" ? "completed" : "pending",
        }),
      });
      
      if (response.ok) {
        const updatedPlan = await response.json();
        // Update the plans state immediately
        setPlans(prevPlans => 
          prevPlans.map(plan => 
            plan._id === planId ? updatedPlan : plan
          )
        );
        
        // Notify other tabs that planner data has been updated
        localStorage.setItem('planner-updated', Date.now().toString());
        localStorage.removeItem('planner-updated'); // Trigger storage event
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete topic
  const handleDeleteTopic = async (planId, topicId) => {
    if (!confirm("Are you sure you want to delete this topic?")) return;
    
    try {
      const response = await fetch(`${API}/planner/${planId}/topics/${topicId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Delete failed:", errorData);
        alert("Failed to delete topic: " + (errorData.message || "Unknown error"));
        return;
      }
      
      const updatedPlan = await response.json();
      console.log("Topic deleted successfully");
      
      // Update the plans state immediately
      setPlans(prevPlans => 
        prevPlans.map(plan => 
          plan._id === planId ? updatedPlan : plan
        )
      );
    } catch (err) {
      console.error("Delete error:", err);
      alert("Failed to delete topic. Please try again.");
    }
  };

  const calculateProgress = (topics) => {
    if (!topics.length) return 0;
    const completed = topics.filter((t) => t.status === "completed").length;
    return Math.round((completed / topics.length) * 100);
  };

  // Calculate overall progress
  const calculateOverallProgress = () => {
    if (!plans.length) return 0;
    const allTopics = plans.flatMap(plan => plan.topics);
    if (!allTopics.length) return 0;
    const completed = allTopics.filter(topic => topic.status === "completed").length;
    return Math.round((completed / allTopics.length) * 100);
  };

  // Get task statistics
  const getTaskStats = () => {
    const allTopics = plans.flatMap(plan => plan.topics);
    const completed = allTopics.filter(topic => topic.status === "completed").length;
    const pending = allTopics.filter(topic => topic.status === "pending").length;
    const highPriority = allTopics.filter(topic => topic.priority === "high").length;
    
    return { completed, pending, highPriority };
  };

  // Filter topics based on active filters
  const getFilteredTopics = () => {
    let allTopics = plans.flatMap(plan => 
      plan.topics.map(topic => ({ ...topic, planId: plan._id, planSubject: plan.subject }))
    );

    // Filter by status
    if (statusFilter === "active") {
      allTopics = allTopics.filter(topic => topic.status === "pending");
    } else if (statusFilter === "completed") {
      allTopics = allTopics.filter(topic => topic.status === "completed");
    }

    // Filter by time (simplified for now)
    if (activeFilter === "today") {
      // For demo purposes, show all topics
      return allTopics;
    } else if (activeFilter === "upcoming") {
      // For demo purposes, show all topics
      return allTopics;
    }

    return allTopics;
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high": return "bg-red-100 text-red-800";
      case "medium": return "bg-orange-100 text-orange-800";
      case "low": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getSubjectColor = (subject) => {
    const colors = {
      "Mathematics": "bg-purple-100 text-purple-800",
      "Science": "bg-green-100 text-green-800",
      "English": "bg-blue-100 text-blue-800",
      "History": "bg-orange-100 text-orange-800",
      "Maths": "bg-purple-100 text-purple-800",
      "eng": "bg-blue-100 text-blue-800",
      "computer": "bg-indigo-100 text-indigo-800"
    };
    return colors[subject] || "bg-gray-100 text-gray-800";
  };


  if (loading) return <div className="flex items-center justify-center min-h-screen">Loading study plans...</div>;

  const stats = getTaskStats();
  const filteredTopics = getFilteredTopics();
  const overallProgress = calculateOverallProgress();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">ReviseHub Planner</h1>
                <p className="text-sm text-gray-600">Your intelligent study assistant</p>
              </div>
            </div>
        <button
          onClick={() => setShowModal(true)}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition flex items-center space-x-2"
        >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>Add Task</span>
        </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Today's Progress */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Today's Progress</h2>
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">{overallProgress}% complete</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${overallProgress}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{stats.completed}</div>
                  <div className="text-xs text-gray-600">Completed</div>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                    <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{stats.pending}</div>
                  <div className="text-xs text-gray-600">Pending</div>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{stats.highPriority}</div>
                  <div className="text-xs text-gray-600">High Priority</div>
                </div>
              </div>
            </div>

          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Filters */}
            <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
              <div className="flex items-center justify-between">
                <div className="flex space-x-1">
                  {["all", "today", "upcoming"].map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setActiveFilter(filter)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                        activeFilter === filter
                          ? "bg-purple-100 text-purple-700 border-b-2 border-purple-600"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      {filter === "all" ? "All Tasks" : filter.charAt(0).toUpperCase() + filter.slice(1)}
                    </button>
                  ))}
                </div>
                <div className="flex space-x-2">
                  {["active", "completed"].map((status) => (
                    <button
                      key={status}
                      onClick={() => setStatusFilter(status)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center space-x-1 ${
                        statusFilter === status
                          ? "bg-purple-100 text-purple-700"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                      </svg>
                      <span>{status.charAt(0).toUpperCase() + status.slice(1)}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Task List */}
            <div className="space-y-4">
              {filteredTopics.length === 0 ? (
                <div className="bg-white rounded-xl p-8 text-center shadow-sm">
                  <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
                  <p className="text-gray-600">Create your first task to get started!</p>
                </div>
              ) : (
                filteredTopics.map((topic) => (
                  <div
                    key={topic._id}
                    className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition"
                  >
                    <div className="flex items-start space-x-4">
                      <button
                        onClick={() => toggleTopicStatus(topic.planId, topic._id, topic.status)}
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition ${
                          topic.status === "completed"
                            ? "bg-green-500 border-green-500 text-white"
                            : "border-gray-300 hover:border-purple-500"
                        }`}
                      >
                        {topic.status === "completed" && (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                      
                      <div className="flex-1">
                        <h3 className={`text-lg font-medium ${
                          topic.status === "completed" ? "line-through text-gray-400" : "text-gray-900"
                        }`}>
                          {topic.name || topic.title}
                        </h3>
                        
                        <div className="flex items-center space-x-4 mt-2">
                          <div className="flex items-center space-x-2">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSubjectColor(topic.planSubject)}`}>
                              {topic.planSubject}
                            </span>
                          </div>
                          
                            {topic.dueDate && (
                            <div className="flex items-center space-x-1">
                              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span className="text-sm text-gray-600">
                                {new Date(topic.dueDate).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                        </div>
                        
                        {topic.description && (
                          <p className="text-sm text-gray-600 mt-2">{topic.description}</p>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(topic.priority || "medium")}`}>
                          {topic.priority || "medium"}
                        </span>
                        <button
                          onClick={() => handleDeleteTopic(topic.planId, topic._id)}
                          className="text-red-500 hover:text-red-700 transition"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal for creating new task */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Add New Task</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleAddTask} className="space-y-6">
              {/* Task Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Task Title *
                </label>
    <input
      type="text"
                  placeholder="e.g., Complete Chapter 5 exercises"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="w-full px-4 py-3 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                  required
                />
              </div>

              {/* Subject and Priority Row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subject *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={taskSubject}
                      onChange={(e) => setTaskSubject(e.target.value)}
                      placeholder="Type subject name"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority *
                  </label>
                  <div className="relative">
                    <select
                      value={taskPriority}
                      onChange={(e) => setTaskPriority(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none bg-white"
                      required
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Deadline */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Deadline *
                </label>
                <div className="relative">
    <input
      type="date"
                    value={taskDeadline}
                    onChange={(e) => setTaskDeadline(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  placeholder="Add any additional notes or details..."
                  value={taskNotes}
                  onChange={(e) => setTaskNotes(e.target.value)}
                  rows="4"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-4">
      <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
      >
        Cancel
      </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium"
                >
                  Add Task
                </button>
              </div>
            </form>
    </div>
  </div>
)}
    </div>
  );
}
