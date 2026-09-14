import cors from "cors";
import express from "express";
import { CORS_ORIGIN, PORT } from "./config.js";
import {
  checkOrgTreeIntegrity,
  generateOrgTree,
} from "./data/generateOrgTree.js";

const app = express();
app.use(cors({ origin: CORS_ORIGIN }));

const orgTree = generateOrgTree();

const integrity = checkOrgTreeIntegrity(orgTree);
if (!integrity.isValid) {
  throw new Error(
    `Сгенерированные мок-данные нарушают целостность: ${integrity.errors.join("; ")}`,
  );
}

app.get("/api/org-tree", (_req, res) => {
  res.json(orgTree);
});

app.listen(PORT, () => {
  console.log(`Mock API сервер запущен: http://localhost:${PORT}/api/org-tree`);
});
