import fs from "fs";
import path from "path";

export default async function handler(req, res) {
  const ip = req.headers["x-forwarded-for"]?.split(",")[0] || req.connection.remoteAddress;
  const filePath = path.resolve("/tmp", "tokens.json");

  // Dosya yoksa oluştur
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify({}));
  }

  let data = JSON.parse(fs.readFileSync(filePath, "utf-8"));

  const now = Date.now();
  const expiryDuration = 24 * 60 * 60 * 1000; // 24 saat

  if (data[ip] && now < data[ip].expiresAfter) {
    // Eski key geçerli
    return res.status(200).json({
      valid: true,
      deleted: false,
      info: data[ip]
    });
  }

  // Yeni key üret
  const token = crypto.randomUUID();
  const createdAt = now;
  const expiresAfter = now + expiryDuration;

  data[ip] = { token, createdAt, expiresAfter };

  fs.writeFileSync(filePath, JSON.stringify(data));

  return res.status(200).json({
    valid: true,
    deleted: false,
    info: data[ip]
  });
}
