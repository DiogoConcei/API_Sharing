import { Router } from "express";
import multer from "multer";
import path from "path";
import { nanoid } from "nanoid";
import os from "os";

const router = Router();

// Onde os arquivos serão salvos
const storage = multer.diskStorage({
  destination: path.join(__dirname, "../uploads"),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = nanoid(10) + ext;
    cb(null, name);
  },
});

const upload = multer({ storage });

const fileMap = new Map<
  string,
  { filename: string; expiresAt: number; mimetype: string }
>();

function getLocalIp(): string {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]!) {
      if (net.family === "IPv4" && !net.internal) {
        return net.address;
      }
    }
  }
  return "localhost";
}

router.post("/upload", upload.single("file"), (req, res) => {
  if (!req.file)
    return res.status(400).json({ error: "Nenhum arquivo enviado" });

  const code = nanoid(6); // código curto
  const expiresIn = 5 * 60 * 1000; // 5 minutos
  const expiresAt = Date.now() + expiresIn;

  fileMap.set(code, {
    filename: req.file.filename,
    mimetype: req.file.mimetype,
    expiresAt,
  });

  const ip = getLocalIp();
  const port = process.env.PORT || 3030;
  const maskedUrl = `http://${ip}:${port}/api/dl/${code}`;

  return res.json({
    url: maskedUrl,
    expiresInMs: expiresIn,
    code,
  });
});

router.get("/dl/:code", (req, res) => {
  const code = req.params.code;
  const fileEntry = fileMap.get(code);

  if (!fileEntry) {
    return res.status(404).send("Arquivo não encontrado ou expirado");
  }

  if (Date.now() > fileEntry.expiresAt) {
    fileMap.delete(code);
    return res.status(410).send("Link expirado");
  }

  const filePath = path.join(__dirname, "../uploads", fileEntry.filename);
  res.type(fileEntry.mimetype);

  return res.sendFile(filePath);
});

export default router;
