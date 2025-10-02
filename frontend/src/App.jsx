import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import DashboardLayout from "./components/DashboardLayout";
import DashboardHome from "./pages/DashboardHome";
import NotesPage from "./pages/NotesPage";
import PlannerPage from "./pages/PlannerPage";
import ProgressPage from "./pages/ProgressPage";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route path="/dashboard" element={<DashboardLayout />}>
        <Route index element={<DashboardHome />} />
        <Route path="notes" element={<NotesPage />} />
        <Route path="planner" element={<PlannerPage />} />
        <Route path="progress" element={<ProgressPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
}

export default App;
