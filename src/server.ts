import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import fileRoutes from "./routes/fileRoutes";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use("/file", express.static(path.join(__dirname, "uploads")));
app.use("/api", fileRoutes);

const port = process.env.PORT || 3030;

app.listen(port, () => {
  console.log(`Servidor rodando na porta: http://localhost:${port}`);
});
