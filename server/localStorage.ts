import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { randomUUID } from "crypto";

const UPLOADS_DIR = path.resolve(process.cwd(), "uploads");

export async function saveFile(
  data: Buffer,
  originalName: string,
  mimeType: string
): Promise<{ key: string; url: string }> {
  if (!existsSync(UPLOADS_DIR)) {
    await mkdir(UPLOADS_DIR, { recursive: true });
  }
  const ext = path.extname(originalName) || ".bin";
  const key = `${randomUUID()}${ext}`;
  const filePath = path.join(UPLOADS_DIR, key);
  await writeFile(filePath, data);
  return { key, url: `/uploads/${key}` };
}

export async function saveBase64File(
  base64: string,
  originalName: string,
  mimeType: string
): Promise<{ key: string; url: string }> {
  const data = Buffer.from(base64, "base64");
  return saveFile(data, originalName, mimeType);
}
