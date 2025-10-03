import React, { useEffect, useState } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

export default function PlannerPage() {
  const [plans, setPlans] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newSubject, setNewSubject] = useState("");
  const [newTopics, setNewTopics] = useState("");
  const [loading, setLoading] = useState(true);

  const API = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const token = localStorage.getItem("token");

  // Fetch all study plans
  const fetchPlans = async () => {
    try {
      const res = await fetch(`${API}/planner`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setPlans(data);
    } catch (err) {
      console.error("Error fetching plans:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    fetchPlans();
  }, []);

  // Add new plan
  const handleAddPlan = async (e) => {
    e.preventDefault();
    if (!newSubject || !newTopics) return;

    const topicsArray = newTopics.split(",").map((t) => ({
      name: t.trim(),
      status: "pending",
      dueDate: null,
    }));

    try {
      const res = await fetch(`${API}/planner/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ subject: newSubject, topics: topicsArray }),
      });
      const plan = await res.json();
      setPlans([...plans, plan]);
      setNewSubject("");
      setNewTopics("");
      setShowModal(false);
    } catch (err) {
      console.error("Error adding plan:", err);
    }
  };

  // Toggle topic status
  const toggleTopicStatus = async (planId, topicId, currentStatus) => {
    try {
      await fetch(`${API}/planner/${planId}/topics/${topicId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: currentStatus === "pending" ? "completed" : "pending",
        }),
      });
      fetchPlans(); // Refresh after update
    } catch (err) {
      console.error("Error updating topic:", err);
    }
  };

  const calculateProgress = (topics) => {
    if (!topics.length) return 0;
    const completed = topics.filter((t) => t.status === "completed").length;
    return Math.round((completed / topics.length) * 100);
  };

  // Drag & Drop handling
  const handleDragEnd = async (result, planId) => {
    if (!result.destination) return;
    const plan = plans.find((p) => p._id === planId);
    const items = Array.from(plan.topics);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    try {
      await fetch(`${API}/planner/${planId}/reorder`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ topics: items }),
      });
      fetchPlans();
    } catch (err) {
      console.error("Error reordering topics:", err);
    }
  };

  if (loading) return <div>Loading study plans...</div>;

  return (
    <div className="p-6 min-h-screen bg-gray-50">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Study Planner</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded shadow hover:bg-blue-600 transition"
        >
          + Add Plan
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div
            key={plan._id}
            className="bg-white p-5 rounded-xl shadow hover:shadow-lg transition"
          >
            <h2 className="text-xl font-semibold mb-2 text-gray-700">
              {plan.subject}
            </h2>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
              <div
                className="bg-green-500 h-2 rounded-full transition-all"
                style={{ width: `${calculateProgress(plan.topics)}%` }}
              ></div>
            </div>

            {/* Drag & Drop Topics */}
            <DragDropContext
              onDragEnd={(result) => handleDragEnd(result, plan._id)}
            >
              <Droppable droppableId={plan._id}>
                {(provided) => (
                  <ul
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="space-y-2"
                  >
                    {plan.topics.map((topic, index) => (
                      <Draggable
                        key={topic._id}
                        draggableId={topic._id}
                        index={index}
                      >
                        {(provided) => (
                          <li
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className="flex justify-between items-center p-2 border rounded shadow-sm bg-gray-50"
                          >
                            <span
                              className={
                                topic.status === "completed"
                                  ? "line-through text-gray-400 font-medium"
                                  : "text-gray-700 font-medium"
                              }
                            >
                              {topic.name}
                            </span>
                            {topic.dueDate && (
                              <span className="text-xs text-red-500 ml-2">
                                Due: {new Date(topic.dueDate).toLocaleDateString()}
                              </span>
                            )}
                            <button
                              onClick={() =>
                                toggleTopicStatus(plan._id, topic._id, topic.status)
                              }
                              className={`px-3 py-1 rounded-full text-sm font-medium transition ${
                                topic.status === "completed"
                                  ? "bg-green-500 text-white hover:bg-green-600"
                                  : "bg-gray-300 text-gray-700 hover:bg-gray-400"
                              }`}
                            >
                              {topic.status === "completed" ? "Done" : "Pending"}
                            </button>
                          </li>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </ul>
                )}
              </Droppable>
            </DragDropContext>
          </div>
        ))}
      </div>

      {/* Add Plan Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-lg">
            <h3 className="text-xl font-bold mb-4">Add New Study Plan</h3>
            <form onSubmit={handleAddPlan} className="flex flex-col gap-3">
              <input
                type="text"
                placeholder="Subject"
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
                className="border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <input
                type="text"
                placeholder="Topics (comma separated)"
                value={newTopics}
                onChange={(e) => setNewTopics(e.target.value)}
                className="border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <div className="flex justify-end gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600 transition"
                >
                  Add Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
