import { useState, useEffect, useCallback, useRef } from "react";
import {
  MessageSquare, Send, Check, CheckCheck,
  ChevronDown, ChevronUp, RefreshCw,
  Clock, Phone, User, Megaphone, InboxIcon, CornerDownRight,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const API_BASE = import.meta.env.VITE_API_URL || "https://axess-backend.up.railway.app";

function useAuthHeaders() {
  const { session, businessId } = useAuth();
  return useCallback(() => {
    const h = { "Content-Type": "application/json", "X-Business-Id": businessId || "" };
    if (session?.access_token) h["Authorization"] = `Bearer ${session.access_token}`;
    return h;
  }, [session?.access_token, businessId]);
}

function useApiFetch() {
  const authHeaders = useAuthHeaders();
  const { businessId } = useAuth();
  return useCallback(async (path, opts = {}) => {
    if (!businessId) return Promise.reject(new Error("Not authenticated"));
    const r = await fetch(`${API_BASE}${path}`, {
      ...opts,
      headers: { ...authHeaders(), ...(opts.headers || {}) },
    });
    const data = await r.json().catch(() => ({}));
    return { ...data, ok: r.ok };
  }, [authHeaders, businessId]);
}

function EmptyInbox() {
  return (
    <div className="inbox-empty">
      <div className="inbox-empty__icon"><InboxIcon size={48} strokeWidth={1.2} /></div>
      <h3>האינבוקס ריק</h3>
      <p>הודעות חוזרות מלקוחות יופיעו כאן</p>
    </div>
  );
}

function ReplyBox({ message, onSend, onCancel, apiFetch }) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const textareaRef = useRef();

  useEffect(() => { textareaRef.current?.focus(); }, []);

  const smsCount = text.length === 0 ? 0 : text.length <= 160 ? 1 : Math.ceil(text.length / 153);
  const charLeft = text.length <= 160 ? 160 - text.length : 153 - ((text.length - 160) % 153);

  const handleSend = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    setError(null);
    try {
      const res = await apiFetch(`/api/sms/inbox/${message.id}/reply`, {
        method: "POST",
        body: JSON.stringify({ reply_text: text.trim() }),
      });
      if (res.ok) onSend(text.trim());
      else setError(res.error || "שגיאה בשליחה");
    } catch { setError("שגיאת רשת"); }
    finally { setSending(false); }
  };

  return (
    <div className="reply-box">
      <div className="reply-box__header">
        <CornerDownRight size={14} />
        <span>תשובה אל {message.sender_name || message.from_phone}</span>
      </div>
      <textarea
        ref={textareaRef}
        className="reply-box__textarea"
        placeholder="כתוב תשובה..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        maxLength={612}
      />
      <div className="reply-box__footer">
        <span className="reply-box__counter">
          {text.length > 0 && `${charLeft} תווים • ${smsCount} SMS`}
        </span>
        {error && <span className="reply-box__error">{error}</span>}
        <div className="reply-box__actions">
          <button className="btn btn--ghost btn--sm" onClick={onCancel}>ביטול</button>
          <button className="btn btn--primary btn--sm" onClick={handleSend} disabled={!text.trim() || sending}>
            {sending ? <RefreshCw size={14} className="spin" /> : <Send size={14} />}
            <span>שלח SMS</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function MessageRow({ msg, onMarkRead, onReplySent, apiFetch }) {
  const [showReply, setShowReply] = useState(false);
  const [localMsg, setLocalMsg] = useState(msg);

  const handleMarkRead = async () => {
    if (localMsg.is_read) return;
    await apiFetch(`/api/sms/inbox/${localMsg.id}/read`, { method: "PATCH" });
    setLocalMsg((m) => ({ ...m, is_read: true }));
    onMarkRead();
  };

  const handleReplySent = (replyText) => {
    setLocalMsg((m) => ({ ...m, is_read: true, replied_at: new Date().toISOString(), reply_message: replyText }));
    setShowReply(false);
    onReplySent();
  };

  const formatTime = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    const diff = Date.now() - d;
    if (diff < 60000) return "עכשיו";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}ד׳`;
    if (diff < 86400000) return d.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" });
    return d.toLocaleDateString("he-IL", { day: "2-digit", month: "2-digit" });
  };

  return (
    <div
      className={`msg-row ${!localMsg.is_read ? "msg-row--unread" : ""} ${localMsg.replied_at ? "msg-row--replied" : ""}`}
      onClick={!localMsg.is_read ? handleMarkRead : undefined}
    >
      <div className="msg-row__avatar"><User size={18} /></div>
      <div className="msg-row__body">
        <div className="msg-row__top">
          <span className="msg-row__name">{localMsg.sender_name || localMsg.from_phone}</span>
          {localMsg.sender_name && (
            <span className="msg-row__phone"><Phone size={11} />{localMsg.from_phone}</span>
          )}
          <span className="msg-row__time"><Clock size={11} />{formatTime(localMsg.received_at)}</span>
          {!localMsg.is_read && <span className="msg-row__badge-dot" />}
        </div>
        <p className="msg-row__text">{localMsg.message}</p>

        {localMsg.replied_at && (
          <div className="msg-row__replied">
            <CheckCheck size={13} />
            <span>ענית: &quot;{localMsg.reply_message}&quot;</span>
            <span className="msg-row__replied-time">{formatTime(localMsg.replied_at)}</span>
          </div>
        )}

        {!localMsg.replied_at && !showReply && (
          <div className="msg-row__actions">
            <button className="btn btn--reply" onClick={(e) => { e.stopPropagation(); setShowReply(true); handleMarkRead(); }}>
              <CornerDownRight size={13} />ענה
            </button>
          </div>
        )}

        {showReply && (
          <ReplyBox message={localMsg} onSend={handleReplySent} onCancel={() => setShowReply(false)} apiFetch={apiFetch} />
        )}
      </div>
    </div>
  );
}

function CampaignGroup({ group, onMarkAllRead, onRefresh, apiFetch }) {
  const [open, setOpen] = useState(true);
  const [localUnread, setLocalUnread] = useState(group.unread);

  const handleMarkAllRead = async () => {
    await apiFetch("/api/sms/inbox/read-all", {
      method: "PATCH",
      body: JSON.stringify({ campaign_id: group.campaign_id }),
    });
    setLocalUnread(0);
    onMarkAllRead();
  };

  return (
    <div className="campaign-group">
      <div className="campaign-group__header" onClick={() => setOpen((o) => !o)}>
        <div className="campaign-group__left">
          <Megaphone size={16} />
          <span className="campaign-group__name">{group.campaign_name}</span>
          {localUnread > 0 && <span className="campaign-group__unread">{localUnread}</span>}
        </div>
        <div className="campaign-group__right">
          <span className="campaign-group__count">{group.messages.length} הודעות</span>
          {localUnread > 0 && (
            <button className="btn btn--ghost btn--xs" onClick={(e) => { e.stopPropagation(); handleMarkAllRead(); }}>
              <Check size={12} /> סמן הכל כנקרא
            </button>
          )}
          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </div>
      {open && (
        <div className="campaign-group__messages">
          {group.messages.map((msg) => (
            <MessageRow
              key={msg.id}
              msg={msg}
              onMarkRead={() => { setLocalUnread((n) => Math.max(0, n - 1)); onRefresh(); }}
              onReplySent={onRefresh}
              apiFetch={apiFetch}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Inbox({ onUnreadChange }) {
  const { session, businessId, loading } = useAuth();
  const apiFetch = useApiFetch();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!session?.access_token || !businessId) return;
    if (!silent) setLoading(true); else setRefreshing(true);
    try {
      const res = await apiFetch("/api/sms/inbox?limit=100");
      setData(res);
      onUnreadChange?.(res.unread_total || 0);
    } finally { setLoading(false); setRefreshing(false); }
  }, [apiFetch, session?.access_token, businessId, onUnreadChange]);

  useEffect(() => {
    load();
    const interval = setInterval(() => load(true), 30000);
    return () => clearInterval(interval);
  }, [load]);

  const filteredCampaigns = (data?.campaigns || [])
    .map((group) => {
      let msgs = group.messages;
      if (filter === "unread") msgs = msgs.filter((m) => !m.is_read);
      if (filter === "replied") msgs = msgs.filter((m) => m.replied_at);
      return { ...group, messages: msgs };
    })
    .filter((g) => g.messages.length > 0);

  const totalMessages = (data?.campaigns || []).reduce((sum, g) => sum + g.messages.length, 0);

  if (loading) {
    return (
      <div style={{ padding: 48, display: "flex", justifyContent: "center", alignItems: "center" }}>
        <div style={{ width: 32, height: 32, border: "2px solid var(--v2-primary)", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      </div>
    );
  }
  if (!session || !businessId) {
    return (
      <div style={{ padding: 24, color: "var(--v2-gray-400)", textAlign: "center" }}>
        נדרשת התחברות לצפייה באינבוקס
      </div>
    );
  }

  return (
    <>
      <style>{`
        .inbox-page { max-width: 780px; margin: 0 auto; padding: 24px 16px 80px; direction: rtl; }
        .inbox-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; gap: 12px; flex-wrap: wrap; }
        .inbox-header__title { display: flex; align-items: center; gap: 10px; font-size: 22px; font-weight: 700; color: #0f172a; }
        .inbox-header__badge { background: #2563eb; color: #fff; font-size: 12px; font-weight: 700; padding: 2px 8px; border-radius: 99px; }
        .inbox-header__meta { font-size: 13px; color: #64748b; margin-top: 4px; }
        .inbox-header__actions { display: flex; gap: 8px; }
        .inbox-filters { display: flex; gap: 6px; margin-bottom: 20px; background: #f1f5f9; border-radius: 10px; padding: 4px; width: fit-content; }
        .inbox-filters__btn { padding: 6px 16px; border-radius: 7px; border: none; background: transparent; font-size: 13px; font-weight: 500; color: #64748b; cursor: pointer; }
        .inbox-filters__btn--active { background: #fff; color: #2563eb; box-shadow: 0 1px 4px rgba(0,0,0,0.1); font-weight: 600; }
        .campaign-group { background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; margin-bottom: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
        .campaign-group__header { display: flex; align-items: center; justify-content: space-between; padding: 14px 18px; cursor: pointer; background: #f8fafc; border-bottom: 1px solid #e2e8f0; }
        .campaign-group__header:hover { background: #f1f5f9; }
        .campaign-group__left { display: flex; align-items: center; gap: 10px; }
        .campaign-group__name { font-size: 14px; font-weight: 600; color: #0f172a; }
        .campaign-group__unread { background: #2563eb; color: #fff; font-size: 11px; font-weight: 700; padding: 1px 7px; border-radius: 99px; }
        .campaign-group__right { display: flex; align-items: center; gap: 10px; }
        .campaign-group__count { font-size: 12px; color: #94a3b8; }
        .msg-row { display: flex; gap: 12px; padding: 14px 18px; border-bottom: 1px solid #f1f5f9; transition: background 0.12s; }
        .msg-row:last-child { border-bottom: none; }
        .msg-row--unread { background: #eff6ff; cursor: pointer; }
        .msg-row--unread:hover { background: #dbeafe; }
        .msg-row__avatar { width: 36px; height: 36px; border-radius: 50%; background: #e2e8f0; display: flex; align-items: center; justify-content: center; color: #64748b; flex-shrink: 0; }
        .msg-row--unread .msg-row__avatar { background: #bfdbfe; color: #2563eb; }
        .msg-row__body { flex: 1; min-width: 0; }
        .msg-row__top { display: flex; align-items: center; gap: 8px; margin-bottom: 5px; flex-wrap: wrap; }
        .msg-row__name { font-size: 13px; font-weight: 600; color: #0f172a; }
        .msg-row__phone { display: flex; align-items: center; gap: 3px; font-size: 11px; color: #94a3b8; }
        .msg-row__time { display: flex; align-items: center; gap: 3px; font-size: 11px; color: #94a3b8; margin-right: auto; }
        .msg-row__badge-dot { width: 8px; height: 8px; border-radius: 50%; background: #2563eb; }
        .msg-row__text { font-size: 14px; color: #334155; line-height: 1.5; margin: 0 0 8px; word-break: break-word; }
        .msg-row__actions { display: flex; gap: 8px; margin-top: 4px; }
        .msg-row__replied { display: flex; align-items: center; gap: 6px; font-size: 12px; color: #10b981; margin-top: 4px; background: #ecfdf5; border-radius: 6px; padding: 4px 8px; width: fit-content; }
        .msg-row__replied-time { color: #6ee7b7; font-size: 11px; }
        .reply-box { margin-top: 10px; border: 1.5px solid #2563eb; border-radius: 10px; background: #fff; overflow: hidden; }
        .reply-box__header { display: flex; align-items: center; gap: 6px; padding: 8px 12px; background: #eff6ff; font-size: 12px; color: #2563eb; font-weight: 600; border-bottom: 1px solid #bfdbfe; }
        .reply-box__textarea { width: 100%; border: none; outline: none; padding: 10px 12px; font-size: 14px; font-family: inherit; color: #0f172a; resize: none; direction: rtl; box-sizing: border-box; }
        .reply-box__footer { display: flex; align-items: center; padding: 8px 12px; gap: 10px; border-top: 1px solid #e2e8f0; background: #f8fafc; }
        .reply-box__counter { font-size: 11px; color: #94a3b8; }
        .reply-box__error { font-size: 12px; color: #ef4444; }
        .reply-box__actions { display: flex; gap: 8px; margin-right: auto; }
        .btn { display: inline-flex; align-items: center; gap: 5px; border: none; cursor: pointer; font-family: inherit; font-weight: 500; transition: all 0.15s; border-radius: 8px; }
        .btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .btn--primary { background: #2563eb; color: #fff; padding: 8px 16px; font-size: 13px; }
        .btn--primary:hover:not(:disabled) { background: #1d4ed8; }
        .btn--ghost { background: transparent; color: #64748b; padding: 6px 12px; font-size: 13px; border: 1px solid #e2e8f0; }
        .btn--ghost:hover { background: #f1f5f9; }
        .btn--reply { background: #eff6ff; color: #2563eb; padding: 5px 12px; font-size: 12px; border: 1px solid #bfdbfe; border-radius: 6px; }
        .btn--reply:hover { background: #dbeafe; }
        .btn--sm { padding: 6px 12px; font-size: 12px; }
        .btn--xs { padding: 3px 8px; font-size: 11px; border-radius: 5px; }
        .inbox-empty { text-align: center; padding: 64px 20px; color: #94a3b8; }
        .inbox-empty__icon { margin: 0 auto 16px; width: 80px; height: 80px; border-radius: 50%; background: #f1f5f9; display: flex; align-items: center; justify-content: center; }
        .inbox-empty h3 { font-size: 18px; color: #334155; margin: 0 0 8px; font-weight: 600; }
        .inbox-empty p { font-size: 14px; margin: 0; }
        .inbox-loading { display: flex; flex-direction: column; gap: 12px; }
        .skeleton { background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%); background-size: 200% 100%; animation: shimmer 1.4s infinite; border-radius: 10px; height: 90px; }
        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
        .spin { animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 600px) {
          .inbox-header { flex-direction: column; align-items: flex-start; }
          .inbox-filters { width: 100%; }
          .inbox-filters__btn { flex: 1; text-align: center; }
        }
      `}</style>

      <div className="inbox-page">
        <div className="inbox-header">
          <div>
            <div className="inbox-header__title">
              <MessageSquare size={22} />
              <span>תיבת הודעות נכנסות</span>
              {data?.unread_total > 0 && <span className="inbox-header__badge">{data.unread_total}</span>}
            </div>
            {!loading && (
              <div className="inbox-header__meta">{totalMessages} הודעות • {data?.campaigns?.length || 0} קמפיינים</div>
            )}
          </div>
          <div className="inbox-header__actions">
            <button className="btn btn--ghost btn--sm" onClick={() => load(true)} disabled={refreshing}>
              <RefreshCw size={14} className={refreshing ? "spin" : ""} />רענן
            </button>
          </div>
        </div>

        <div className="inbox-filters">
          {[{ key: "all", label: "הכל" }, { key: "unread", label: "לא נקרא" }, { key: "replied", label: "נענה" }].map((f) => (
            <button key={f.key} className={`inbox-filters__btn ${filter === f.key ? "inbox-filters__btn--active" : ""}`} onClick={() => setFilter(f.key)}>
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="inbox-loading">
            <div className="skeleton" />
            <div className="skeleton" style={{ height: 70 }} />
            <div className="skeleton" style={{ height: 110 }} />
          </div>
        ) : filteredCampaigns.length === 0 ? (
          <EmptyInbox />
        ) : (
          filteredCampaigns.map((group) => (
            <CampaignGroup
              key={group.campaign_id || "no_campaign"}
              group={group}
              onMarkAllRead={() => load(true)}
              onRefresh={() => load(true)}
              apiFetch={apiFetch}
            />
          ))
        )}
      </div>
    </>
  );
}
