# Campus Hustle

A student-focused marketplace to buy, sell and chat about items within a campus community.

**Stack:** React (Vite) · Node.js + Express · MongoDB (Mongoose) · WebSocket (`ws`) · REST

| Module | What it does | Requirements |
|---|---|---|
| 1. Auth | Register, log in, log out, protected pages | REQ-1 |
| 2. Listings | Create, edit, delete listings with a photo; owner-only | REQ-2, REQ-3, REQ-7 |
| 3. Browse | Search, filter by category / condition / price, sort | REQ-4 |
| 4. Item details | Item page with seller and a "Message" button | REQ-5 |
| 5. Real-time chat | WebSocket chat between buyer and item owner | REQ-6 |
| (6) My listings | Page to manage your own listings | – |

## Setup (local)

Requires Node 18+, a MongoDB database (local or a free Atlas cluster) and a free [Cloudinary](https://cloudinary.com) account for images.

**Cloudinary:** sign up, open the Dashboard, and copy the *Cloud name*, *API Key* and *API Secret*.

```bash
# 1. API + WebSocket server
cd server
cp .env.example .env      # Windows: copy .env.example .env
# edit .env: JWT_SECRET, MONGO_URI and the three CLOUDINARY_* values
npm install
npm run dev               # http://localhost:5000

# 2. Frontend (new terminal)
cd client
npm install
npm run dev               # http://localhost:5173
```

Open http://localhost:5173 and register.

**Try the chat:** register a second account in a private/incognito window, list an item with account A, open it with account B and click "Message". Messages appear instantly on both sides.

## Environment (`server/.env`)

| Variable | Meaning |
|---|---|
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret used to sign login tokens |
| `CLOUDINARY_CLOUD_NAME` / `_API_KEY` / `_API_SECRET` | Image storage credentials |
| `CLIENT_ORIGIN` | Website address(es) allowed to use the API (comma-separated). Default `http://localhost:5173`. On Render it is filled in automatically for the single-service setup |
| `ALLOWED_EMAIL_DOMAIN` | Optional. e.g. `youruni.edu.in` to allow only campus emails |
| `PORT` | Set automatically by Render. Default 5000 |

Images go straight to Cloudinary (the database stores only the image URL), so nothing is saved on the server's disk and there is no `uploads/` folder to commit.

## Deploying

> **Important:** Vercel runs serverless functions, which cannot hold a WebSocket connection open, so the **backend (with chat) must run on Render**. The frontend can be on Render too, or on Vercel.

First, for either option:
1. Push the project to GitHub (make sure `.env` is **not** committed).
2. MongoDB Atlas -> *Network Access* -> allow `0.0.0.0/0` (Render's IP addresses change).

### Option A (simplest): everything on Render, one service

1. Render dashboard -> **New** -> **Blueprint** -> pick your repo. It reads `render.yaml`.
   (Or **New -> Web Service** with Build command `npm run build` and Start command `npm start`.)
2. Fill in the secrets it asks for: `MONGO_URI`, the three `CLOUDINARY_*` values (and optionally `ALLOWED_EMAIL_DOMAIN`). `JWT_SECRET` is generated for you.
3. Deploy. Your site is at `https://campus-hustle.onrender.com` (or similar). The same address serves the React app, the API and the WebSocket, so no extra settings are needed.

### Option B: frontend on Vercel + backend on Render

1. Deploy the backend on Render as above, but as a plain **Web Service** with **Root Directory `server`**, Build `npm install`, Start `npm start`. Set `NODE_ENV=production`, `MONGO_URI`, `JWT_SECRET`, the `CLOUDINARY_*` values.
2. Open `client/vercel.json` and replace `YOUR-RENDER-APP.onrender.com` with your Render address. Commit and push.
3. Vercel -> **Add New Project** -> pick the repo -> **Root Directory: `client`** (Framework: Vite). Add the environment variable `VITE_WS_URL=wss://YOUR-RENDER-APP.onrender.com`. Deploy.
4. Back on Render, set `CLIENT_ORIGIN=https://your-project.vercel.app` (your Vercel address, no trailing slash) and redeploy the backend.

Vercel forwards `/api/*` calls to Render, so login cookies stay on your Vercel domain. Only the WebSocket connects straight to Render.

### Good to know (free plans)
- Render's free service **sleeps after ~15 minutes** without traffic; the first visit afterwards takes about 30-60 seconds. Open chats reconnect automatically.
- Avoid the Vercel "Preview" URLs for chat testing; the WebSocket only accepts the address in `CLIENT_ORIGIN`.

## Project structure

```
server/
  server.js              Express + HTTP server, mounts routes, starts WebSocket
  socket.js              WebSocket server (auth, routing messages to both users)
  config/                db.js, origins.js
  models/                User, Listing, Conversation, Message
  middleware/            auth (protect), upload (images)
  controllers/           auth, listing, chat
  routes/                auth, listings, chats
  utils/                 cloudinary (images), wsTicket, asyncWrap
client/
  vercel.json            Vercel settings (Option B)
client/src/
  api.js                 all REST calls
  context/AuthContext    login state
  components/            Navbar, Layout, ListingCard, AuthLayout, RouteGuards
  pages/                 Login, Register, Home (browse), ListingDetails,
                         ListingForm, MyListings, Chats
```

## REST API

| Method | Route | Auth | Purpose |
|---|---|---|---|
| POST | /api/auth/register | – | Create account, start session |
| POST | /api/auth/login | – | Log in |
| POST | /api/auth/logout | – | Log out |
| GET | /api/auth/me | yes | Current user |
| GET | /api/listings | yes | Browse. Query: `q, category, condition, minPrice, maxPrice, sort` |
| GET | /api/listings/mine | yes | My listings |
| GET | /api/listings/:id | yes | One listing + seller name |
| POST | /api/listings | yes | Create (multipart, optional `image`) |
| PUT | /api/listings/:id | owner | Update |
| DELETE | /api/listings/:id | owner | Delete (also removes its Cloudinary image and chats) |
| POST | /api/chats | yes | Start or reopen a chat about a listing `{listingId}` |
| GET | /api/chats | yes | My conversations |
| GET | /api/chats/ws-ticket | yes | 60-second ticket to open the WebSocket |
| GET | /api/chats/:id/messages | participant | Message history |

## WebSocket (`/ws`)

Matches the "WebSocket Communication Flow" slide:

1. User opens an item and clicks Message (REST creates/finds the conversation).
2. The React client asks for a 60-second ticket (`GET /api/chats/ws-ticket`) and opens a WebSocket to `/ws?ticket=...`. A ticket is used instead of the cookie so chat also works when the site and API are on different domains.
3. Client sends `{ "type": "message", "conversationId": "...", "text": "..." }`.
4. Server checks the sender belongs to that conversation and saves the message in MongoDB.
5. Server pushes `{ "type": "message", message, conversation }` to both people instantly (all their open tabs).
6. Replies follow the same path. The client reconnects automatically if the connection drops.

## Security notes

- Passwords hashed with bcrypt; JWT kept in an **httpOnly cookie**.
- Server-side validation on all input; rate limiting on login/register; Helmet headers.
- Owner checks (edit/delete) happen on the server, not only in the UI (403 otherwise).
- Seller email is never exposed to other users; contact happens through chat.
- Chat: only the two participants can read a conversation or send into it; WebSocket checks the `Origin` header, message length (1-1000) and send rate.
- Uploads: type allow-list (JPG/PNG/WebP), 2 MB limit, kept in memory and sent to Cloudinary; images are shrunk to max 1200px.
- Search text is escaped before it is used in a database query.
