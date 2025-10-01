const express = require("express");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const cors = require("cors");


dotenv.config();

const app = express();

app.use(cors({
  origin: "http://localhost:5173", // your Vite frontend
  credentials: true, // optional, if using cookies
}));

app.use(express.json());


// connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log(" MongoDB connected"))
.catch(err => console.error("MongoDB connection error:", err));

const authRoutes = require("./routes/auth");
app.use('/auth', authRoutes);

const noteRoutes = require("./routes/noteRoutes");
app.use("/notes", noteRoutes);

const plannerRoutes = require('./routes/plannerRoutes');
app.use('/planner', plannerRoutes);


const progressRoutes = require('./routes/progressRoutes');
app.use('/progress', progressRoutes);



const PORT = process.env.PORT || 5000;

app.get("/", (req, res) => {
  res.send(" Server is running...");
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
