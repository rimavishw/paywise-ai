require("dotenv").config({
  path: require("path").join(__dirname, "../.env")
});

const express = require("express");
const cors = require("cors");
const supabase = require("./supabase");

const app = express();

const authRouter = require("./routes/auth");
const recipientsRouter = require("./routes/recipients");
const transactionsRouter = require("./routes/transactions");
const eventsRouter = require("./routes/events");
const checkRouter = require("./routes/check");         // NEW
const paymentsRouter = require("./routes/payments");   // NEW

app.set("trust proxy", 1);                              // NEW (needed on Render)
app.use(cors());
app.use(express.json());

// HOME
app.get("/", (req, res) => {
  res.json({
    message: "PayWise AI Backend is running!",
    status: "success"
  });
});

// HEALTH CHECK
app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",
    service: "PayWise AI"
  });
});

// NEW: plain health check for Render and uptime pingers
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// DATABASE TEST
app.get("/api/db-test", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("id")
      .limit(1);

    if (error) throw error;

    res.json({
      status: "success",
      message: "Supabase database connected successfully!",
      data
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message
    });
  }
});

// AUTHENTICATION APIs
app.use("/api/auth", authRouter);

// RECIPIENT APIs
app.use("/api/recipients", recipientsRouter);

// TRANSACTION APIs
app.use("/api/transactions", transactionsRouter);
app.use("/api/events", eventsRouter);

// NEW: PayWise two-panel MVP
app.use("/api/check", checkRouter);
app.use("/api/payments", paymentsRouter);

// SERVER
const PORT = process.env.PORT || 5050;

app.listen(PORT, () => {
  console.log(`PayWise AI server running on port ${PORT}`);
});