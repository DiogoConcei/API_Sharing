import crypto from "crypto";
import { nanoid } from "nanoid";
import path from "path";
import os from "os";
import { Request, Response } from "express";
import fileMap from "../storage/fileMap";

export function getLocalIp(): string {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]!) {
      if (net.family === "IPv4" && !net.internal) return net.address;
    }
  }
  return "localhost";
}

export function handleUpload(req: Request, res: Response) {
  if (!req.file)
    return res.status(400).json({ error: "Nenhum arquivo enviado" });

  const hash = crypto
    .createHash("sha256")
    .update(req.file.buffer)
    .digest("hex");

  if (fileMap.has(hash)) {
    const existingCode = fileMap.get(hash)!;
    const ip = getLocalIp();
    const port = process.env.PORT || 3030;
    const maskedUrl = `http://${ip}:${port}/api/dl/${existingCode}`;
    return res.json({ url: maskedUrl, message: "Arquivo já enviado" });
  }

  const code = nanoid(6);
  const expiresIn = 5 * 60 * 1000;
  const expiresAt = Date.now() + expiresIn;

  fileMap.set(code, {
    filename: req.file.filename,
    mimetype: req.file.mimetype,
    expiresAt,
  });

  const ip = getLocalIp();
  const port = process.env.PORT || 3030;
  const maskedUrl = `http://${ip}:${port}/api/dl/${code}`;

  res.json({ url: maskedUrl, expiresInMs: expiresIn, code });
}

export function handleDownload(req: Request, res: Response) {
  const code = req.params.code;

  if (!code) return res.status(404).send("Código não encontrado!");

  const fileEntry = fileMap.get(code);

  if (!fileEntry)
    return res.status(404).send("Arquivo não encontrado ou expirado");
  if (Date.now() > fileEntry.expiresAt) {
    fileMap.delete(code);
    return res.status(410).send("Link expirado");
  }

  const filePath = path.join(__dirname, "../uploads", fileEntry.filename);
  res.type(fileEntry.mimetype);
  res.sendFile(filePath);
}
