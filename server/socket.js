// WebSocket server for real-time chat (REQ-6).
// Flow: client gets a ticket over REST, connects to /ws?ticket=... -> sends {type:"message", conversationId, text}
// -> server saves it and pushes it to both participants.
const mongoose = require("mongoose");
const { WebSocketServer } = require("ws");
const User = require("./models/User");
const allowedOrigins = require("./config/origins");
const { verifyTicket } = require("./utils/wsTicket");
const Conversation = require("./models/Conversation");
const Message = require("./models/Message");

const send = (ws, payload) => ws.readyState === 1 && ws.send(JSON.stringify(payload));

module.exports = function setupSocket(server) {
  const wss = new WebSocketServer({ noServer: true });
  const clients = new Map(); // userId -> Set of sockets (one user may have several tabs)

  server.on("upgrade", async (req, socket, head) => {
    const reject = (line) => {
      socket.write(`HTTP/1.1 ${line}\r\n\r\n`);
      socket.destroy();
    };
    try {
      const { pathname } = new URL(req.url, "http://localhost");
      if (pathname !== "/ws") return socket.destroy();

      // Block cross-site WebSocket hijacking: only our own frontend may connect
      if (!allowedOrigins.includes(req.headers.origin)) return reject("403 Forbidden");

      // Authenticate with the short-lived ticket from GET /api/chats/ws-ticket
      const ticket = new URL(req.url, "http://localhost").searchParams.get("ticket");
      if (!ticket) return reject("401 Unauthorized");
      const user = await User.findById(verifyTicket(ticket)).select("_id");
      if (!user) return reject("401 Unauthorized");

      wss.handleUpgrade(req, socket, head, (ws) => {
        ws.userId = String(user._id);
        wss.emit("connection", ws);
      });
    } catch {
      reject("401 Unauthorized");
    }
  });

  wss.on("connection", (ws) => {
    if (!clients.has(ws.userId)) clients.set(ws.userId, new Set());
    clients.get(ws.userId).add(ws);

    ws.isAlive = true;
    ws.recent = []; // timestamps for simple flood control
    ws.on("pong", () => (ws.isAlive = true));

    ws.on("message", async (raw) => {
      try {
        let data;
        try {
          data = JSON.parse(raw.toString());
        } catch {
          return send(ws, { type: "error", message: "Invalid message." });
        }
        if (data.type !== "message") return;

        const now = Date.now();
        ws.recent = ws.recent.filter((t) => now - t < 10000);
        if (ws.recent.length >= 20) return send(ws, { type: "error", message: "You're sending too fast. Slow down." });
        ws.recent.push(now);

        const text = typeof data.text === "string" ? data.text.trim() : "";
        if (!text || text.length > 1000) {
          return send(ws, { type: "error", message: "Message must be 1-1000 characters." });
        }
        if (!mongoose.isValidObjectId(data.conversationId)) {
          return send(ws, { type: "error", message: "Conversation not found." });
        }

        const convo = await Conversation.findById(data.conversationId);
        if (!convo || !(convo.buyer.equals(ws.userId) || convo.seller.equals(ws.userId))) {
          return send(ws, { type: "error", message: "Conversation not found." });
        }

        const message = await Message.create({ conversation: convo._id, sender: ws.userId, text });
        convo.lastMessage = text.slice(0, 80);
        convo.lastMessageAt = message.createdAt;
        await convo.save();

        const payload = {
          type: "message",
          message: { _id: message._id, conversation: convo._id, sender: ws.userId, text, createdAt: message.createdAt },
          conversation: { _id: convo._id, lastMessage: convo.lastMessage, lastMessageAt: convo.lastMessageAt },
        };
        // Deliver to both people (the sender's copy doubles as the "sent" confirmation)
        new Set([String(convo.buyer), String(convo.seller)]).forEach((id) =>
          clients.get(id)?.forEach((s) => send(s, payload))
        );
      } catch (e) {
        console.error("WS error:", e);
        send(ws, { type: "error", message: "Could not send message." });
      }
    });

    ws.on("close", () => {
      const set = clients.get(ws.userId);
      set?.delete(ws);
      if (set && set.size === 0) clients.delete(ws.userId);
    });
  });

  // Drop dead connections every 30s
  const beat = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (!ws.isAlive) return ws.terminate();
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);
  wss.on("close", () => clearInterval(beat));
};
