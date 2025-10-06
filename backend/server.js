const express = require("express");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

dotenv.config();

const app = express();

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN, // use frontend URL in production
  credentials: true
}));

// JSON body parser
app.use(express.json());

// Serve uploads folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error("MongoDB connection error:", err));

// Routes
app.use("/auth", require("./routes/auth"));
app.use("/notes", require("./routes/notes"));
app.use("/planner", require("./routes/plannerRoutes"));
app.use("/progress", require("./routes/progressRoutes"));

// Test route
app.get("/", (req, res) => {
  res.send("Server is running...");
});

// Listen on Render-assigned PORT
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
