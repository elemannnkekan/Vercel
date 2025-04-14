import fs from "fs";
import path from "path";
import crypto from "crypto";

export default async function handler(req, res) {
  const filePath = path.resolve("/tmp", "tokens.json");

  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify({}));
  }

  let data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  const now = Date.now();

  const queryToken = req.query.token;

  // Eğer token verildiyse, sadece doğrulama yap
  if (queryToken) {
    const foundEntry = Object.values(data).find(entry => entry.token === queryToken);

    if (!foundEntry) {
      return res.status(200).json({ valid: false, deleted: true, info: null });
    }

    if (now > foundEntry.expiresAfter) {
      return res.status(200).json({ valid: false, deleted: true, info: null });
    }

    return res.status(200).json({ valid: true, deleted: false, info: foundEntry });
  }

  // Token üretecekse: IP kontrolü
  const ip = req.headers["x-forwarded-for"]?.split(",")[0] || req.connection.remoteAddress;
  const expiryDuration = 60 * 1000; // 1 dakika
  const existing = data[ip];

  if (existing && now < existing.expiresAfter) {
    return res.status(200).json({ valid: true, deleted: false, info: existing });
  }

  if (existing && now > existing.expiresAfter) {
    // Token süresi dolmuş, tekrar üretilemez
    return res.status(200).json({ valid: false, deleted: true, info: null });
  }

  // Yeni key üretimi
  const token = crypto.randomUUID();
  const createdAt = now;
  const expiresAfter = now + expiryDuration;

  data[ip] = { token, createdAt, expiresAfter };
  fs.writeFileSync(filePath, JSON.stringify(data));

  return res.status(200).json({ valid: true, deleted: false, info: data[ip] });
}
