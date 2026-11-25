import crypto from "node:crypto";
import { defineServer, defineRoom, monitor, playground, LobbyRoom } from "colyseus";
import { MyRoom } from "./rooms/MyRoom.js";

const SECRET = process.env.NINECRAFT_ADMIN_PASSWORD || "fallback-secret";

export function verifyAdminToken(token: unknown): boolean {
  if (typeof token !== "string" || !token.includes(".")) return false;
  const [exp, sig] = token.split(".");
  if (Number(exp) < Date.now()) return false;
  const expected = crypto.createHmac("sha256", SECRET).update(exp).digest("hex");
  return sig === expected;
}

const server = defineServer({
  rooms: {
    my_room: defineRoom(MyRoom).enableRealtimeListing(),
    lobby: defineRoom(LobbyRoom),
  },
  express: (app) => {
    app.use((req, res, next) => {
      res.header("Access-Control-Allow-Origin", "*");
      res.header("Access-Control-Allow-Headers", "Content-Type");
      if (req.method === "OPTIONS") return res.sendStatus(200);
      next();
    });

    app.post("/api/admin-login", (req, res) => {
      const { adminName, password } = req.body || {};
      const validName = process.env.NINECRAFT_ADMIN_NAME || "市木廉";
      const validPass = process.env.NINECRAFT_ADMIN_PASSWORD;

      if (!validPass || adminName !== validName || password !== validPass) {
        return res.status(401).json({ ok: false, error: "認証に失敗しました" });
      }
      const exp = String(Date.now() + 1000 * 60 * 60 * 24 * 7);
      const sig = crypto.createHmac("sha256", SECRET).update(exp).digest("hex");
      res.json({ ok: true, adminName: validName, token: `${exp}.${sig}` });
    });

    if (process.env.NODE_ENV !== "production") {
      app.use("/monitor", monitor());
      app.use("/playground", playground());
    }
  },
});

export default server;
export { server };
