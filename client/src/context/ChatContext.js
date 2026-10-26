import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { api } from "../api.js";
import { useAuth } from "./AuthContext.jsx";
import { useToast } from "./ToastContext.jsx";

// One WebSocket for the whole app (while logged in), so you get notified about new messages on any page.
//   - unread: number of unread messages (navbar badge)
//   - send(conversationId, text): send a chat message
//   - subscribe(fn): the Chats page listens here to update its lists live
const ChatContext = createContext(null);

export function ChatProvider({ children }) {
  const { user } = useAuth();
  const toast = useToast();
  const location = useLocation();

  const [connected, setConnected] = useState(false);
  const [unread, setUnread] = useState(0);

  const wsRef = useRef(null);
  const listeners = useRef(new Set());
  // Refs so the long-lived socket handler always sees current values
  const pathRef = useRef(location.pathname);
  const userRef = useRef(user);
  pathRef.current = location.pathname;
  userRef.current = user;

  const refreshUnread = useCallback(() => {
    api.unread().then((d) => setUnread(d.count)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!user) {
      setUnread(0);
      setConnected(false);
      return;
    }
    refreshUnread();

    let closed = false;
    let retry = 0;
    let timer;

    const connect = async () => {
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
        refreshUnread(); // catch up on anything that arrived while disconnected
      };
      ws.onclose = () => {
        setConnected(false);
        if (!closed) timer = setTimeout(connect, Math.min(1000 * 2 ** retry++, 10000));
      };
      ws.onmessage = (event) => {
        let data;
        try {
          data = JSON.parse(event.data);
        } catch {
          return;
        }

        if (data.type === "error") return toast.error(data.message);

        if (data.type === "message") {
          const { message, conversation, from } = data;
          const mine = message.sender === userRef.current?.id;

          if (!mine) {
            const viewing = pathRef.current === `/chats/${message.conversation}`;
            if (viewing) {
              api.markRead(message.conversation).catch(() => {}); // they are reading it right now
            } else {
              setUnread((n) => n + 1);
              toast.info(message.text.length > 90 ? message.text.slice(0, 90) + "…" : message.text, {
                title: conversation.firstMessage
                  ? `${from.name} is interested in "${conversation.listingTitle}"`
                  : `${from.name} · ${conversation.listingTitle || "New message"}`,
                to: `/chats/${message.conversation}`,
              });
            }
          }
          listeners.current.forEach((fn) => fn(data));
        }
      };
    };

    connect();
    return () => {
      closed = true;
      clearTimeout(timer);
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [user?.id, refreshUnread, toast]);

  // Show the unread count in the browser tab title
  useEffect(() => {
    document.title = unread > 0 ? `(${unread}) Campus Hustle` : "Campus Hustle";
  }, [unread]);

  const send = useCallback((conversationId, text) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== 1) return false;
    ws.send(JSON.stringify({ type: "message", conversationId, text }));
    return true;
  }, []);

  const subscribe = useCallback((fn) => {
    listeners.current.add(fn);
    return () => listeners.current.delete(fn);
  }, []);

  const value = useMemo(
    () => ({ connected, unread, refreshUnread, send, subscribe }),
    [connected, unread, refreshUnread, send, subscribe]
  );
  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export const useChat = () => useContext(ChatContext);