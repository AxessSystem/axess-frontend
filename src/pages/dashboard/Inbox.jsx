import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  MessageSquare, Send, RefreshCw, Search, Plus, X, ChevronLeft, Settings,
  InboxIcon,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import toast from "react-hot-toast";

const API_BASE = import.meta.env.VITE_API_URL || "https://axess-production.up.railway.app";

function formatTimestamp(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleString("he-IL", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function formatRelative(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const diff = Date.now() - d;
  if (diff < 60000) return "עכשיו";
  if (diff < 3600000) return `לפני ${Math.floor(diff / 60000)} דק'`;
  if (diff < 86400000) return d.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" });
  if (diff < 172800000) return "אתמול";
  return d.toLocaleDateString("he-IL", { day: "2-digit", month: "2-digit" });
}

const CHANNEL_ICON = { sms: "💬", whatsapp: "🟢" };
const STATUS_LABELS = {
  unassigned: { label: "לא מוקצה", color: "#EF4444" },
  queued: { label: "בתור", color: "#F59E0B" },
  assigned: { label: "מוקצה", color: "#3B82F6" },
  resolved: { label: "נפתר", color: "#94a3b8" },
  bot: { label: "בוט", color: "#8B5CF6" },
};

function ChatSendPanel({
  convId, customerPhone, channel, smsConvoId, waConvoId, waConnected, waSession, templates,
  onSent, apiFetch,
}) {
  const [sendChannel, setSendChannel] = useState(channel || "sms");
  const [message, setMessage] = useState("");
  const [templateName, setTemplateName] = useState("");
  const [templateVars, setTemplateVars] = useState({});
  const [sending, setSending] = useState(false);

  const targetConvId = sendChannel === "sms" ? smsConvoId : waConvoId || convId;
  const approvedTemplates = (templates || []).filter((t) => t.meta_status === "APPROVED");

  const handleSend = async () => {
    const useTemplate = sendChannel === "whatsapp" && !waSession && templateName;
    if (sendChannel === "sms" && !message.trim()) return toast.error("הכנס הודעה");
    if (sendChannel === "whatsapp" && !waSession && !templateName) return toast.error("בחר תבנית או חכה לחלון 24 שעות");
    if (sendChannel === "whatsapp" && waSession && !message.trim()) return toast.error("הכנס הודעה");
    setSending(true);
    try {
      const body = {
        channel: sendChannel,
        target_conversation_id: targetConvId,
      };
      if (sendChannel === "sms") body.message = message.trim();
      else {
        if (waSession) body.message = message.trim();
        else {
          body.template_name = templateName;
          body.template_variables = Object.keys(templateVars)
            .sort()
            .map((k) => templateVars[k]);
        }
      }
      const r = await fetch(`${API_BASE}/api/inbox/conversations/${convId}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiFetch.token}`, "X-Business-Id": apiFetch.businessId },
        body: JSON.stringify(body),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || "שגיאה");
      setMessage("");
      setTemplateVars({});
      onSent?.();
      toast.success("נשלח");
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSending(false);
    }
  };

  const canSend =
    (sendChannel === "sms" && message.trim()) ||
    (sendChannel === "whatsapp" && (waSession ? message.trim() : templateName));

  return (
    <div className="inbox-send-panel">
      {waConnected && (
        <div className="inbox-send-tabs">
          <button className={sendChannel === "sms" ? "active" : ""} onClick={() => setSendChannel("sms")}>
            💬 SMS
          </button>
          <button className={sendChannel === "whatsapp" ? "active" : ""} onClick={() => setSendChannel("whatsapp")}>
            🟢 WhatsApp
          </button>
        </div>
      )}
      {sendChannel === "whatsapp" && !waSession && approvedTemplates.length > 0 && (
        <div className="inbox-send-field">
          <label>תבנית</label>
          <select value={templateName} onChange={(e) => setTemplateName(e.target.value)}>
            <option value="">בחר תבנית...</option>
            {approvedTemplates.map((t) => (
              <option key={t.id} value={t.template_name}>
                {t.template_name}
              </option>
            ))}
          </select>
        </div>
      )}
      {sendChannel === "whatsapp" && !waSession && templateName && (
        <div className="inbox-send-vars">
          {[1, 2, 3].map((i) => (
            <input
              key={i}
              placeholder={`משתנה {{${i}}}`}
              value={templateVars[i] || ""}
              onChange={(e) => setTemplateVars((v) => ({ ...v, [i]: e.target.value }))}
            />
          ))}
        </div>
      )}
      {(sendChannel === "sms" || (sendChannel === "whatsapp" && (waSession || !templateName))) && (
        <textarea
          placeholder="כתוב הודעה..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          maxLength={612}
          dir="rtl"
        />
      )}
      {sendChannel === "sms" && message.length > 0 && (
        <div className="inbox-char-count">
          {message.length <= 160 ? 160 - message.length : 153 - ((message.length - 160) % 153)} תווים •{" "}
          {message.length <= 160 ? 1 : Math.ceil(message.length / 153)} SMS
        </div>
      )}
      <button className="btn btn--primary" onClick={handleSend} disabled={!canSend || sending}>
        {sending ? <RefreshCw size={16} className="spin" /> : <Send size={16} />} שלח
      </button>
    </div>
  );
}

function SupervisorPanel({ conv, staff, onAssign, onChangeDept, onResolve, onClose }) {
  const [agentId, setAgentId] = useState(conv?.assigned_to || "");
  const [department, setDepartment] = useState(conv?.department || "");
  const [assigning, setAssigning] = useState(false);
  const [savingDept, setSavingDept] = useState(false);
  const [resolving, setResolving] = useState(false);

  const handleAssign = async () => {
    setAssigning(true);
    try {
      await onAssign?.(agentId || null, department || null);
      toast.success("עודכן");
    } catch {
      toast.error("שגיאה");
    } finally {
      setAssigning(false);
    }
  };

  const handleChangeDept = async () => {
    setSavingDept(true);
    try {
      await onAssign?.(conv?.assigned_to || null, department || null);
      toast.success("מחלקה עודכנה");
    } catch {
      toast.error("שגיאה");
    } finally {
      setSavingDept(false);
    }
  };

  const handleResolve = async () => {
    setResolving(true);
    try {
      await onResolve?.();
      toast.success("השיחה נסגרה");
      onClose?.();
    } catch {
      toast.error("שגיאה");
    } finally {
      setResolving(false);
    }
  };

  return (
    <div className="supervisor-panel">
      <h4>ניהול שיחה</h4>
      <div className="supervisor-customer">
        <div>טלפון: <span dir="ltr">{conv?.customer_phone}</span></div>
      </div>
      <div className="supervisor-field">
        <label>הקצה לנציג</label>
        <select value={agentId} onChange={(e) => setAgentId(e.target.value)}>
          <option value="">—</option>
          {(staff || []).map((s) => (
            <option key={s.id} value={s.id}>#{s.role}</option>
          ))}
        </select>
        <button onClick={handleAssign} disabled={assigning}>שמור</button>
      </div>
      <div className="supervisor-field">
        <label>מחלקה</label>
        <input value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="למשל: מכירות" />
        <button onClick={handleChangeDept} disabled={savingDept}>עדכן</button>
      </div>
      <button className="supervisor-resolve" onClick={handleResolve} disabled={resolving}>
        סגור שיחה
      </button>
    </div>
  );
}

export default function Inbox({ onUnreadChange }) {
  const { session, businessId, role } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [agentFilter, setAgentFilter] = useState("");
  const [selectedConv, setSelectedConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [waStatus, setWaStatus] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [staff, setStaff] = useState([]);
  const [showSupervisor, setShowSupervisor] = useState(false);
  const [showNewMessage, setShowNewMessage] = useState(false);
  const [preselectedPhone, setPreselectedPhone] = useState(null);
  const pendingOpenRef = useRef(null);

  const isSupervisor = role === "owner" || role === "manager";

  useEffect(() => {
    const state = location.state || {};
    if (state.openConversation && !pendingOpenRef.current) {
      pendingOpenRef.current = { phone: state.openConversation, name: state.openConversationName || "" };
    }
  }, [location.state]);

  const authHeaders = useCallback(() => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${session?.access_token}`,
    "X-Business-Id": businessId,
  }), [session?.access_token, businessId]);

  const apiFetch = useCallback(
    async (path, opts = {}) => {
      const r = await fetch(`${API_BASE}${path}`, {
        ...opts,
        headers: { ...authHeaders(), ...(opts.headers || {}) },
      });
      const data = await r.json().catch(() => ({}));
      return { ...data, ok: r.ok };
    },
    [authHeaders]
  );

  const loadConversations = useCallback(
    async (silent = false) => {
      if (!session?.access_token || !businessId) return;
      if (!silent) setLoading(true);
      try {
        const params = new URLSearchParams();
        if (tab === "sms") params.set("channel", "sms");
        else if (tab === "whatsapp") params.set("channel", "whatsapp");
        else if (tab === "unassigned") params.set("status", "unassigned");
        if (search) params.set("search", search);
        if (agentFilter && isSupervisor) params.set("assigned_to", agentFilter);
        const res = await apiFetch(`/api/inbox/conversations?${params}`);
        setConversations(res.conversations || []);
        const unread = (res.conversations || []).reduce((s, c) => s + (c.unread_count || 0), 0);
        onUnreadChange?.(unread);
      } finally {
        setLoading(false);
      }
    },
    [session?.access_token, businessId, tab, search, agentFilter, isSupervisor, apiFetch, onUnreadChange]
  );

  useEffect(() => {
    loadConversations();
    const t = setInterval(() => loadConversations(true), 20000);
    return () => clearInterval(t);
  }, [loadConversations]);

  useEffect(() => {
    if (session?.access_token && businessId) {
      fetch(`${API_BASE}/api/whatsapp/status`, { headers: authHeaders() })
        .then((r) => (r.ok ? r.json() : {}))
        .then(setWaStatus)
        .catch(() => setWaStatus(null));
      apiFetch("/api/whatsapp/templates").then((d) => setTemplates(d.templates || []));
      if (isSupervisor) {
        fetch(`${API_BASE}/api/staff?business_id=${businessId}`, { headers: authHeaders() })
          .then((r) => (r.ok ? r.json() : []))
          .then((data) => setStaff(Array.isArray(data) ? data : []))
          .catch(() => setStaff([]));
      }
    }
  }, [session?.access_token, businessId, isSupervisor, authHeaders]);

  useEffect(() => {
    const pending = pendingOpenRef.current;
    if (!pending || loading) return;
    const phone = pending.phone?.replace(/\D/g, "") || "";
    const conv = conversations.find(
      (c) =>
        c.customer_phone === pending.phone ||
        c.customer_phone?.replace(/\D/g, "").endsWith(phone) ||
        (phone && c.customer_phone?.replace(/\D/g, "").includes(phone))
    );
    if (conv) {
      setSelectedConv(conv);
      setPreselectedPhone(null);
    } else {
      setShowNewMessage(true);
      setPreselectedPhone({ phone: pending.phone, name: pending.name || "" });
    }
    pendingOpenRef.current = null;
    navigate(location.pathname, { replace: true, state: {} });
  }, [conversations, loading, navigate, location.pathname]);

  useEffect(() => {
    if (!selectedConv) {
      setMessages([]);
      return;
    }
    setMessagesLoading(true);
    apiFetch(`/api/inbox/customer-messages?customer_phone=${encodeURIComponent(selectedConv.customer_phone)}`)
      .then((d) => setMessages(d.messages || []))
      .catch(() => setMessages([]))
      .finally(() => setMessagesLoading(false));

    apiFetch(`/api/inbox/conversations/${selectedConv.id}/read`, { method: "PATCH" }).catch(() => {});
    loadConversations(true);
  }, [selectedConv?.id, selectedConv?.customer_phone]);

  const handleAssign = async (convId, agentId, department) => {
    const r = await fetch(`${API_BASE}/api/inbox/conversations/${convId}/assign`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ agent_id: agentId || undefined, department: department || undefined }),
    });
    if (!r.ok) throw new Error("שגיאה בהקצאה");
    loadConversations(true);
  };

  const handleResolve = async (convId) => {
    const r = await fetch(`${API_BASE}/api/inbox/conversations/${convId}/resolve`, {
      method: "POST",
      headers: authHeaders(),
    });
    if (!r.ok) throw new Error();
    setSelectedConv(null);
    loadConversations(true);
  };

  const smsConv = selectedConv && selectedConv.channel === "sms"
    ? selectedConv
    : conversations.find(
        (c) => c.customer_phone === selectedConv?.customer_phone && c.channel === "sms"
      );
  const waConv = selectedConv && selectedConv.channel === "whatsapp"
    ? selectedConv
    : conversations.find(
        (c) => c.customer_phone === selectedConv?.customer_phone && c.channel === "whatsapp"
      );

  if (!session?.access_token) {
    return (
      <div style={{ padding: 24, color: "var(--v2-gray-400)", textAlign: "center" }}>
        נדרשת התחברות
      </div>
    );
  }

  return (
    <>
      <style>{`
        .inbox-unified { display: flex; height: calc(100vh - 140px); min-height: 400px; direction: rtl; background: var(--v2-dark-2); border-radius: var(--radius-lg); border: 1px solid var(--glass-border); overflow: hidden; }
        .inbox-list { width: 320px; min-width: 280px; border-left: 1px solid var(--glass-border); display: flex; flex-direction: column; background: var(--v2-dark-3); }
        .inbox-list-header { padding: 12px 16px; border-bottom: 1px solid var(--glass-border); }
        .inbox-list-tabs { display: flex; gap: 4px; margin-bottom: 10px; }
        .inbox-list-tabs button { padding: 6px 12px; border-radius: 8px; border: none; background: rgba(255,255,255,0.06); color: var(--v2-gray-400); font-size: 12px; cursor: pointer; }
        .inbox-list-tabs button.active { background: var(--v2-primary); color: var(--v2-dark); }
        .inbox-search { display: flex; align-items: center; gap: 8px; background: var(--v2-dark-2); border: 1px solid var(--glass-border); border-radius: 8px; padding: 8px 12px; }
        .inbox-search input { flex: 1; background: none; border: none; color: #fff; font-size: 13px; outline: none; }
        .inbox-conv-list { flex: 1; overflow-y: auto; }
        .inbox-conv-item { padding: 12px 16px; border-bottom: 1px solid var(--glass-border); cursor: pointer; transition: background 0.15s; display: flex; flex-direction: column; gap: 6px; }
        .inbox-conv-item:hover { background: rgba(255,255,255,0.04); }
        .inbox-conv-item.selected { background: rgba(0,195,122,0.1); border-right: 3px solid var(--v2-primary); }
        .inbox-conv-row { display: flex; align-items: center; gap: 8px; }
        .inbox-conv-icon { font-size: 16px; }
        .inbox-conv-name { font-weight: 600; color: #fff; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .inbox-conv-time { font-size: 11px; color: var(--v2-gray-500); }
        .inbox-conv-preview { font-size: 12px; color: var(--v2-gray-400); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 100%; }
        .inbox-conv-badges { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
        .inbox-badge { font-size: 10px; padding: 2px 8px; border-radius: 99px; }
        .inbox-chat { flex: 1; display: flex; flex-direction: row; min-width: 0; background: var(--v2-dark-2); }
        .inbox-chat-main { flex: 1; display: flex; flex-direction: column; min-width: 0; }
        .inbox-chat-header { padding: 16px; border-bottom: 1px solid var(--glass-border); display: flex; justify-content: space-between; align-items: center; }
        .inbox-chat-back { display: none; }
        .inbox-chat-body { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 12px; }
        .inbox-chat-empty { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; color: var(--v2-gray-500); }
        .inbox-bubble { max-width: 80%; padding: 10px 14px; border-radius: 12px; font-size: 14px; line-height: 1.5; }
        .inbox-bubble--out { align-self: flex-end; background: var(--v2-primary); color: var(--v2-dark); }
        .inbox-bubble--in { align-self: flex-start; background: var(--v2-dark-3); border: 1px solid var(--glass-border); }
        .inbox-bubble-meta { display: flex; align-items: center; gap: 8px; margin-top: 6px; font-size: 11px; opacity: 0.8; }
        .inbox-send-panel { padding: 16px; border-top: 1px solid var(--glass-border); display: flex; flex-direction: column; gap: 10px; }
        .inbox-send-tabs { display: flex; gap: 8px; }
        .inbox-send-tabs button { padding: 6px 14px; border-radius: 8px; border: 1px solid var(--glass-border); background: transparent; color: var(--v2-gray-400); font-size: 13px; cursor: pointer; }
        .inbox-send-tabs button.active { background: var(--v2-primary); color: var(--v2-dark); border-color: var(--v2-primary); }
        .inbox-send-panel textarea { width: 100%; background: var(--v2-dark-3); border: 1px solid var(--glass-border); border-radius: 8px; padding: 12px; color: #fff; resize: none; font-size: 14px; }
        .inbox-send-panel select, .inbox-send-panel input { background: var(--v2-dark-3); border: 1px solid var(--glass-border); border-radius: 8px; padding: 10px; color: #fff; }
        .inbox-char-count { font-size: 11px; color: var(--v2-gray-500); }
        .supervisor-panel { width: 260px; padding: 16px; border-right: 1px solid var(--glass-border); background: var(--v2-dark-3); display: flex; flex-direction: column; gap: 12px; }
        .supervisor-panel h4 { margin: 0 0 8px; font-size: 14px; }
        .supervisor-customer { font-size: 13px; color: var(--v2-gray-400); }
        .supervisor-field { display: flex; flex-direction: column; gap: 6px; }
        .supervisor-field label { font-size: 11px; color: var(--v2-gray-500); }
        .supervisor-resolve { padding: 10px; background: #EF4444; color: #fff; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; }
        .inbox-overlay { position: fixed; inset: 0; z-index: 100; background: rgba(0,0,0,0.6); display: flex; justify-content: flex-end; }
        .inbox-new-msg-panel { width: min(420px, 100vw); background: var(--v2-dark-2); border-right: 1px solid var(--glass-border); }
        .btn { display: inline-flex; align-items: center; gap: 6px; border: none; cursor: pointer; font-weight: 500; border-radius: 8px; padding: 10px 16px; font-size: 13px; }
        .btn--primary { background: var(--v2-primary); color: var(--v2-dark); }
        .btn--ghost { background: rgba(255,255,255,0.06); color: var(--v2-gray-400); }
        .spin { animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 768px) {
          .inbox-unified { flex-direction: column; height: auto; min-height: 100vh; }
          .inbox-list { width: 100%; max-height: 40vh; }
          .inbox-chat { display: ${selectedConv ? "flex" : "none"}; }
          .inbox-chat-back { display: flex; }
        }
      `}</style>

      <div className="inbox-unified">
        <div className="inbox-list">
          <div className="inbox-list-header">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <h2 style={{ margin: 0, fontSize: 18 }}>אינבוקס מאוחד</h2>
              <button className="btn btn--primary btn--sm" onClick={() => { setShowNewMessage(true); setPreselectedPhone(preselectedPhone || null); }}>
                <Plus size={14} /> חדש
              </button>
            </div>
            <div className="inbox-list-tabs">
              {[
                { key: "all", label: "הכל" },
                { key: "sms", label: "💬 SMS" },
                { key: "whatsapp", label: "🟢 WA" },
                { key: "unassigned", label: "לא מוקצה" },
              ].map((t) => (
                <button key={t.key} className={tab === t.key ? "active" : ""} onClick={() => setTab(t.key)}>
                  {t.label}
                </button>
              ))}
            </div>
            {isSupervisor && staff.length > 0 && (
              <select
                value={agentFilter}
                onChange={(e) => setAgentFilter(e.target.value)}
                style={{ marginBottom: 8, padding: "6px 10px", borderRadius: 8, background: "var(--v2-dark-2)", border: "1px solid var(--glass-border)", color: "#fff", fontSize: 12 }}
              >
                <option value="">כל הנציגים</option>
                {staff.map((s) => (
                  <option key={s.id} value={s.id}>#{s.role}</option>
                ))}
              </select>
            )}
            <div className="inbox-search">
              <Search size={16} style={{ color: "var(--v2-gray-500)" }} />
              <input
                placeholder="חיפוש טלפון או הודעה..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                dir="rtl"
              />
            </div>
          </div>
          <div className="inbox-conv-list">
            {loading ? (
              <div style={{ padding: 24, textAlign: "center", color: "var(--v2-gray-500)" }}>טוען...</div>
            ) : conversations.length === 0 ? (
              <div style={{ padding: 24, textAlign: "center", color: "var(--v2-gray-500)" }}>
                <InboxIcon size={40} style={{ opacity: 0.5, marginBottom: 8 }} />
                <div>אין שיחות</div>
              </div>
            ) : (
              conversations.map((c) => (
                <div
                  key={c.id}
                  className={`inbox-conv-item ${selectedConv?.id === c.id ? "selected" : ""}`}
                  onClick={() => setSelectedConv(c)}
                >
                  <div className="inbox-conv-row">
                    <span className="inbox-conv-icon">{CHANNEL_ICON[c.channel] || "💬"}</span>
                    <span className="inbox-conv-name">{c.customer_phone}</span>
                    <span className="inbox-conv-time">{formatRelative(c.last_message_at)}</span>
                  </div>
                  <div className="inbox-conv-preview">
                    {(c.last_message || "—").slice(0, 50)}
                    {(c.last_message || "").length > 50 ? "…" : ""}
                  </div>
                  <div className="inbox-conv-badges">
                    {(c.unread_count || 0) > 0 && (
                      <span className="inbox-badge" style={{ background: "var(--v2-primary)", color: "var(--v2-dark)" }}>
                        {c.unread_count}
                      </span>
                    )}
                    {STATUS_LABELS[c.status] && (
                      <span className="inbox-badge" style={{ background: STATUS_LABELS[c.status].color + "33", color: STATUS_LABELS[c.status].color }}>
                        {STATUS_LABELS[c.status].label}
                      </span>
                    )}
                    {c.assigned_to_name && (
                      <span className="inbox-badge" style={{ background: "rgba(59,130,246,0.2)", color: "#3B82F6" }}>
                        {c.assigned_to_name}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="inbox-chat">
          {selectedConv ? (
            <>
              <div className="inbox-chat-main">
                <div className="inbox-chat-header">
                  <button className="inbox-chat-back btn btn--ghost" onClick={() => setSelectedConv(null)}>
                    <ChevronLeft size={18} /> חזור
                  </button>
                  <div>
                    <span>{CHANNEL_ICON[selectedConv.channel]} </span>
                    <span dir="ltr">{selectedConv.customer_phone}</span>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    {isSupervisor && (
                      <button className={`btn btn--ghost ${showSupervisor ? "active" : ""}`} onClick={() => setShowSupervisor(!showSupervisor)} title="ניהול שיחה">
                        <Settings size={18} />
                      </button>
                    )}
                  </div>
                </div>
                <div className="inbox-chat-body">
                {messagesLoading ? (
                  <div style={{ textAlign: "center", color: "var(--v2-gray-500)" }}>טוען...</div>
                ) : messages.length === 0 ? (
                  <div className="inbox-chat-empty">אין הודעות עדיין</div>
                ) : (
                  messages.map((m) => (
                    <div key={m.id} className={`inbox-bubble inbox-bubble--${m.direction}`}>
                      <div>{m.message || m.action || "—"}</div>
                      <div className="inbox-bubble-meta">
                        <span>{CHANNEL_ICON[m.channel] || "💬"}</span>
                        <span>{formatTimestamp(m.created_at)}</span>
                        {m.direction === "out" && m.metadata?.wa_status && (
                          <span>
                            {m.metadata.wa_status === "read" ? "נקרא" : m.metadata.wa_status === "delivered" ? "הגיע" : "נשלח"}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
                </div>
                <ChatSendPanel
                convId={selectedConv.id}
                customerPhone={selectedConv.customer_phone}
                channel={selectedConv.channel}
                smsConvoId={smsConv?.id}
                waConvoId={waConv?.id}
                waConnected={!!waStatus?.connected}
                waSession={(waStatus?.active_sessions_count || 0) > 0}
                templates={templates}
                onSent={() => {
                  loadConversations(true);
                  apiFetch(`/api/inbox/customer-messages?customer_phone=${encodeURIComponent(selectedConv.customer_phone)}`).then((d) => setMessages(d.messages || []));
                }}
                apiFetch={{ token: session?.access_token, businessId }}
              />
              </div>
              {showSupervisor && isSupervisor && (
                <SupervisorPanel
                  conv={selectedConv}
                  staff={staff}
                  onAssign={(aid, dep) => handleAssign(selectedConv.id, aid, dep)}
                  onResolve={() => handleResolve(selectedConv.id)}
                  onClose={() => setShowSupervisor(false)}
                />
              )}
            </>
          ) : (
            <div className="inbox-chat-empty">
              <MessageSquare size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
              <div>בחר שיחה מהרשימה</div>
            </div>
          )}
        </div>
      </div>

      {showNewMessage && (
        <div className="inbox-overlay" onClick={() => setShowNewMessage(false)}>
          <div className="inbox-new-msg-panel" onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: 16, borderBottom: "1px solid var(--glass-border)", display: "flex", justifyContent: "space-between" }}>
              <h3 style={{ margin: 0 }}>הודעה חדשה</h3>
              <button className="btn btn--ghost" onClick={() => setShowNewMessage(false)}><X size={20} /></button>
            </div>
            <div style={{ padding: 16 }}>
              <p style={{ color: "var(--v2-gray-400)", fontSize: 13 }}>לשליחת הודעה חדשה, עבור לקמפיין חדש או השתמש בשליחת SMS ישיר מדשבורד.</p>
              {preselectedPhone && (
                <p dir="ltr" style={{ marginTop: 8 }}>נמען: {preselectedPhone.phone}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
