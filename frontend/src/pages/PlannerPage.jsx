import React, { useEffect, useState } from "react";
import PageHeader from "../components/PageHeader";

export default function PlannerPage() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskSubject, setTaskSubject] = useState("");
  const [taskPriority, setTaskPriority] = useState("medium");
  const [taskDeadline, setTaskDeadline] = useState("");
  const [taskNotes, setTaskNotes] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("active");

  const API = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) return;
    fetchPlans();
  }, []);

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

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!taskTitle || !taskSubject) return;

    const existingPlan = plans.find((plan) => plan.subject === taskSubject);
    const newTopic = {
      name: taskTitle,
      status: "pending",
      dueDate: taskDeadline || null,
      priority: taskPriority,
      description: taskNotes,
    };

    if (existingPlan) {
      try {
        const res = await fetch(`${API}/planner/${existingPlan._id}/topics`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(newTopic),
        });
        const updatedPlan = await res.json();
        setPlans((prev) =>
          prev.map((plan) => (plan._id === existingPlan._id ? updatedPlan : plan))
        );
        localStorage.setItem("planner-updated", Date.now().toString());
      } catch (err) {
        console.error(err);
      }
    } else {
      try {
        const res = await fetch(`${API}/planner/create`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ subject: taskSubject, topics: [newTopic] }),
        });
        const newPlan = await res.json();
        setPlans((prev) => [...prev, newPlan]);
        localStorage.setItem("planner-updated", Date.now().toString());
      } catch (err) {
        console.error(err);
      }
    }

    setTaskTitle("");
    setTaskSubject("");
    setTaskPriority("medium");
    setTaskDeadline("");
    setTaskNotes("");
    setShowModal(false);
  };

  const toggleTopicStatus = async (planId, topicId, currentStatus) => {
    try {
      const res = await fetch(`${API}/planner/${planId}/topics/${topicId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: currentStatus === "pending" ? "completed" : "pending" }),
      });
      const updatedPlan = await res.json();
      setPlans((prev) => prev.map((plan) => (plan._id === planId ? updatedPlan : plan)));
      localStorage.setItem("planner-updated", Date.now().toString());
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTopic = async (planId, topicId) => {
    if (!confirm("Are you sure you want to delete this topic?")) return;
    try {
      const res = await fetch(`${API}/planner/${planId}/topics/${topicId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const updatedPlan = await res.json();
      setPlans((prev) => prev.map((plan) => (plan._id === planId ? updatedPlan : plan)));
    } catch (err) {
      console.error(err);
      alert("Failed to delete topic");
    }
  };

  const calculateOverallProgress = () => {
    if (!plans.length) return 0;
    const allTopics = plans.flatMap((plan) => plan.topics);
    if (!allTopics.length) return 0;
    const completed = allTopics.filter((t) => t.status === "completed").length;
    return Math.round((completed / allTopics.length) * 100);
  };

  const getTaskStats = () => {
    const allTopics = plans.flatMap((plan) => plan.topics);
    return {
      completed: allTopics.filter((t) => t.status === "completed").length,
      pending: allTopics.filter((t) => t.status === "pending").length,
      highPriority: allTopics.filter((t) => t.priority === "high").length,
    };
  };

  const getFilteredTopics = () => {
    let allTopics = plans.flatMap((plan) =>
      plan.topics.map((topic) => ({ ...topic, planId: plan._id, planSubject: plan.subject }))
    );

    if (statusFilter === "active") allTopics = allTopics.filter((t) => t.status === "pending");
    else if (statusFilter === "completed") allTopics = allTopics.filter((t) => t.status === "completed");

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
      Mathematics: "bg-purple-100 text-purple-800",
      Science: "bg-green-100 text-green-800",
      English: "bg-blue-100 text-blue-800",
      History: "bg-orange-100 text-orange-800",
      computer: "bg-indigo-100 text-indigo-800",
    };
    return colors[subject] || "bg-gray-100 text-gray-800";
  };

  if (loading)
    return <div className="flex items-center justify-center min-h-screen">Loading study plans...</div>;

  const stats = getTaskStats();
  const filteredTopics = getFilteredTopics();
  const overallProgress = calculateOverallProgress();

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="ReviseHub Planner"
        subtitle="Your intelligent study assistant"
        action={
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center px-4 py-2 bg-black text-white rounded-xl hover:bg-gray-800 transition whitespace-nowrap"
          >
            + Add Task
          </button>
        }
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Mobile Summary */}
        <div className="block lg:hidden bg-white rounded-xl p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Today's Progress</h2>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">{overallProgress}% complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <div
              className="bg-green-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <div>Completed: {stats.completed}</div>
            <div>Pending: {stats.pending}</div>
            <div>High: {stats.highPriority}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar for large screens */}
          <div className="hidden lg:block lg:col-span-1 bg-white rounded-xl p-5 shadow-sm space-y-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Today's Progress</h2>
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">{overallProgress}% complete</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${overallProgress}%` }}
                />
              </div>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <div>Completed: {stats.completed}</div>
              <div>Pending: {stats.pending}</div>
              <div>High: {stats.highPriority}</div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Filters */}
            <div className="bg-white rounded-xl p-4 shadow-sm flex flex-wrap justify-between gap-2">
              <div className="flex flex-wrap gap-2">
                {["all", "today", "upcoming"].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setActiveFilter(filter)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                      activeFilter === filter
                        ? "bg-purple-100 text-purple-700 border-b-2 border-purple-600"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    {filter.charAt(0).toUpperCase() + filter.slice(1)}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap gap-2">
                {["active", "completed"].map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                      statusFilter === status ? "bg-purple-100 text-purple-700" : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Task List */}
            <div className="space-y-4">
              {filteredTopics.length === 0 ? (
                <div className="bg-white rounded-xl p-6 text-center shadow-sm">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
                  <p className="text-gray-600">Create your first task to get started!</p>
                </div>
              ) : (
                filteredTopics.map((topic) => (
                  <div
                    key={topic._id}
                    className="bg-white rounded-xl p-4 sm:p-6 shadow-sm hover:shadow-md transition flex flex-col sm:flex-row sm:items-start sm:justify-between space-y-3 sm:space-y-0"
                  >
                    <div className="flex items-center space-x-3">
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

                      <div>
                        <h3 className={`text-lg font-medium ${
                          topic.status === "completed" ? "line-through text-gray-400" : "text-gray-900"
                        }`}>
                          {topic.name}
                        </h3>
                        <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-600">
                          <span className={`px-2 py-1 rounded-full ${getSubjectColor(topic.planSubject)}`}>
                            {topic.planSubject}
                          </span>
                          {topic.dueDate && <span>Due: {new Date(topic.dueDate).toLocaleDateString()}</span>}
                        </div>
                        {topic.description && <p className="text-gray-600 mt-2">{topic.description}</p>}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(topic.priority || "medium")}`}>
                        {topic.priority || "medium"}
                      </span>
                      <button
                        onClick={() => handleDeleteTopic(topic.planId, topic._id)}
                        className="text-red-500 hover:text-red-700 transition"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Add New Task</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>
            <form onSubmit={handleAddTask} className="space-y-6">
              <input
                type="text"
                placeholder="Task Title *"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Subject *"
                  value={taskSubject}
                  onChange={(e) => setTaskSubject(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
                <select
                  value={taskPriority}
                  onChange={(e) => setTaskPriority(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <input
                type="date"
                value={taskDeadline}
                onChange={(e) => setTaskDeadline(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              />
              <textarea
                placeholder="Notes (Optional)"
                value={taskNotes}
                onChange={(e) => setTaskNotes(e.target.value)}
                rows="4"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
              />
              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
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
