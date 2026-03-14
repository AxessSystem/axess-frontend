import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare, Send, Check, CheckCheck,
  ChevronDown, ChevronUp, RefreshCw,
  Clock, Phone, User, Megaphone, InboxIcon, CornerDownRight,
  Plus, Search, Users, Tag, FileUp, X, Upload,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import toast from "react-hot-toast";

const API_BASE = import.meta.env.VITE_API_URL || "https://axess-production.up.railway.app";

function formatTimestamp(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = String(d.getFullYear()).slice(-2);
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${dd}/${mm}/${yy} ${hh}:${min}`;
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

function MessageRow({ msg, onMarkRead, onReplySent, apiFetch, onViewConversation }) {
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
            {onViewConversation && (
              <button className="btn btn--ghost btn--sm" onClick={(e) => { e.stopPropagation(); onViewConversation(localMsg.from_phone, localMsg.sender_name); }}>
                <MessageSquare size={13} /> צפה בשיחה
              </button>
            )}
          </div>
        )}
        {localMsg.replied_at && onViewConversation && (
          <button className="btn btn--ghost btn--sm" style={{ marginTop: 6 }} onClick={(e) => { e.stopPropagation(); onViewConversation(localMsg.from_phone, localMsg.sender_name); }}>
            <MessageSquare size={13} /> צפה בשיחה המלאה
          </button>
        )}

        {showReply && (
          <ReplyBox message={localMsg} onSend={handleReplySent} onCancel={() => setShowReply(false)} apiFetch={apiFetch} />
        )}
      </div>
    </div>
  );
}

// Conversation history panel — bubbles (out=right, in=left), timestamps
function ConversationHistoryPanel({ phone, senderName, onClose, apiFetch, onRefresh }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef();

  useEffect(() => {
    if (!phone) return;
    setLoading(true);
    apiFetch(`/api/admin/conversation-logs?phone=${encodeURIComponent(phone)}`)
      .then((res) => {
        if (res.logs) setLogs(res.logs);
        else setLogs([]);
      })
      .catch(() => setLogs([]))
      .finally(() => setLoading(false));
  }, [phone, apiFetch]);

  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: "smooth" }); }, [logs]);

  if (!phone) return null;

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      className="inbox-panel"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="inbox-panel__header">
        <div>
          <h3 className="inbox-panel__title">היסטוריית שיחה</h3>
          <div className="inbox-panel__sub">{senderName || "—"} • <span dir="ltr">{phone}</span></div>
        </div>
        <button className="btn-icon" onClick={onClose}><X size={20} /></button>
      </div>
      <div className="inbox-panel__body conv-history">
        {loading ? (
          <div className="conv-history__loading">טוען...</div>
        ) : logs.length === 0 ? (
          <div className="conv-history__empty">אין הודעות בשיחה זו</div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className={`conv-bubble conv-bubble--${log.direction}`}>
              <div className="conv-bubble__text">{log.message || log.action || "—"}</div>
              <div className="conv-bubble__time">{formatTimestamp(log.created_at)}</div>
            </div>
          ))
        )}
        <div ref={scrollRef} />
      </div>
    </motion.div>
  );
}

// New message panel — Tab 1: Direct SMS, Tab 2: Group SMS
function NewMessagePanel({ onClose, apiFetch, preselectedRecipient, businessId, session, onSent }) {
  const [mainTab, setMainTab] = useState("direct");
  const [groupSubTab, setGroupSubTab] = useState("manual");
  const [search, setSearch] = useState("");
  const [recipients, setRecipients] = useState([]);
  const [selectedDirect, setSelectedDirect] = useState(preselectedRecipient || null);
  const [groupRecipients, setGroupRecipients] = useState(new Set());
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [segments, setSegments] = useState([]);
  const [tags, setTags] = useState([]);
  const [segmentRecipients, setSegmentRecipients] = useState([]);
  const fileRef = useRef();

  useEffect(() => { if (preselectedRecipient) setSelectedDirect(preselectedRecipient); }, [preselectedRecipient]);

  const searchRecipients = useCallback(async () => {
    if (!search.trim()) return;
    const res = await apiFetch(`/api/admin/recipients?search=${encodeURIComponent(search.trim())}`);
    setRecipients(res.recipients || []);
  }, [search, apiFetch]);

  useEffect(() => {
    const t = setTimeout(() => { if (search.trim()) searchRecipients(); }, 300);
    return () => clearTimeout(t);
  }, [search, searchRecipients]);

  useEffect(() => {
    apiFetch("/api/admin/segments").then((r) => {
      const presets = r?.presets || [];
      const saved = r?.saved || [];
      setSegments([...presets, ...saved]);
    });
    apiFetch(`/api/admin/recipients?search=`).then((r) => {
      const all = r?.recipients || [];
      const tagSet = new Set();
      all.forEach((rec) => (rec.tags || []).forEach((t) => tagSet.add(t)));
      setTags([...tagSet].filter(Boolean));
    });
  }, [apiFetch]);

  const addGroupRecipient = (r) => setGroupRecipients((s) => new Set([...s, r.phone]));
  const removeGroupRecipient = (phone) => setGroupRecipients((s) => { const n = new Set(s); n.delete(phone); return n; });
  const allGroupPhones = [...groupRecipients];

  const handleSegmentRun = async (segId) => {
    const presetIds = ["vip", "loyal", "new", "at_risk", "birthday", "checkin", "live", "validator", "scanned"];
    let res;
    if (presetIds.includes(segId)) {
      res = await apiFetch("/api/admin/segments/historical", { method: "POST", body: JSON.stringify({ filter: segId, business_id: businessId }) });
    } else {
      res = await apiFetch(`/api/admin/segments/${segId}/run`, { method: "POST" });
    }
    const recs = res?.recipients || [];
    setGroupRecipients((s) => new Set([...s, ...recs.map((r) => r.phone).filter(Boolean)]));
    setSegmentRecipients(recs);
  };

  const handleTagSelect = async (tag) => {
    const res = await apiFetch("/api/admin/segments/historical", {
      method: "POST",
      body: JSON.stringify({ filter: "by_tag", tag, business_id: businessId }),
    });
    const recs = res?.recipients || [];
    setGroupRecipients((s) => new Set([...s, ...recs.map((r) => r.phone).filter(Boolean)]));
  };

  const handleFileExtract = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !businessId || !session?.access_token) return;
    const fd = new FormData();
    fd.append("file", file);
    fd.append("business_id", businessId);
    try {
      const r = await fetch(`${API_BASE}/api/admin/import/extract-phones`, {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}`, "X-Business-Id": businessId },
        body: fd,
      });
      const data = await r.json().catch(() => ({}));
      const phones = data?.phones || [];
      setGroupRecipients((s) => new Set([...s, ...phones]));
      toast.success(`${phones.length} נמענים נוספו מהקובץ`);
    } catch {
      toast.error("שגיאה בניתוח הקובץ");
    }
    e.target.value = "";
  };

  const smsCount = message.length === 0 ? 0 : message.length <= 160 ? 1 : Math.ceil(message.length / 153);
  const charLeft = message.length <= 160 ? 160 - message.length : 153 - ((message.length - 160) % 153);

  const handleSendDirect = async () => {
    if (!selectedDirect?.phone || !message.trim() || sending) return;
    setSending(true);
    try {
      const res = await apiFetch("/api/admin/messages/send", {
        method: "POST",
        body: JSON.stringify({ phone: selectedDirect.phone, message: message.trim(), business_id: businessId }),
      });
      if (res.success) {
        toast.success("נשלח בהצלחה");
        setMessage("");
        setSelectedDirect(null);
        onSent?.();
      } else toast.error(res.errors?.[0] || res.error || "שגיאה בשליחה");
    } catch (e) { toast.error(e.message || "שגיאה"); }
    finally { setSending(false); }
  };

  const handleSendGroup = async () => {
    const phones = [...groupRecipients];
    if (!phones.length || !message.trim() || sending) return;
    setSending(true);
    try {
      const res = await apiFetch("/api/admin/messages/send", {
        method: "POST",
        body: JSON.stringify({ phones, message: message.trim(), business_id: businessId }),
      });
      if (res.success) {
        toast.success(`נשלח ל־${res.totalSent || phones.length} נמענים`);
        setMessage("");
        setGroupRecipients(new Set());
        onSent?.();
      } else toast.error(res.errors?.[0] || res.error || "שגיאה בשליחה");
    } catch (e) { toast.error(e.message || "שגיאה"); }
    finally { setSending(false); }
  };

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      className="inbox-panel"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="inbox-panel__header">
        <h3 className="inbox-panel__title">הודעה חדשה</h3>
        <button className="btn-icon" onClick={onClose}><X size={20} /></button>
      </div>
      <div className="inbox-panel__tabs">
        {[
          { key: "direct", label: "SMS ישיר" },
          { key: "group", label: "SMS לקבוצה" },
        ].map((t) => (
          <button key={t.key} className={`inbox-panel__tab ${mainTab === t.key ? "inbox-panel__tab--active" : ""}`} onClick={() => setMainTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>
      <div className="inbox-panel__body">
        {mainTab === "direct" && (
          <>
            <div className="compose-field">
              <label>נמען</label>
              <div className="compose-search">
                <Search size={16} />
                <input placeholder="חיפוש לפי שם או טלפון..." value={search} onChange={(e) => setSearch(e.target.value)} dir="rtl" />
              </div>
              {recipients.length > 0 && (
                <div className="compose-results">
                  {recipients.slice(0, 8).map((r) => (
                    <button key={r.id} type="button" className={`compose-result-item ${selectedDirect?.phone === r.phone ? "selected" : ""}`} onClick={() => setSelectedDirect({ phone: r.phone, name: r.name })}>
                      {r.name || "—"} <span dir="ltr">{r.phone}</span>
                    </button>
                  ))}
                </div>
              )}
              {selectedDirect && (
                <div className="compose-selected">✓ {selectedDirect.name || "—"} <span dir="ltr">{selectedDirect.phone}</span></div>
              )}
            </div>
            <div className="compose-field">
              <label>הודעה</label>
              <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="כתוב הודעה..." rows={4} maxLength={612} dir="rtl" />
              <div className="compose-counter">{message.length > 0 && `${charLeft} תווים • ${smsCount} SMS`}</div>
            </div>
            <button className="btn btn--primary" onClick={handleSendDirect} disabled={!selectedDirect || !message.trim() || sending}>
              {sending ? <RefreshCw size={16} className="spin" /> : <Send size={16} />} שלח
            </button>
          </>
        )}
        {mainTab === "group" && (
          <>
            <div className="compose-subtabs">
              {["manual", "segment", "tag", "file"].map((k) => (
                <button key={k} className={`compose-subtab ${groupSubTab === k ? "active" : ""}`} onClick={() => setGroupSubTab(k)}>
                  {k === "manual" && "ידני"}
                  {k === "segment" && "סגמנט"}
                  {k === "tag" && "תגית"}
                  {k === "file" && "קובץ"}
                </button>
              ))}
            </div>
            {groupSubTab === "manual" && (
              <div className="compose-field">
                <div className="compose-search">
                  <Search size={16} />
                  <input placeholder="חיפוש נמען..." value={search} onChange={(e) => setSearch(e.target.value)} dir="rtl" />
                </div>
                {recipients.length > 0 && (
                  <div className="compose-results">
                    {recipients.slice(0, 8).map((r) => (
                      <button key={r.id} type="button" className="compose-result-item" onClick={() => addGroupRecipient(r)}>
                        + {r.name || "—"} <span dir="ltr">{r.phone}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            {groupSubTab === "segment" && (
              <div className="compose-field">
                <select onChange={(e) => e.target.value && handleSegmentRun(e.target.value)} defaultValue="">
                  <option value="">בחר סגמנט...</option>
                  {(segments || []).map((s) => (
                    <option key={s.id} value={s.id}>{s.name || s.id}</option>
                  ))}
                </select>
              </div>
            )}
            {groupSubTab === "tag" && (
              <div className="compose-field">
                <select onChange={(e) => e.target.value && handleTagSelect(e.target.value)} defaultValue="">
                  <option value="">בחר תגית...</option>
                  {tags.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            )}
            {groupSubTab === "file" && (
              <div className="compose-field">
                <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" style={{ display: "none" }} onChange={handleFileExtract} />
                <button type="button" className="btn btn--ghost" onClick={() => fileRef.current?.click()}>
                  <Upload size={16} /> העלה קובץ לקבלת רשימת נמענים
                </button>
              </div>
            )}
            {allGroupPhones.length > 0 && (
              <div className="compose-group-list">
                <strong>{allGroupPhones.length} נמענים</strong>
                <div className="compose-group-chips">
                  {allGroupPhones.slice(0, 10).map((p) => (
                    <span key={p} className="chip"><span dir="ltr">{p}</span> <button type="button" onClick={() => removeGroupRecipient(p)}>×</button></span>
                  ))}
                  {allGroupPhones.length > 10 && <span className="chip">+{allGroupPhones.length - 10} נוספים</span>}
                </div>
              </div>
            )}
            <div className="compose-field">
              <label>הודעה</label>
              <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="כתוב הודעה לכל הנמענים..." rows={4} maxLength={612} dir="rtl" />
              <div className="compose-counter">{message.length > 0 && `${charLeft} תווים • ${smsCount} SMS`}</div>
            </div>
            <button className="btn btn--primary" onClick={handleSendGroup} disabled={!allGroupPhones.length || !message.trim() || sending}>
              {sending ? <RefreshCw size={16} className="spin" /> : <Send size={16} />} שלח לקבוצה
            </button>
          </>
        )}
      </div>
    </motion.div>
  );
}

function CampaignGroup({ group, onMarkAllRead, onRefresh, apiFetch, initialOpen, onViewConversation }) {
  const [open, setOpen] = useState(initialOpen !== false);
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
              onViewConversation={onViewConversation}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Inbox({ onUnreadChange }) {
  const { session, businessId } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const openConversationPhone = location.state?.openConversation;
  const [data, setData] = useState(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [refreshing, setRefreshing] = useState(false);
  const [panel, setPanel] = useState(null);
  const [historyPhone, setHistoryPhone] = useState(null);
  const [historySenderName, setHistorySenderName] = useState(null);
  const [preselectedRecipient, setPreselectedRecipient] = useState(null);

  useEffect(() => {
    if (openConversationPhone) {
      const name = location.state?.openConversationName || "";
      setPreselectedRecipient({ phone: openConversationPhone, name });
      setPanel("compose");
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [openConversationPhone]);

  const apiFetch = useCallback(async (path, opts = {}) => {
    if (!session?.access_token) return Promise.reject(new Error("Not authenticated"));
    const r = await fetch(`${API_BASE}${path}`, {
      ...opts,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
        "X-Business-Id": businessId,
        ...(opts.headers || {}),
      },
    });
    const data = await r.json().catch(() => ({}));
    return { ...data, ok: r.ok };
  }, [session?.access_token, businessId]);

  const load = useCallback(async (silent = false) => {
    if (!session?.access_token || !businessId) return;
    if (!silent) setDataLoading(true); else setRefreshing(true);
    try {
      const res = await apiFetch("/api/sms/inbox?limit=100");
      setData(res);
      onUnreadChange?.(res.unread_total || 0);
    } finally { setDataLoading(false); setRefreshing(false); }
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

  if (!session?.access_token) {
    return (
      <div style={{ padding: 24, color: "var(--v2-gray-400)", textAlign: "center" }}>
        נדרשת התחברות לצפייה באינבוקס
      </div>
    );
  }

  return (
    <>
      <AnimatePresence>
        {panel && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="inbox-overlay"
            onClick={() => setPanel(null)}
          >
            {panel === "compose" && (
              <NewMessagePanel
                onClose={() => { setPanel(null); setPreselectedRecipient(null); }}
                apiFetch={apiFetch}
                preselectedRecipient={preselectedRecipient}
                businessId={businessId}
                session={session}
                onSent={() => { load(true); }}
              />
            )}
            {panel === "history" && (
              <ConversationHistoryPanel
                phone={historyPhone}
                senderName={historySenderName}
                onClose={() => setPanel(null)}
                apiFetch={apiFetch}
                onRefresh={() => load(true)}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
      <style>{`
        .inbox-page { max-width: 780px; margin: 0 auto; padding: 24px 16px 80px; direction: rtl; }
        .inbox-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; gap: 12px; flex-wrap: wrap; }
        .inbox-header__title { display: flex; align-items: center; gap: 10px; font-family: "Bricolage Grotesque", "Outfit", sans-serif; font-size: 24px; font-weight: 700; color: #fff; }
        .inbox-header__badge { background: var(--v2-primary); color: var(--v2-dark); font-size: 12px; font-weight: 700; padding: 2px 8px; border-radius: 99px; }
        .inbox-header__meta { font-size: 13px; color: var(--v2-gray-400); margin-top: 4px; }
        .inbox-header__desc { font-size: 12px; color: var(--v2-gray-400); direction: rtl; margin-top: 6px; line-height: 1.5; }
        .inbox-header__actions { display: flex; gap: 8px; }
        .inbox-filters { display: flex; gap: 6px; margin-bottom: 20px; background: var(--v2-dark-2); border-radius: var(--radius-md); padding: 4px; width: fit-content; border: 1px solid var(--glass-border); }
        .inbox-filters__btn { padding: 6px 16px; border-radius: 6px; border: none; background: transparent; font-size: 13px; font-weight: 500; color: var(--v2-gray-400); cursor: pointer; }
        .inbox-filters__btn--active { background: var(--v2-primary); color: var(--v2-dark); font-weight: 600; }
        .campaign-group { background: var(--v2-dark-2); border: 1px solid var(--glass-border); border-radius: var(--radius-lg); margin-bottom: 12px; overflow: hidden; }
        .campaign-group__header { display: flex; align-items: center; justify-content: space-between; padding: 14px 18px; cursor: pointer; background: var(--v2-dark-3); border-bottom: 1px solid var(--glass-border); }
        .campaign-group__header:hover { background: var(--glass-bg); }
        .campaign-group__left { display: flex; align-items: center; gap: 10px; }
        .campaign-group__name { font-size: 14px; font-weight: 600; color: #fff; }
        .campaign-group__unread { background: var(--v2-primary); color: var(--v2-dark); font-size: 11px; font-weight: 700; padding: 1px 7px; border-radius: 99px; }
        .campaign-group__right { display: flex; align-items: center; gap: 10px; }
        .campaign-group__count { font-size: 12px; color: var(--v2-gray-400); }
        .msg-row { display: flex; gap: 12px; padding: 14px 18px; border-bottom: 1px solid var(--glass-border); transition: background 0.12s; }
        .msg-row:last-child { border-bottom: none; }
        .msg-row--unread { background: rgba(0,195,122,0.06); cursor: pointer; }
        .msg-row--unread:hover { background: rgba(0,195,122,0.1); }
        .msg-row__avatar { width: 36px; height: 36px; border-radius: 50%; background: var(--v2-dark-3); display: flex; align-items: center; justify-content: center; color: var(--v2-gray-400); flex-shrink: 0; }
        .msg-row--unread .msg-row__avatar { background: rgba(0,195,122,0.12); color: var(--v2-primary); }
        .msg-row__body { flex: 1; min-width: 0; }
        .msg-row__top { display: flex; align-items: center; gap: 8px; margin-bottom: 5px; flex-wrap: wrap; }
        .msg-row__name { font-size: 13px; font-weight: 600; color: #fff; }
        .msg-row__phone { display: flex; align-items: center; gap: 3px; font-size: 11px; color: var(--v2-gray-400); }
        .msg-row__time { display: flex; align-items: center; gap: 3px; font-size: 11px; color: var(--v2-gray-500); margin-right: auto; }
        .msg-row__badge-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--v2-primary); }
        .msg-row__text { font-size: 14px; color: var(--v2-gray-400); line-height: 1.5; margin: 0 0 8px; word-break: break-word; }
        .msg-row__actions { display: flex; gap: 8px; margin-top: 4px; }
        .msg-row__replied { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--v2-primary); margin-top: 4px; background: rgba(0,195,122,0.1); border-radius: var(--radius-md); padding: 4px 8px; width: fit-content; border: 1px solid rgba(0,195,122,0.2); }
        .msg-row__replied-time { color: var(--v2-gray-500); font-size: 11px; }
        .reply-box { margin-top: 10px; border: 1px solid var(--v2-primary); border-radius: var(--radius-md); background: var(--v2-dark-3); overflow: hidden; }
        .reply-box__header { display: flex; align-items: center; gap: 6px; padding: 8px 12px; background: rgba(0,195,122,0.08); font-size: 12px; color: var(--v2-primary); font-weight: 600; border-bottom: 1px solid var(--glass-border); }
        .reply-box__textarea { width: 100%; border: none; outline: none; padding: 10px 12px; font-size: 14px; font-family: inherit; color: #fff; background: transparent; resize: none; direction: rtl; box-sizing: border-box; }
        .reply-box__footer { display: flex; align-items: center; padding: 8px 12px; gap: 10px; border-top: 1px solid var(--glass-border); background: var(--v2-dark-2); }
        .reply-box__counter { font-size: 11px; color: var(--v2-gray-500); }
        .reply-box__error { font-size: 12px; color: #ef4444; }
        .reply-box__actions { display: flex; gap: 8px; margin-right: auto; }
        .btn { display: inline-flex; align-items: center; gap: 5px; border: none; cursor: pointer; font-family: inherit; font-weight: 500; transition: all 0.15s; border-radius: var(--radius-md); }
        .btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .btn--primary { background: var(--v2-primary); color: var(--v2-dark); padding: 8px 16px; font-size: 13px; }
        .btn--primary:hover:not(:disabled) { opacity: 0.9; }
        .btn--ghost { background: var(--glass-bg); color: var(--v2-gray-400); padding: 6px 12px; font-size: 13px; border: 1px solid var(--glass-border); }
        .btn--ghost:hover { color: #fff; }
        .btn--reply { background: rgba(0,195,122,0.12); color: var(--v2-primary); padding: 5px 12px; font-size: 12px; border: 1px solid rgba(0,195,122,0.25); border-radius: var(--radius-md); }
        .btn--reply:hover { background: rgba(0,195,122,0.18); }
        .btn--sm { padding: 6px 12px; font-size: 12px; }
        .btn--xs { padding: 3px 8px; font-size: 11px; border-radius: var(--radius-md); }
        .inbox-empty { text-align: center; padding: 64px 20px; background: var(--v2-dark-2); border-radius: var(--radius-lg); border: 1px solid var(--glass-border); }
        .inbox-empty__icon { margin: 0 auto 16px; width: 80px; height: 80px; border-radius: 50%; background: var(--v2-dark-3); display: flex; align-items: center; justify-content: center; color: var(--v2-gray-500); }
        .inbox-empty h3 { font-size: 18px; color: #fff; margin: 0 0 8px; font-weight: 600; }
        .inbox-empty p { font-size: 14px; color: var(--v2-gray-400); margin: 0; }
        .inbox-loading { display: flex; flex-direction: column; gap: 12px; }
        .skeleton { background: linear-gradient(90deg, var(--v2-dark-2) 25%, var(--v2-dark-3) 50%, var(--v2-dark-2) 75%); background-size: 200% 100%; animation: shimmer 1.4s infinite; border-radius: var(--radius-md); height: 90px; }
        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
        .spin { animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 600px) {
          .inbox-header { flex-direction: column; align-items: flex-start; }
          .inbox-filters { width: 100%; }
          .inbox-filters__btn { flex: 1; text-align: center; }
        }
        .inbox-overlay { position: fixed; inset: 0; z-index: 100; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); display: flex; justify-content: flex-end; align-items: stretch; }
        .inbox-panel { width: min(420px, 100vw); max-width: 100%; background: var(--v2-dark-2); border-right: 1px solid var(--glass-border); overflow-y: auto; box-shadow: -8px 0 24px rgba(0,0,0,0.4); display: flex; flex-direction: column; }
        .inbox-panel__header { display: flex; justify-content: space-between; align-items: flex-start; padding: 20px; border-bottom: 1px solid var(--glass-border); }
        .inbox-panel__title { font-family: "Bricolage Grotesque","Outfit",sans-serif; font-weight: 800; font-size: 20px; color: #fff; margin: 0; }
        .inbox-panel__sub { font-size: 13px; color: var(--v2-gray-400); margin-top: 4px; }
        .btn-icon { background: none; border: none; color: var(--v2-gray-400); cursor: pointer; padding: 4px; }
        .btn-icon:hover { color: #fff; }
        .inbox-panel__tabs { display: flex; padding: 0 20px; gap: 4px; border-bottom: 1px solid var(--glass-border); }
        .inbox-panel__tab { padding: 12px 20px; border: none; background: none; color: var(--v2-gray-400); font-size: 14px; font-weight: 500; cursor: pointer; border-bottom: 2px solid transparent; }
        .inbox-panel__tab--active { color: var(--v2-primary); border-bottom-color: var(--v2-primary); }
        .inbox-panel__body { padding: 20px; flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 16px; }
        .compose-field label { display: block; font-size: 12px; font-weight: 600; color: var(--v2-gray-400); margin-bottom: 6px; }
        .compose-search { display: flex; align-items: center; gap: 10px; background: var(--v2-dark-3); border: 1px solid var(--glass-border); border-radius: var(--radius-md); padding: 10px 14px; }
        .compose-search input { flex: 1; background: none; border: none; color: #fff; font-size: 14px; outline: none; }
        .compose-results { margin-top: 8px; display: flex; flex-direction: column; gap: 4px; }
        .compose-result-item { text-align: right; padding: 10px 12px; background: var(--v2-dark-3); border: 1px solid var(--glass-border); border-radius: var(--radius-md); color: #fff; font-size: 13px; cursor: pointer; }
        .compose-result-item:hover { background: var(--glass-bg); }
        .compose-result-item.selected { border-color: var(--v2-primary); background: rgba(0,195,122,0.1); }
        .compose-selected { padding: 10px; background: rgba(0,195,122,0.15); border-radius: var(--radius-md); font-size: 13px; color: var(--v2-primary); margin-top: 8px; }
        .compose-field textarea { width: 100%; background: var(--v2-dark-3); border: 1px solid var(--glass-border); border-radius: var(--radius-md); padding: 12px; color: #fff; font-size: 14px; resize: none; direction: rtl; box-sizing: border-box; }
        .compose-counter { font-size: 11px; color: var(--v2-gray-500); margin-top: 4px; }
        .compose-subtabs { display: flex; gap: 6px; flex-wrap: wrap; }
        .compose-subtab { padding: 8px 14px; border-radius: var(--radius-md); border: 1px solid var(--glass-border); background: var(--v2-dark-3); color: var(--v2-gray-400); font-size: 13px; cursor: pointer; }
        .compose-subtab.active { background: var(--v2-primary); color: var(--v2-dark); border-color: var(--v2-primary); }
        .compose-group-list { padding: 12px; background: var(--v2-dark-3); border-radius: var(--radius-md); }
        .compose-group-chips { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
        .compose-group-chips .chip { display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; background: var(--glass-bg); border-radius: 99px; font-size: 12px; color: var(--v2-gray-400); }
        .compose-group-chips .chip button { background: none; border: none; color: inherit; cursor: pointer; padding: 0 2px; font-size: 16px; }
        .conv-history { gap: 12px; }
        .conv-history__loading, .conv-history__empty { text-align: center; color: var(--v2-gray-500); padding: 40px; }
        .conv-bubble { max-width: 85%; padding: 12px 14px; border-radius: var(--radius-lg); font-size: 14px; line-height: 1.5; }
        .conv-bubble--out { align-self: flex-end; margin-inline-start: auto; background: var(--v2-primary); color: var(--v2-dark); }
        .conv-bubble--in { align-self: flex-start; margin-inline-end: auto; background: var(--v2-dark-3); border: 1px solid var(--glass-border); color: #fff; }
        .conv-bubble__time { font-size: 11px; color: var(--v2-gray-500); margin-top: 6px; opacity: 0.9; }
      `}</style>

      <div className="inbox-page">
        <div className="inbox-header">
          <div>
            <div className="inbox-header__title">
              <MessageSquare size={22} />
              <span>תיבת הודעות נכנסות</span>
              {data?.unread_total > 0 && <span className="inbox-header__badge">{data.unread_total}</span>}
            </div>
            {!dataLoading && (
              <>
                <div className="inbox-header__meta">{totalMessages} הודעות • {data?.campaigns?.length || 0} קמפיינים</div>
                <div className="inbox-header__desc">
                  תיבה זו מציגה את כל ההודעות הנכנסות מלקוחות שהגיבו לקמפיינים שלך.
                  תשובתך תישלח ללקוח כ-SMS דרך המספר הווירטואלי (Text Lead) המשויך לעסק.
                  עד 201 תווים = קרדיט אחד • מעל 201 תווים = 2 קרדיטים או יותר.
                  ניתן להעניק לאנשי צוות הרשאת גישה לתיבה דרך הגדרות → צוות.
                </div>
              </>
            )}
          </div>
          <div className="inbox-header__actions">
            <button className="btn btn--primary btn--sm" onClick={() => setPanel("compose")}>
              <Plus size={14} /> הודעה חדשה
            </button>
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

        {dataLoading ? (
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
              initialOpen={true}
              onViewConversation={(phone, senderName) => {
                setHistoryPhone(phone);
                setHistorySenderName(senderName || "");
                setPanel("history");
              }}
            />
          ))
        )}
      </div>
    </>
  );
}
