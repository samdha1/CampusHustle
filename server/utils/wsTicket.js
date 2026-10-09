// Short-lived "ticket" used to open the WebSocket.
// Why not the login cookie? When the frontend and API are on different domains (e.g. Vercel + Render),
// browsers may not send the cookie on the WebSocket connection. A 60-second ticket works everywhere.
// It is signed with a different secret from the session token, so it can't be used as a login.
const jwt = require("jsonwebtoken");

const secret = () => process.env.JWT_SECRET + ":ws";

exports.signTicket = (userId) => jwt.sign({ id: String(userId) }, secret(), { expiresIn: "60s" });
exports.verifyTicket = (ticket) => jwt.verify(ticket, secret()).id;
