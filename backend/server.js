const express = require("express");
const dotenv = require("dotenv");
const mongoose = require("mongoose");

dotenv.config();

const app = express();

// connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("✅ MongoDB connected"))
.catch(err => console.error("❌ MongoDB connection error:", err));

const noteRoutes = require("./routes/noteRoutes");
app.use("/api/notes", noteRoutes);


const PORT = process.env.PORT || 5000;

app.get("/", (req, res) => {
  res.send("✅ Server is running...");
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
