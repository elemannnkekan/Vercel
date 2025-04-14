import fs from "fs";
import path from "path";

export default async function handler(req, res) {
  const filePath = path.resolve("/tmp", "tokens.json");

  if (!fs.existsSync(filePath)) {
    return res.status(200).json({ valid: false, deleted: true, info: null });
  }

  const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  const now = Date.now();

  const token = req.query.token; // URL'deki token (dosya adı gibi)
  const foundEntry = Object.values(data).find(entry => entry.token === token);

  if (!foundEntry) {
    return res.status(200).json({ valid: false, deleted: true, info: null });
  }

  if (now > foundEntry.expiresAfter) {
    return res.status(200).json({ valid: false, deleted: true, info: null });
  }

  return res.status(200).json({ valid: true, deleted: false, info: foundEntry });
}
