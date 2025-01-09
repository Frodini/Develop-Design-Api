import express, { Application } from "express";
import cors from "cors";
import morgan from "morgan";
import { DatabaseService } from "../database/database.service";

const app: Application = express();

// Middlewares
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

// Test endpoint
app.get("/", (req, res) => {
  res.send("API is running!");
});

// Inicializar base de datos
(async () => {
  const dbService = DatabaseService.getInstance();
  await dbService.initializeDatabase();
})();

// Configuración del puerto
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
