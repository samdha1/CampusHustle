import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useChat } from "../context/ChatContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { formatPrice, timeAgo } from "../constants.js";
import Avatar from "../components/Avatar.jsx";

// Real-time chat between an interested user and the item owner (REQ-6).
// History is loaded over REST; live messages arrive through the app-wide WebSocket (ChatContext).
export default function Chats() {
  const { id: activeId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { connected, send, subscribe, refreshUnread } = useChat();
  const toast = useToast();

  const [conversations, setConversations] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [ending, setEnding] = useState(false);

  const bottomRef = useRef(null);
  // Refs let the live-message handler always see the latest values
  const activeRef = useRef(activeId);
  const convosRef = useRef(conversations);
  activeRef.current = activeId;
  convosRef.current = conversations;

  const loadConversations = useCallback(() => {
    api.chats().then((d) => setConversations(d.conversations)).catch((e) => setError(e.message));
  }, []);

  useEffect(loadConversations, [loadConversations]);

  // Open a conversation: load history and mark it read
  useEffect(() => {
    setError("");
    if (!activeId) return setMessages([]);
    api.messages(activeId).then((d) => setMessages(d.messages)).catch((e) => setError(e.message));
    api.markRead(activeId)
      .then(() => {
        refreshUnread();
        setConversations((prev) => prev && prev.map((c) => (c._id === activeId ? { ...c, unread: 0 } : c)));
      })
      .catch(() => {});
  }, [activeId, refreshUnread]);

  // Live messages
  useEffect(
    () =>
      subscribe(({ message, conversation }) => {
        const mine = message.sender === user.id;
        const viewing = message.conversation === activeRef.current;

        if (viewing) {
          setMessages((prev) => (prev.some((m) => m._id === message._id) ? prev : [...prev, message]));
        }
        if (convosRef.current?.some((c) => c._id === conversation._id)) {
          setConversations((prev) =>
            prev
              .map((c) =>
                c._id === conversation._id
                  ? {
                      ...c,
                      lastMessage: conversation.lastMessage,
                      lastMessageAt: conversation.lastMessageAt,
                      unread: mine || viewing ? c.unread : (c.unread || 0) + 1,
                    }
                  : c
              )
              .sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt))
          );
        } else {
          loadConversations(); // a brand-new conversation isn't in the list yet
        }
      }),
    [subscribe, user.id, loadConversations]
  );

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages]);

  const submit = (e) => {
    e.preventDefault();
    const body = text.trim();
    if (!body || !activeId) return;
    if (!send(activeId, body)) return toast.error("Not connected yet. Reconnecting…");
    setText(""); // our own copy comes back from the server, which confirms it was saved
  };

  const endChat = async () => {
    if (!activeId || ending) return;
    const confirmed = window.confirm(
      "End this chat? It will be removed from your list and your chat history will be cleared. The other person keeps their copy, and a new message can reopen the chat."
    );
    if (!confirmed) return;

    setEnding(true);
    try {
      await api.endChat(activeId);
      setConversations((prev) => prev?.filter((conversation) => conversation._id !== activeId) ?? prev);
      setMessages([]);
      refreshUnread();
      navigate("/chats", { replace: true });
      toast.success("Chat ended and removed from your list.");
    } catch (e) {
      toast.error(e.message);
    } finally {
      setEnding(false);
    }
  };

  const otherPerson = (c) => (c.buyer._id === user.id ? c.seller : c.buyer);
  const active = conversations?.find((c) => c._id === activeId);

  return (
    <>
      <div className="page__head">
        <div>
          <h1 className="page__title">Messages</h1>
          <p className="page__sub">Chat with buyers and sellers in real time.</p>
        </div>
      </div>

      <div className={`chats ${activeId ? "chats--open" : ""}`}>
        <aside className="chats__list" aria-label="Conversations">
          {!conversations && <p className="chats__empty">Loading…</p>}
          {conversations?.length === 0 && (
            <p className="chats__empty">
              No conversations yet. Open an item and choose "Message" to ask the seller a question.
            </p>
          )}
          {conversations?.map((c) => {
            const other = otherPerson(c);
            return (
              <Link key={c._id} to={`/chats/${c._id}`} className={`convo ${c._id === activeId ? "convo--active" : ""}`}>
                <Avatar user={other} size={44} />
                <span className="convo__text">
                  <span className="convo__row">
                    <strong>{other.name}</strong>
                    <time className="convo__time">{c.lastMessage ? timeAgo(c.lastMessageAt) : ""}</time>
                  </span>
                  <span className="convo__item">{c.listing?.title}</span>
                  <span className={`convo__last ${c.unread > 0 ? "convo__last--unread" : ""}`}>
                    {c.lastMessage || "No messages yet"}
                  </span>
                </span>
                {c.unread > 0 && <span className="convo__badge" aria-label={`${c.unread} unread`}>{c.unread}</span>}
              </Link>
            );
          })}
        </aside>

        <section className="chats__thread" aria-label="Conversation">
          {!activeId && (
            <div className="chats__placeholder">
              <div className="empty__icon" aria-hidden="true">💬</div>
              <p>Choose a conversation to start chatting.</p>
            </div>
          )}
          {activeId && conversations && !active && <p className="chats__empty">Conversation not found.</p>}

          {active && (
            <>
              <header className="thread__head">
                <Link to="/chats" className="thread__back" aria-label="Back to all chats">←</Link>
                <Avatar user={otherPerson(active)} size={42} />
                <div className="thread__who">
                  <strong>{otherPerson(active).name}</strong>
                  <span className="thread__status-dot">{connected ? "Online" : "Reconnecting…"}</span>
                </div>
                {active.listing && (
                  <Link to={`/listings/${active.listing._id}`} className="thread__item">
                    {active.listing.image && <img src={active.listing.image} alt="" />}
                    <span>
                      <strong>{active.listing.title}</strong>
                      <span>{formatPrice(active.listing.price)}</span>
                    </span>
                  </Link>
                )}
                <button
                  type="button"
                  className="btn btn--danger btn--sm"
                  onClick={endChat}
                  disabled={ending}
                >
                  {ending ? "Ending…" : "End chat"}
                </button>
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

              <form className="thread__form" onSubmit={submit}>
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Type a message"
                  aria-label="Message"
                  maxLength={1000}
                  autoComplete="off"
                />
                <button type="submit" className="btn" disabled={!connected || !text.trim()}>Send</button>
              </form>
            </>
          )}
        </section>
      </div>
    </>
  );
}