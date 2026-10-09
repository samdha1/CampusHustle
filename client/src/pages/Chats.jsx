import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { formatPrice } from "../constants.js";

// Real-time chat between an interested user and the item owner (REQ-6).
// History is loaded over REST; new messages travel over a WebSocket.
export default function Chats() {
  const { id: activeId } = useParams();
  const { user } = useAuth();

  const [conversations, setConversations] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState("");

  const wsRef = useRef(null);
  const bottomRef = useRef(null);
  // Refs let the long-lived socket handler always see the latest values
  const activeRef = useRef(activeId);
  const convosRef = useRef(conversations);
  activeRef.current = activeId;
  convosRef.current = conversations;

  const loadConversations = useCallback(() => {
    api.chats().then((d) => setConversations(d.conversations)).catch((e) => setError(e.message));
  }, []);

  useEffect(loadConversations, [loadConversations]);

  // Load history when a conversation is opened
  useEffect(() => {
    setError("");
    if (!activeId) return setMessages([]);
    api.messages(activeId).then((d) => setMessages(d.messages)).catch((e) => setError(e.message));
  }, [activeId]);

  // WebSocket with automatic reconnect
  useEffect(() => {
    let closed = false;
    let retry = 0;
    let timer;

    const connect = async () => {
      // Get a short-lived ticket over REST, then open the socket with it
      let ticket;
      try {
        ticket = (await api.wsTicket()).ticket;
      } catch {
        if (!closed) timer = setTimeout(connect, Math.min(1000 * 2 ** retry++, 10000));
        return;
      }
      if (closed) return;

      // VITE_WS_URL is only needed when the API lives on another domain (Vercel + Render)
      const base =
        import.meta.env.VITE_WS_URL ||
        `${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.host}`;
      const ws = new WebSocket(`${base}/ws?ticket=${encodeURIComponent(ticket)}`);
      wsRef.current = ws;

      ws.onopen = () => {
        retry = 0;
        setConnected(true);
      };
      ws.onclose = () => {
        setConnected(false);
        if (!closed) timer = setTimeout(connect, Math.min(1000 * 2 ** retry++, 10000));
      };
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.type === "error") return setError(data.message);

        if (data.type === "message") {
          const { message, conversation } = data;

          // Show it if that conversation is open (ignore duplicates)
          if (message.conversation === activeRef.current) {
            setMessages((prev) => (prev.some((m) => m._id === message._id) ? prev : [...prev, message]));
          }
          // Update the sidebar; a brand-new conversation isn't in the list yet, so reload it
          if (convosRef.current?.some((c) => c._id === conversation._id)) {
            setConversations((prev) =>
              prev
                .map((c) => (c._id === conversation._id ? { ...c, ...conversation } : c))
                .sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt))
            );
          } else {
            loadConversations();
          }
        }
      };
    };

    connect();
    return () => {
      closed = true;
      clearTimeout(timer);
      wsRef.current?.close();
    };
  }, [loadConversations]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages]);

  const send = (e) => {
    e.preventDefault();
    const body = text.trim();
    if (!body || !activeId || wsRef.current?.readyState !== 1) return;
    wsRef.current.send(JSON.stringify({ type: "message", conversationId: activeId, text: body }));
    setText(""); // our own copy comes back from the server, which confirms it was saved
  };

  const otherPerson = (c) => (c.buyer._id === user.id ? c.seller : c.buyer);
  const active = conversations?.find((c) => c._id === activeId);

  return (
    <>
      <h1 className="page__title">Messages</h1>
      <div className={`chats ${activeId ? "chats--open" : ""}`}>
        <aside className="chats__list" aria-label="Conversations">
          {!conversations && <p className="chats__empty">Loading…</p>}
          {conversations?.length === 0 && (
            <p className="chats__empty">No conversations yet. Open an item and choose "Message" to ask the seller a question.</p>
          )}
          {conversations?.map((c) => (
            <Link key={c._id} to={`/chats/${c._id}`} className={`convo ${c._id === activeId ? "convo--active" : ""}`}>
              <strong>{otherPerson(c).name}</strong>
              <span className="convo__item">{c.listing?.title}</span>
              <span className="convo__last">{c.lastMessage || "No messages yet"}</span>
            </Link>
          ))}
        </aside>

        <section className="chats__thread" aria-label="Conversation">
          {!activeId && <p className="chats__empty">Choose a conversation.</p>}
          {activeId && conversations && !active && <p className="chats__empty">Conversation not found.</p>}

          {active && (
            <>
              <header className="thread__head">
                <Link to="/chats" className="thread__back">All chats</Link>
                <div>
                  <strong>{otherPerson(active).name}</strong>
                  <Link to={`/listings/${active.listing._id}`} className="thread__item">
                    {active.listing.title} · {formatPrice(active.listing.price)}
                  </Link>
                </div>
              </header>

              <div className="thread__messages" aria-live="polite">
                {messages.length === 0 && <p className="chats__empty">Say hello to start the conversation.</p>}
                {messages.map((m) => (
                  <p key={m._id} className={`bubble ${m.sender === user.id ? "bubble--mine" : ""}`}>
                    {m.text}
                    <time dateTime={m.createdAt}>
                      {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </time>
                  </p>
                ))}
                <div ref={bottomRef} />
              </div>

              {error && <p className="error thread__error" role="alert">{error}</p>}
              {!connected && <p className="thread__status">Reconnecting…</p>}

              <form className="thread__form" onSubmit={send}>
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Type a message"
                  aria-label="Message"
                  maxLength={1000}
                  autoComplete="off"
                />
                <button type="submit" disabled={!connected || !text.trim()}>Send</button>
              </form>
            </>
          )}
        </section>
      </div>
    </>
  );
}
