// tests/ventures.test.js
import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import mongoosePkg from "mongoose";
const { Schema, model } = mongoosePkg;

const VentureSchema = new Schema({
  code: { type: String, unique: true, required: true },
  name: { type: String, required: true },
  sector: { type: String, required: true },
  country: { type: String, required: true },
  stage: { 
    type: String, 
    enum: ["INTAKE", "DIAGNOSTICS", "READINESS", "CAPITAL_FACILITATION"], 
    required: true 
  },
  readinessScore: { type: Number },
  capitalStatus: { 
    type: String, 
    enum: ["NOT_STARTED", "IN_PROGRESS", "FACILITATED"], 
    required: true 
  },
  capitalFacilitatedUsd: { type: Number, default: 0 },
  lastUpdated: { type: Date, default: Date.now }
});
const Venture = model("Venture", VentureSchema);

function buildApp() {
  const app = express();
  app.use(helmet());
  app.use(express.json());
  app.use(cors({ origin: "*" }));

  app.get("/api/ventures", async (_req, res) => {
    try {
      const ventures = await Venture.find().sort({ lastUpdated: -1 });
      res.json(ventures);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/metrics", async (_req, res) => {
    try {
      const ventures = await Venture.find();
      const total = ventures.length;
      const avgReadiness = ventures.reduce((sum, v) => sum + (v.readinessScore || 0), 0) / (total || 1);
      const totalCapital = ventures.reduce((sum, v) => sum + (v.capitalFacilitatedUsd || 0), 0);
      res.json({
        totalVentures: total,
        averageReadiness: Math.round(avgReadiness * 10) / 10,
        capitalFacilitatedUsd: totalCapital
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/ventures", async (req, res) => {
    try {
      const created = await Venture.create({ ...req.body, lastUpdated: new Date() });
      res.status(201).json(created);
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  });

  app.put("/api/ventures/:id", async (req, res) => {
    try {
      const updated = await Venture.findByIdAndUpdate(req.params.id, { ...req.body, lastUpdated: new Date() }, { new: true });
      if (!updated) return res.status(404).json({ error: "Not found" });
      res.json(updated);
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  });

  app.delete("/api/ventures/:id", async (req, res) => {
    try {
      const deleted = await Venture.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Not found" });
      res.json({ ok: true, id: req.params.id });
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  });

  return app;
}

let mongod;
let app;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await mongoose.connect(uri);

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

  app = buildApp();
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
});

test("GET /api/ventures returns seeded ventures", async () => {
  const res = await request(app).get("/api/ventures");
  expect(res.status).toBe(200);
  expect(Array.isArray(res.body)).toBe(true);
  expect(res.body.length).toBe(3);
  expect(res.body[0]).toHaveProperty("name");
});

test("GET /api/metrics calculates portfolio KPIs", async () => {
  const res = await request(app).get("/api/metrics");
  expect(res.status).toBe(200);
  expect(res.body).toHaveProperty("totalVentures", 3);
  expect(res.body).toHaveProperty("averageReadiness");
  expect(res.body).toHaveProperty("capitalFacilitatedUsd");
});

test("POST /api/ventures creates a new venture", async () => {
  const payload = {
    code: "VEN-2025-200",
    name: "EduTech Phnom Penh",
    sector: "Education",
    country: "Cambodia",
    stage: "INTAKE",
    readinessScore: 10,
    capitalStatus: "NOT_STARTED",
    capitalFacilitatedUsd: 0
  };
  const res = await request(app).post("/api/ventures").send(payload);
  expect(res.status).toBe(201);
  expect(res.body).toHaveProperty("_id");
  expect(res.body.code).toBe("VEN-2025-200");
});

test("PUT /api/ventures/:id updates venture", async () => {
  const list = await request(app).get("/api/ventures");
  const id = list.body[0]._id;
  const res = await request(app).put(`/api/ventures/${id}`).send({ readinessScore: 80 });
  expect(res.status).toBe(200);
  expect(res.body.readinessScore).toBe(80);
});

test("DELETE /api/ventures/:id removes venture", async () => {
  const list = await request(app).get("/api/ventures");
  const id = list.body[0]._id;
  const res = await request(app).delete(`/api/ventures/${id}`);
  expect(res.status).toBe(200);
  const list2 = await request(app).get("/api/ventures");
  expect(list2.body.length).toBe(3);
});
