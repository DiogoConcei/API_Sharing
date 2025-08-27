import { Router } from "express";
import upload from "../middleware/multer";
import { handleUpload, handleDownload } from "../services/fileService";

const router = Router();

router.post("/upload", upload.single("file"), handleUpload);
router.get("/dl/:code", handleDownload);

export default router;
