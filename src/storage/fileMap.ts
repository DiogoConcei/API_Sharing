interface FileEntry {
  filename: string;
  mimetype: string;
  expiresAt: number;
}

const fileMap = new Map<string, FileEntry>();

export default fileMap;
