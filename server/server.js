require("dotenv").config();
const fs = require("fs");
const http = require("http");
const path = require("path");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const allowedOrigins = require("./config/origins");
const connectDB = require("./config/db");
const setupSocket = require("./socket");

const required = ["JWT_SECRET", "MONGO_URI", "CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"];
const missing = required.filter((k) => !process.env[k]);
if (missing.length || allowedOrigins.length === 0) {
  console.error(
    "Missing environment variables: " + [...missing, ...(allowedOrigins.length ? [] : ["CLIENT_ORIGIN"])].join(", ") +
      "\nCopy .env.example to .env (or set them in your hosting dashboard)."
  );
  process.exit(1);
}

const isProd = process.env.NODE_ENV === "production";
const app = express();

// Render / Vercel sit behind a proxy: needed for correct client IPs (rate limiting) and secure cookies
if (isProd) app.set("trust proxy", 1);

app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        "img-src": ["'self'", "data:", "https://res.cloudinary.com"],
        "connect-src": ["'self'", "ws:", "wss:"],
        ...(isProd ? {} : { "upgrade-insecure-requests": null }), // plain http on localhost
      },
    },
  })
);
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json({ limit: "10kb" }));
app.use(cookieParser());

app.use("/api/auth", require("./routes/auth"));         // Module 1
app.use("/api/listings", require("./routes/listings")); // Modules 2, 3, 4
app.use("/api/chats", require("./routes/chats"));       // Module 5
app.use("/api/profile", require("./routes/profile"));   // Profile
app.get("/api/health", (req, res) => res.json({ ok: true }));

// If the React app has been built (npm run build), serve it from here too.
// This is how the single-service Render deployment works.
const clientDist = path.join(__dirname, "..", "client", "dist");
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get(/^\/(?!api\/|ws).*/, (req, res) => res.sendFile(path.join(clientDist, "index.html")));
}

app.use((req, res) => res.status(404).json({ message: "Not found." }));

// HTTP server is shared by Express (REST) and the WebSocket server (/ws)
const server = http.createServer(app);
setupSocket(server);

const PORT = process.env.PORT || 5000;
connectDB().then(() => server.listen(PORT, () => console.log(`API + WebSocket running on port ${PORT}`)));
