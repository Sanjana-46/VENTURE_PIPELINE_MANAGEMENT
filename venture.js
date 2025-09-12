import mongoose from "mongoose";

const VentureSchema = new mongoose.Schema({
  code: { type: String, unique: true, required: true },
  name: { type: String, required: true },
  sector: { type: String, required: true },       // e.g. "Agriculture"
  country: { type: String, required: true },      // e.g. "Cambodia"
  stage: { type: String, enum: ["INTAKE", "DIAGNOSTICS", "READINESS", "CAPITAL_FACILITATION"], required: true },
  readinessScore: { type: Number },
  capitalStatus: { type: String, enum: ["NOT_STARTED", "IN_PROGRESS", "FACILITATED"], required: true },
  capitalFacilitatedUsd: { type: Number, default: 0 },
  lastUpdated: { type: Date, default: Date.now }
});

export default mongoose.model("Venture", VentureSchema);
