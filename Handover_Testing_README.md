# VPMS — Handover Testing Pack

This pack lets anyone verify the Venture Pipeline API quickly, even without a local MongoDB, using an **in‑memory Mongo** during tests.

## Files
- `jest.config.mjs` — Jest setup
- `tests/ventures.test.js` — integration tests for `/api/ventures` and `/api/metrics`
- `package.testing.additions.json` — scripts/devDependencies to merge into your backend `package.json`
- `VPMS.postman_collection.json` — Postman collection to hit the local API

## How to run tests (no DB required)
1. In your backend folder, install test deps:
   ```bash
   npm i -D jest supertest mongodb-memory-server
   ```
2. Add this script to your `package.json`:
   ```json
   "scripts": { "test": "node --experimental-vm-modules ./node_modules/jest/bin/jest.js" }
   ```
3. Place `jest.config.mjs` at the project root (beside your package.json).
4. Create a `tests/` folder and add `tests/ventures.test.js`.
5. Run:
   ```bash
   npm test
   ```

## Postman
- Import `VPMS.postman_collection.json` into Postman.
- Start your backend (`npm run dev`).
- Run the requests to see live responses.

## What this demonstrates
- **Technical**: working API, seed-equivalent data, CRUD basics tested.
- **Leadership/Docs**: clear handover steps, automated checks, and a ready-to-use Postman collection.
