import "reflect-metadata";
import express, { Application } from "express";
import cors from "cors";
import morgan from "morgan";
import { Container } from "typedi";
import { DatabaseService } from "../database/database.service";
import { Api } from "./api";
import listEndpoints from "express-list-endpoints";

const app: Application = express();

app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

const api = Container.get(Api);
app.use("/api", api.getApiRouter());

(async () => {
  try {
    const dbService = Container.get(DatabaseService);
    await dbService.initializeDatabase();
    console.log("Database initialized successfully.");
  } catch (error) {
    console.error("Error initializing the database:", error);
    process.exit(1);
  }
})();

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

console.log(listEndpoints(app));
