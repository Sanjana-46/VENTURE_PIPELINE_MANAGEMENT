import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import mongoose from "mongoose";
import Venture from "./src/models/Venture.js";


const app = express();

app.use(helmet());
app.use(express.json());
app.use(cors({ origin: process.env.CORS_ORIGIN || "*" }));

// Connect MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("❌ Mongo error:", err));

// Health check
app.get("/", (req, res) => {
  res.json({ ok: true, service: "VPMS Backend (MongoDB)" });
});

// Get all ventures
app.get("/api/ventures", async (req, res) => {
  const ventures = await Venture.find().sort({ lastUpdated: -1 });
  res.json(ventures);
});

// Get metrics
app.get("/api/metrics", async (req, res) => {
  const ventures = await Venture.find();
  const total = ventures.length;
  const avgReadiness = ventures.reduce((sum, v) => sum + (v.readinessScore || 0), 0) / (total || 1);
  const totalCapital = ventures.reduce((sum, v) => sum + (v.capitalFacilitatedUsd || 0), 0);

  res.json({
    totalVentures: total,
    averageReadiness: Math.round(avgReadiness * 10) / 10,
    capitalFacilitatedUsd: totalCapital
  });
});

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`✅ Server running at http://localhost:${port}`));

// Simple request validation
function validateVenture(body) {
  const required = ["code", "name", "sector", "country", "stage", "capitalStatus"];
  for (const k of required) if (!body[k]) return `${k} is required`;
  const stages = ["INTAKE", "DIAGNOSTICS", "READINESS", "CAPITAL_FACILITATION"];
  const caps = ["NOT_STARTED", "IN_PROGRESS", "FACILITATED"];
  if (!stages.includes(body.stage)) return "invalid stage";
  if (!caps.includes(body.capitalStatus)) return "invalid capitalStatus";
  if (body.readinessScore != null && (body.readinessScore < 0 || body.readinessScore > 100)) return "invalid readinessScore";
  if (body.capitalFacilitatedUsd != null && body.capitalFacilitatedUsd < 0) return "invalid capitalFacilitatedUsd";
  return null;
}

// POST /api/ventures (create)
app.post("/api/ventures", async (req, res) => {
  try {
    const err = validateVenture(req.body);
    if (err) return res.status(400).json({ error: err });
    const created = await Venture.create({ ...req.body, lastUpdated: new Date() });
    res.status(201).json(created);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PUT /api/ventures/:id (update)
app.put("/api/ventures/:id", async (req, res) => {
  try {
    const patch = { ...req.body, lastUpdated: new Date() };
    const updated = await Venture.findByIdAndUpdate(req.params.id, patch, { new: true });
    if (!updated) return res.status(404).json({ error: "Not found" });
    res.json(updated);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE /api/ventures/:id
app.delete("/api/ventures/:id", async (req, res) => {
  try {
    const deleted = await Venture.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Not found" });
    res.json({ ok: true, id: req.params.id });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
