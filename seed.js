import mongoose from "mongoose";
import "dotenv/config";
import Venture from "./src/models/Venture.js";

await mongoose.connect(process.env.MONGO_URI);

await Venture.deleteMany();

await Venture.insertMany([
  {
    code: "VEN-2025-101",
    name: "AgriTech Phnom Penh",
    sector: "Agriculture",
    country: "Cambodia",
    stage: "READINESS",
    readinessScore: 78,
    capitalStatus: "IN_PROGRESS",
    capitalFacilitatedUsd: 150000
  },
  {
    code: "VEN-2025-102",
    name: "Clean Energy Laos",
    sector: "Clean Energy",
    country: "Laos",
    stage: "DIAGNOSTICS",
    readinessScore: 45,
    capitalStatus: "NOT_STARTED",
    capitalFacilitatedUsd: 0
  },
  {
    code: "VEN-2025-103",
    name: "FinTech Thailand",
    sector: "Technology",
    country: "Thailand",
    stage: "READINESS",
    readinessScore: 69,
    capitalStatus: "FACILITATED",
    capitalFacilitatedUsd: 250000
  }
]);

console.log("✅ Seed data inserted");
await mongoose.disconnect();
