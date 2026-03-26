import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation, useNavigate } from "react-router-dom";
import {
  MessageSquare, MessageCircle, Send, RefreshCw, Search, Plus, X, ChevronLeft, Settings,
  InboxIcon, Paperclip,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useRequirePermission } from "@/hooks/useRequirePermission";
import { fetchWithAuth, supabase } from "@/lib/supabase";
import toast from "react-hot-toast";

const API_BASE = import.meta.env.VITE_API_URL || "https://api.axess.pro";

const SELECT_STYLE = {
  width: "100%", padding: "8px 12px", borderRadius: 8,
  border: "1px solid var(--glass-border)", background: "var(--card)",
  color: "var(--text)", fontSize: 14, fontFamily: "inherit",
  cursor: "pointer", WebkitAppearance: "none", appearance: "none",
};

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

function formatTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" });
}

function BubbleStyle(direction, isInternal) {
  const inbound = direction === "inbound";
  return {
    maxWidth: "75%",
    padding: "10px 14px",
    borderRadius: isInternal ? 8 : inbound ? "12px 12px 0 12px" : "12px 12px 12px 0",
    background: isInternal
      ? "rgba(245,158,11,0.15)"
      : inbound
        ? "var(--glass-bg)"
        : "#00C37A",
    color: !isInternal && !inbound ? "#000" : "var(--text-bubble, #fff)",
    border: isInternal ? "1px solid rgba(245,158,11,0.3)" : "none",
    alignSelf: isInternal ? "center" : inbound ? "flex-end" : "flex-start",
    marginBottom: 4,
    fontSize: 14,
    lineHeight: 1.5,
    wordBreak: "break-word",
  };
}

function extractVariables(components) {
  const body = components?.find((c) => c.type === "BODY");
  if (!body?.text) return 0;
  const matches = body.text.match(/\{\{(\d+)\}\}/g);
  return matches ? Math.max(...matches.map((m) => parseInt(m.replace(/[{}]/g, ""), 10))) : 0;
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
  agents = [],
  agentOnline,
  onAgentStatusChange,
  queues = [],
}) {
  const [messageMode, setMessageMode] = useState("message");
  const [sendChannel, setSendChannel] = useState(channel || "sms");
  const [message, setMessage] = useState("");
  const [templateName, setTemplateName] = useState("");
  const [templateVars, setTemplateVars] = useState({});
  const [sending, setSending] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const textareaRef = useRef(null);

  const targetConvId = sendChannel === "sms" ? smsConvoId : waConvoId || convId;
  const approvedTemplates = (templates || []).filter((t) => t.meta_status === "APPROVED");
  const selectedTemplate = approvedTemplates.find((t) => t.template_name === templateName);
  const templateVarCount = extractVariables(selectedTemplate?.components);

  const noteHeaders = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiFetch.token}`,
    "X-Business-Id": apiFetch.businessId,
  };

  const handleSend = async () => {
    if (messageMode === "note") {
      if (!message.trim()) return toast.error("הכנס תוכן להערה");
      setSending(true);
      try {
        const r = await fetch(`${API_BASE}/api/inbox/conversations/${convId}/notes`, {
          method: "POST",
          headers: noteHeaders,
          body: JSON.stringify({ content: message.trim(), is_pinned: false, mentioned_agents: [] }),
        });
        const data = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(data.error || "שגיאה");
        setMessage("");
        if (textareaRef.current) {
          textareaRef.current.style.height = "120px";
        }
        onSent?.();
        toast.success("הערה נשמרה");
      } catch (e) {
        toast.error(e.message);
      } finally {
        setSending(false);
      }
      return;
    }
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
      if (textareaRef.current) {
        textareaRef.current.style.height = "120px";
      }
      onSent?.();
      toast.success("נשלח");
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSending(false);
    }
  };

  const canSend =
    messageMode === "note"
      ? !!message.trim()
      : (sendChannel === "sms" && message.trim()) ||
        (sendChannel === "whatsapp" && (waSession ? message.trim() : templateName));

  const segmentTabs = [
    ...(waConnected ? [{ id: "message", label: "WA", icon: <MessageCircle size={14} /> }] : []),
    { id: "sms", label: "SMS", icon: <MessageSquare size={14} /> },
    { id: "note", label: "🔒 פנימי", icon: null },
  ];

  return (
    <div
      className="inbox-send-panel"
      style={{
        flexShrink: 0,
        borderTop: "1px solid var(--glass-border)",
        background: "var(--card, var(--v2-dark-2))",
        transition: "height 0.25s ease",
        height: drawerOpen ? "380px" : "44px",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        onClick={() => setDrawerOpen(!drawerOpen)}
        style={{
          height: 44,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 16px",
          cursor: "pointer",
          userSelect: "none",
        }}
      >
        <span style={{ fontSize: 13, color: "var(--v2-gray-400)" }}>
          {drawerOpen ? "" : "💬 כתוב הודעה..."}
        </span>
        <span style={{ fontSize: 16, color: "var(--v2-gray-400)" }}>{drawerOpen ? "▼" : "▲"}</span>
      </div>
      <div
        style={{
          flex: 1,
          overflow: "hidden",
          padding: "0 12px 12px",
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
        }}
      >
      <div style={{ overflowY: "auto", overflowX: "hidden", minHeight: 0, flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
      <div
        style={{
          display: "flex",
          background: "var(--glass-bg)",
          borderRadius: 8,
          padding: 3,
          gap: 2,
        }}
      >
        {segmentTabs.map((tab) => {
          const active =
            tab.id === "note"
              ? messageMode === "note"
              : messageMode === "message" &&
                (tab.id === "message" ? sendChannel === "whatsapp" : tab.id === "sms" && sendChannel === "sms");
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                if (tab.id === "note") setMessageMode("note");
                else {
                  setMessageMode("message");
                  setSendChannel(tab.id === "message" ? "whatsapp" : "sms");
                }
              }}
              style={{
                padding: "6px 14px",
                borderRadius: 6,
                border: "none",
                background: active ? (tab.id === "note" ? "#F59E0B" : "var(--v2-primary)") : "transparent",
                color: active ? "#fff" : "var(--v2-gray-400)",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: active ? 600 : 400,
                display: "flex",
                alignItems: "center",
                gap: 4,
                height: 32,
                fontFamily: "inherit",
              }}
            >
              {tab.icon}
              {tab.label}
            </button>
          );
        })}
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "6px 0",
          fontSize: 14,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: agentOnline ? "#22C55E" : "#9CA3AF",
            }}
          />
          <select
            value={agentOnline ? "online" : "away"}
            onChange={async (e) => {
              const online = e.target.value === "online";
              onAgentStatusChange?.(online);
              const r = await fetch(`${API_BASE}/api/inbox/agents/status`, {
                method: "PATCH",
                headers: noteHeaders,
                body: JSON.stringify({ is_online: online }),
              });
              if (!r.ok) toast.error("לא עודכן סטטוס");
            }}
            style={{
              ...SELECT_STYLE,
              width: "auto",
              padding: "2px 6px",
              borderRadius: 6,
              background: "var(--v2-dark-3)",
              color: "#fff",
            }}
          >
            <option value="online">זמין</option>
            <option value="away">לא זמין</option>
          </select>
        </div>
        <span style={{ fontSize: 13, color: "var(--v2-gray-400)" }}>
          מחוברים: {agents?.filter((a) => a.is_online).length || 0}/{agents?.length || 0}
        </span>
      </div>
      {queues.length > 0 && (
        <div style={{ marginBottom: 0, paddingBottom: 4, borderBottom: "1px solid var(--glass-border)" }}>
          <div style={{ fontSize: 10, color: "var(--v2-gray-500)", marginBottom: 4 }}>תורים</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: 72, overflowY: "auto" }}>
            {queues.map((q) => (
              <div
                key={q.queue_name || "__default__"}
                style={{
                  fontSize: 11,
                  padding: "6px 8px",
                  borderRadius: 6,
                  background: "rgba(255,255,255,0.04)",
                  lineHeight: 1.35,
                }}
              >
                <strong style={{ fontSize: 12 }}>{q.queue_name || "(ללא תור)"}</strong>
                <div style={{ color: "var(--v2-gray-500)" }}>
                  סה״כ {q.total} · פתוח {q.unassigned} · מוקצה {q.assigned}
                  {q.avg_wait_minutes != null ? ` · ~${q.avg_wait_minutes} דק׳` : ""}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {messageMode === "message" && sendChannel === "whatsapp" && !waSession && approvedTemplates.length > 0 && (
        <select
          value={templateName}
          onChange={(e) => setTemplateName(e.target.value)}
          style={{
            ...SELECT_STYLE,
            height: 36,
            padding: "0 12px",
            borderRadius: 8,
            background: "var(--glass-bg)",
            color: "var(--text, #fff)",
            fontSize: 13,
            boxSizing: "border-box",
          }}
        >
          <option value="">תבנית…</option>
          {approvedTemplates.map((t) => (
            <option key={t.id} value={t.template_name}>
              {t.template_name}
            </option>
          ))}
        </select>
      )}
      {messageMode === "message" && sendChannel === "whatsapp" && !waSession && templateName && templateVarCount > 0 && (
        <div className="inbox-send-vars">
          {Array.from({ length: templateVarCount }, (_, i) => i + 1).map((i) => (
            <input
              key={i}
              placeholder={`משתנה {{${i}}}`}
              value={templateVars[i] || ""}
              onChange={(e) => setTemplateVars((v) => ({ ...v, [i]: e.target.value }))}
            />
          ))}
        </div>
      )}
      {(messageMode === "note" ||
        (messageMode === "message" &&
          (sendChannel === "sms" || (sendChannel === "whatsapp" && (waSession || !templateName))))) && (
        <textarea
          ref={textareaRef}
          placeholder={messageMode === "note" ? "🔒 הערה פנימית..." : "כתוב הודעה..."}
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            e.target.style.height = "auto";
            e.target.style.height = `${Math.min(e.target.scrollHeight, 240)}px`;
          }}
          maxLength={messageMode === "note" ? 4000 : 612}
          dir="rtl"
          style={{
            width: "100%",
            minHeight: 120,
            maxHeight: 240,
            padding: "12px 16px",
            background: "var(--glass-bg)",
            border: "1px solid var(--glass-border)",
            borderRadius: 8,
            color: "var(--text-bubble, #fff)",
            fontSize: 14,
            lineHeight: 1.5,
            resize: "none",
            overflow: "auto",
            fontFamily: "inherit",
            boxSizing: "border-box",
          }}
        />
      )}
      {messageMode === "message" && sendChannel === "sms" && message.length > 0 && (
        <div className="inbox-char-count">
          {message.length <= 160 ? 160 - message.length : 153 - ((message.length - 160) % 153)} תווים •{" "}
          {message.length <= 160 ? 1 : Math.ceil(message.length / 153)} SMS
        </div>
      )}
      <div dir="rtl" style={{ display: "flex", alignItems: "center", gap: 8, alignSelf: "flex-start" }}>
        <button
          type="button"
          className="btn btn--primary btn-send"
          onClick={handleSend}
          disabled={!canSend || sending}
        >
          {sending ? <RefreshCw size={14} className="spin" /> : <Send size={14} />} שלח
        </button>
        <button
          type="button"
          aria-label="צרף קובץ"
          style={{ background: "none", border: "none", cursor: "pointer", padding: 6, flexShrink: 0 }}
        >
          <Paperclip size={18} color="var(--v2-gray-400)" />
        </button>
      </div>
      </div>
      </div>
    </div>
  );
}

function SupervisorPanel({
  conv, staff, agents, onAssign, onResolve, onClose, authHeaders, onAfterTransfer, onAfterWhisper, memberRole,
}) {
  const [agentId, setAgentId] = useState(conv?.assigned_to || "");
  const [department, setDepartment] = useState(conv?.department || "");
  const [assigning, setAssigning] = useState(false);
  const [savingDept, setSavingDept] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [transferAgent, setTransferAgent] = useState("");
  const [whisperText, setWhisperText] = useState("");
  const [transferring, setTransferring] = useState(false);
  const [whisperSending, setWhisperSending] = useState(false);
  const [openSection, setOpenSection] = useState("assign");

  const canWhisper = ["owner", "manager"].includes(String(memberRole || "").toLowerCase());
  const onlineAgents = (agents || []).filter((a) => a.is_online);

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

  const handleTransfer = async () => {
    if (!transferAgent) {
      toast.error("בחר נציג");
      return;
    }
    setTransferring(true);
    try {
      const r = await fetch(`${API_BASE}/api/inbox/conversations/${conv.id}/transfer`, {
        method: "PATCH",
        headers: { ...authHeaders() },
        body: JSON.stringify({ new_agent_id: transferAgent }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || "שגיאה");
      toast.success("השיחה הועברה");
      setTransferAgent("");
      onAfterTransfer?.();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setTransferring(false);
    }
  };

  const handleWhisper = async () => {
    if (!whisperText.trim()) return;
    setWhisperSending(true);
    try {
      const r = await fetch(`${API_BASE}/api/inbox/conversations/${conv.id}/whisper`, {
        method: "POST",
        headers: { ...authHeaders() },
        body: JSON.stringify({ content: whisperText.trim() }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || "שגיאה");
      toast.success("נשלחה הערת מנהל");
      setWhisperText("");
      onAfterWhisper?.();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setWhisperSending(false);
    }
  };

  const selectStyle = {
    width: "100%",
    padding: "8px 12px",
    borderRadius: 8,
    border: "1px solid var(--glass-border)",
    background: "var(--card)",
    color: "var(--text)",
    fontSize: 13,
    fontFamily: "inherit",
  };

  return (
    <div
      className="supervisor-panel"
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
        padding: 0,
        gap: 0,
      }}
    >
      <div style={{ flexShrink: 0, padding: "12px 16px", borderBottom: "1px solid var(--glass-border)" }}>
        <h4 style={{ margin: "0 0 8px", fontSize: 14 }}>ניהול שיחה</h4>
        <div className="supervisor-customer">
          <div>
            טלפון: <span dir="ltr">{conv?.customer_phone}</span>
          </div>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: "auto", minHeight: 0, padding: "12px 16px" }}>
        <div>
          <button
            type="button"
            onClick={() => setOpenSection(openSection === "assign" ? null : "assign")}
            style={{
              width: "100%",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "8px 0",
              color: "var(--v2-gray-200)",
              fontSize: 13,
              fontFamily: "inherit",
            }}
          >
            <span>הקצה לנציג / מחלקה</span>
            <span>{openSection === "assign" ? "▲" : "▼"}</span>
          </button>
          {openSection === "assign" && (
            <div className="supervisor-field" style={{ paddingBottom: 8 }}>
              <label>הקצה לנציג</label>
              <select value={agentId} onChange={(e) => setAgentId(e.target.value)} style={selectStyle}>
                <option value="">—</option>
                {(staff || []).map((s) => (
                  <option key={s.id} value={s.id}>
                    #{s.role}
                  </option>
                ))}
              </select>
              <button type="button" onClick={handleAssign} disabled={assigning}>
                שמור
              </button>
              <label style={{ marginTop: 8 }}>מחלקה</label>
              <input value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="למשל: מכירות" />
              <button type="button" onClick={handleChangeDept} disabled={savingDept}>
                עדכן
              </button>
            </div>
          )}
        </div>
        <div>
          <button
            type="button"
            onClick={() => setOpenSection(openSection === "transfer" ? null : "transfer")}
            style={{
              width: "100%",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "8px 0",
              color: "var(--v2-gray-200)",
              fontSize: 13,
              fontFamily: "inherit",
            }}
          >
            <span>העבר לנציג</span>
            <span>{openSection === "transfer" ? "▲" : "▼"}</span>
          </button>
          {openSection === "transfer" && (
            <div className="supervisor-field" style={{ paddingBottom: 8 }}>
              <select value={transferAgent} onChange={(e) => setTransferAgent(e.target.value)} style={selectStyle}>
                <option value="">—</option>
                {onlineAgents.map((a) => (
                  <option key={a.business_member_id} value={a.business_member_id}>
                    {a.full_name || a.email || a.business_member_id}
                  </option>
                ))}
              </select>
              <button type="button" onClick={handleTransfer} disabled={transferring || !transferAgent}>
                העבר
              </button>
            </div>
          )}
        </div>
        {canWhisper && (
          <div>
            <button
              type="button"
              onClick={() => setOpenSection(openSection === "whisper" ? null : "whisper")}
              style={{
                width: "100%",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "8px 0",
                color: "var(--v2-gray-200)",
                fontSize: 13,
                fontFamily: "inherit",
              }}
            >
              <span>הערת מנהל</span>
              <span>{openSection === "whisper" ? "▲" : "▼"}</span>
            </button>
            {openSection === "whisper" && (
              <div className="supervisor-field" style={{ paddingBottom: 8 }}>
                <input
                  value={whisperText}
                  onChange={(e) => setWhisperText(e.target.value)}
                  placeholder="הערה לצוות (מנהל)…"
                  dir="rtl"
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: 8,
                    border: "1px solid #F59E0B",
                    background: "rgba(245,158,11,0.12)",
                    color: "var(--text)",
                    fontSize: 13,
                    fontFamily: "inherit",
                  }}
                />
                <button type="button" className="btn btn--primary" onClick={handleWhisper} disabled={whisperSending || !whisperText.trim()}>
                  שלח
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      <div style={{ flexShrink: 0, padding: "12px 16px", borderTop: "1px solid var(--glass-border)" }}>
        <button type="button" className="supervisor-resolve" style={{ width: "100%" }} onClick={handleResolve} disabled={resolving}>
          סגור שיחה
        </button>
      </div>
    </div>
  );
}

export default function Inbox({ onUnreadChange }) {
  const inboxAllowed = useRequirePermission("can_view_inbox");
  const { session, businessId, role, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("הכל");
  const [activeTab, setActiveTab] = useState("conversations");
  const [search, setSearch] = useState("");
  const [agentFilter, setAgentFilter] = useState("");
  const [selectedConv, setSelectedConv] = useState(null);
  const [waStatus, setWaStatus] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [staff, setStaff] = useState([]);
  const [showSupervisor, setShowSupervisor] = useState(false);
  const [showNewMessage, setShowNewMessage] = useState(false);
  const [preselectedPhone, setPreselectedPhone] = useState(null);
  const pendingOpenRef = useRef(null);
  const [recipientSearch, setRecipientSearch] = useState("");
  const [recipientResults, setRecipientResults] = useState([]);
  const [selectedRecipient, setSelectedRecipient] = useState(null);
  const [newMsgChannel, setNewMsgChannel] = useState("sms");
  const [newMsgMessage, setNewMsgMessage] = useState("");
  const [newMsgTemplateName, setNewMsgTemplateName] = useState("");
  const [newMsgTemplateVars, setNewMsgTemplateVars] = useState({});
  const [newMsgSending, setNewMsgSending] = useState(false);
  const recipientSearchDebounceRef = useRef(null);
  const [queues, setQueues] = useState([]);
  const [agents, setAgents] = useState([]);
  const [agentOnline, setAgentOnline] = useState(true);

  const isSupervisor = role === "owner" || role === "manager";

  const authHeaders = useCallback(() => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${session?.access_token}`,
    "X-Business-Id": businessId,
  }), [session?.access_token, businessId]);

  const queryClient = useQueryClient();

  const onUnauthorized = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  useEffect(() => {
    const state = location.state || {};
    if (state.openConversation && !pendingOpenRef.current) {
      pendingOpenRef.current = { phone: state.openConversation, name: state.openConversationName || "" };
    }
  }, [location.state]);

  useEffect(() => {
    if (showNewMessage && preselectedPhone) {
      setSelectedRecipient({ phone: preselectedPhone.phone, name: preselectedPhone.name || "" });
      setRecipientSearch(preselectedPhone.phone || "");
      setRecipientResults([]);
    }
    if (showNewMessage) {
      setNewMsgMessage("");
      setNewMsgTemplateName("");
      setNewMsgTemplateVars({});
    }
  }, [showNewMessage, preselectedPhone]);

  useEffect(() => {
    if (!recipientSearch.trim()) {
      setRecipientResults([]);
      return;
    }
    if (recipientSearchDebounceRef.current) clearTimeout(recipientSearchDebounceRef.current);
    recipientSearchDebounceRef.current = setTimeout(() => {
      const q = recipientSearch.trim();
      if (!q || !session?.access_token || !businessId) return;
      fetch(`${API_BASE}/api/admin/recipients?search=${encodeURIComponent(q)}`, { headers: authHeaders() })
        .then((r) => (r.ok ? r.json() : []))
        .then((data) => setRecipientResults(Array.isArray(data) ? data : (data?.recipients || [])))
        .catch(() => setRecipientResults([]));
    }, 300);
    return () => {
      if (recipientSearchDebounceRef.current) clearTimeout(recipientSearchDebounceRef.current);
    };
  }, [recipientSearch, session?.access_token, businessId, authHeaders]);

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

  const {
    data: conversationsData,
    isLoading: conversationsLoading,
    refetch: refetchConversations,
  } = useQuery({
    queryKey: ["conversations", businessId, filter, search, agentFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filter === "SMS") params.set("channel", "sms");
      else if (filter === "WA") params.set("channel", "whatsapp");
      else if (filter === "לא מוקצה") params.set("status", "unassigned");
      if (search) params.set("search", search);
      if (agentFilter && isSupervisor) params.set("assigned_to", agentFilter);
      const res = await apiFetch(`/api/inbox/conversations?${params}`);
      const list = res.conversations || [];
      const conversations =
        filter === "לא נענה" ? list.filter((c) => (c.unread_count || 0) > 0) : list;
      return { ...res, conversations };
    },
    enabled: !!session?.access_token && !!businessId,
  });

  const activeConversationId = selectedConv?.id ?? null;

  const {
    data: messages = [],
    isLoading: messagesLoading,
  } = useQuery({
    queryKey: ["messages", activeConversationId],
    queryFn: async () => {
      const d = await apiFetch(
        `/api/inbox/customer-messages?customer_phone=${encodeURIComponent(selectedConv.customer_phone)}`,
      );
      return d.messages || [];
    },
    enabled: !!activeConversationId && !!selectedConv?.customer_phone,
  });

  const { data: supervisor } = useQuery({
    queryKey: ["inbox-supervisor", businessId],
    queryFn: async () => {
      const r = await fetch(`${API_BASE}/api/inbox/supervisor`, { headers: authHeaders() });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || "supervisor");
      return data;
    },
    refetchInterval: 30_000,
    enabled: !!session?.access_token && !!businessId && isSupervisor,
  });

  useEffect(() => {
    if (!businessId) return;

    const channel = supabase
      .channel(`inbox:${businessId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "inbox_conversations",
          filter: `business_id=eq.${businessId}`,
        },
        (payload) => {
          console.log("[realtime] inbox change:", payload);
          queryClient.invalidateQueries({ queryKey: ["conversations", businessId] });
          queryClient.invalidateQueries({ queryKey: ["inbox-supervisor", businessId] });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [businessId, queryClient]);

  useEffect(() => {
    if (!businessId || !activeConversationId) return;

    const msgChannel = supabase
      .channel(`messages:${businessId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "conversation_logs",
          filter: `conversation_id=eq.${activeConversationId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["messages", activeConversationId] });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(msgChannel);
    };
  }, [businessId, activeConversationId, queryClient]);

  useEffect(() => {
    setLoading(conversationsLoading);
  }, [conversationsLoading]);

  useEffect(() => {
    if (conversationsData) {
      const list = conversationsData.conversations || [];
      setConversations(list);
      const unread = list.reduce((s, c) => s + (c.unread_count || 0), 0);
      onUnreadChange?.(unread);
    }
  }, [conversationsData, onUnreadChange]);

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
      fetch(`${API_BASE}/api/inbox/queues`, { headers: authHeaders() })
        .then((r) => (r.ok ? r.json() : {}))
        .then((d) => setQueues(d.queues || []))
        .catch(() => setQueues([]));
      fetch(`${API_BASE}/api/inbox/agents`, { headers: authHeaders() })
        .then((r) => (r.ok ? r.json() : {}))
        .then((d) => {
          const rows = d.agents || [];
          setAgents(rows);
          const email = user?.email;
          const mine = rows.find((a) => a.email === email);
          if (mine) setAgentOnline(!!mine.is_online);
        })
        .catch(() => {});
    }
  }, [session?.access_token, businessId, isSupervisor, authHeaders, user?.email]);

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
    if (!selectedConv) return;
    apiFetch(`/api/inbox/conversations/${selectedConv.id}/read`, { method: "PATCH" }).catch(() => {});
    refetchConversations();
  }, [selectedConv?.id, selectedConv?.customer_phone, apiFetch, refetchConversations]);

  const handleAssign = async (convId, agentId, department) => {
    const r = await fetch(`${API_BASE}/api/inbox/conversations/${convId}/assign`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ agent_id: agentId || undefined, department: department || undefined }),
    });
    if (!r.ok) throw new Error("שגיאה בהקצאה");
    await refetchConversations();
  };

  const handleResolve = async (convId) => {
    const r = await fetch(`${API_BASE}/api/inbox/conversations/${convId}/resolve`, {
      method: "POST",
      headers: authHeaders(),
    });
    if (!r.ok) throw new Error();
    setSelectedConv(null);
    await refetchConversations();
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

  if (!inboxAllowed) return null;

  return (
    <>
      <style>{`
        .inbox-unified { display: flex; flex-direction: column; height: calc(100vh - 140px); min-height: 400px; direction: rtl; background: var(--v2-dark-2); border-radius: var(--radius-lg); border: 1px solid var(--glass-border); overflow: hidden; }
        .inbox-unified-row { display: flex; flex: 1; flex-direction: row; min-width: 0; min-height: 0; overflow: hidden; }
        .inbox-list { width: 320px; min-width: 280px; min-height: 0; border-left: 1px solid var(--glass-border); display: flex; flex-direction: column; background: var(--v2-dark-3); }
        .inbox-list-header { padding: 12px 16px; border-bottom: 1px solid var(--glass-border); }
        .inbox-list-tabs { display: flex; gap: 4px; margin-bottom: 10px; }
        .inbox-list-tabs button { padding: 6px 12px; border-radius: 8px; border: none; background: rgba(255,255,255,0.06); color: var(--v2-gray-400); font-size: 12px; cursor: pointer; }
        .inbox-list-tabs button.active { background: var(--v2-primary); color: var(--v2-dark); }
        .inbox-search { display: flex; align-items: center; gap: 8px; background: var(--v2-dark-2); border: 1px solid var(--glass-border); border-radius: 8px; padding: 8px 12px; }
        .inbox-search input { flex: 1; background: none; border: none; color: #fff; font-size: 13px; outline: none; }
        .inbox-conv-list { flex: 1; overflow-y: auto; }
        .inbox-conv-item { padding: 12px 16px; border-bottom: 1px solid var(--glass-border); cursor: pointer; transition: background 0.15s; display: flex; flex-direction: column; gap: 6px; }
        .inbox-conv-item:hover { background: rgba(255,255,255,0.04); }
        .inbox-conv-item.selected { background: rgba(0,195,122,0.1); border-right: 3px solid #00C37A; }
        .inbox-conv-row { display: flex; align-items: center; gap: 8px; }
        .inbox-conv-icon { font-size: 16px; }
        .inbox-conv-name { font-weight: 600; color: #fff; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .inbox-conv-time { font-size: 11px; color: var(--v2-gray-500); }
        .inbox-conv-preview { font-size: 12px; color: var(--v2-gray-400); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 100%; }
        .inbox-conv-badges { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
        .inbox-badge { font-size: 10px; padding: 2px 8px; border-radius: 99px; }
        .inbox-chat { flex: 1; display: flex; flex-direction: row; min-width: 0; min-height: 0; background: var(--v2-dark-2); }
        .inbox-chat-main { flex: 1; display: flex; flex-direction: column; min-width: 0; min-height: 0; overflow: hidden; }
        .inbox-chat-header { flex-shrink: 0; padding: 16px; border-bottom: 1px solid var(--glass-border); display: flex; justify-content: space-between; align-items: center; }
        .inbox-chat-back { display: none; }
        .inbox-chat-body { flex: 1; min-height: 0; overflow-y: auto; padding: 12px 16px; display: flex; flex-direction: column; gap: 0; }
        .inbox-chat-empty { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; color: var(--v2-gray-500); }
        .inbox-bubble { max-width: 80%; padding: 10px 14px; border-radius: 12px; font-size: 14px; line-height: 1.5; }
        .inbox-bubble--out { align-self: flex-end; background: var(--v2-primary); color: var(--v2-dark); }
        .inbox-bubble--in { align-self: flex-start; background: var(--v2-dark-3); border: 1px solid var(--glass-border); }
        .inbox-bubble--internal { align-self: stretch; max-width: 95%; background: rgba(245,158,11,0.15); border: 1px solid rgba(245,158,11,0.35); color: var(--v2-gray-200); }
        .inbox-bubble-meta { display: flex; align-items: center; gap: 8px; margin-top: 6px; font-size: 11px; opacity: 0.8; }
        .inbox-send-panel { flex-shrink: 0; padding: 0; border-top: none; display: flex; flex-direction: column; gap: 0; background: transparent; }
        .inbox-send-tabs { display: flex; gap: 8px; }
        .inbox-send-tabs button { padding: 6px 14px; border-radius: 8px; border: 1px solid var(--glass-border); background: transparent; color: var(--v2-gray-400); font-size: 13px; cursor: pointer; }
        .inbox-send-tabs button.active { background: var(--v2-primary); color: var(--v2-dark); border-color: var(--v2-primary); }
        .inbox-send-panel textarea { width: 100%; background: var(--glass-bg); border: 1px solid var(--glass-border); border-radius: 8px; padding: 12px; color: #fff; resize: none; font-size: 14px; }
        .btn-send {
          height: 44px;
          min-width: 80px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 15px;
          border: none;
          cursor: pointer;
          transition: filter 0.15s ease, transform 0.1s ease;
        }
        .btn-send:hover:not(:disabled) { filter: brightness(1.1); }
        .btn-send:active:not(:disabled) { transform: scale(0.97); }
        .inbox-unified textarea:focus, .inbox-unified input:focus {
          outline: none;
          border-color: #00C37A !important;
          box-shadow: 0 0 0 2px rgba(0,195,122,0.2);
        }
        .inbox-send-panel select, .inbox-send-panel input { background: var(--v2-dark-3); border: 1px solid var(--glass-border); border-radius: 8px; padding: 10px; color: #fff; }
        .inbox-char-count { font-size: 11px; color: var(--v2-gray-500); }
        .supervisor-panel { width: 260px; min-height: 0; padding: 0; border-right: 1px solid var(--glass-border); background: var(--v2-dark-3); display: flex; flex-direction: column; gap: 0; overflow: hidden; }
        .supervisor-panel h4 { margin: 0; font-size: 14px; }
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
          .inbox-unified-row { flex-direction: column; }
          .inbox-list { width: 100%; max-height: 40vh; }
          .inbox-chat { display: ${selectedConv ? "flex" : "none"}; }
          .inbox-chat-back { display: flex; }
        }
      `}</style>

      <div className="inbox-unified">
        {isSupervisor && (
          <div
            style={{
              flexShrink: 0,
              display: "flex",
              gap: 8,
              padding: "8px 12px",
              borderBottom: "1px solid var(--glass-border)",
              background: "var(--v2-dark-3)",
              alignItems: "center",
            }}
          >
            <button
              type="button"
              onClick={() => setActiveTab("conversations")}
              style={{
                padding: "6px 16px",
                borderRadius: 20,
                border: "none",
                background: activeTab === "conversations" ? "var(--v2-primary)" : "rgba(255,255,255,0.08)",
                color: activeTab === "conversations" ? "var(--v2-dark)" : "var(--v2-gray-400)",
                cursor: "pointer",
                fontSize: 13,
              }}
            >
              שיחות
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("supervisor")}
              style={{
                padding: "6px 16px",
                borderRadius: 20,
                border: "none",
                background: activeTab === "supervisor" ? "var(--v2-primary)" : "rgba(255,255,255,0.08)",
                color: activeTab === "supervisor" ? "var(--v2-dark)" : "var(--v2-gray-400)",
                cursor: "pointer",
                fontSize: 13,
              }}
            >
              📊 מוקד
            </button>
          </div>
        )}
        {activeTab === "supervisor" && isSupervisor ? (
          <div
            style={{
              flex: 1,
              minHeight: 0,
              overflowY: "auto",
              padding: 16,
              background: "var(--v2-dark-2)",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                gap: 12,
                marginBottom: 20,
              }}
            >
              {[
                { label: "שיחות פתוחות", value: supervisor?.kpis?.open_count ?? 0, icon: "💬", color: "#3B82F6" },
                { label: "ממתינות למענה", value: supervisor?.kpis?.waiting_count ?? 0, icon: "⏳", color: "#F59E0B" },
                { label: "נסגרו היום", value: supervisor?.kpis?.resolved_today ?? 0, icon: "✅", color: "#22C55E" },
                { label: "זמן ממוצע", value: `${supervisor?.kpis?.avg_resolution_minutes ?? 0} דק'`, icon: "⌛", color: "#8B5CF6" },
              ].map((kpi) => (
                <div
                  key={kpi.label}
                  style={{
                    background: "var(--v2-dark-3)",
                    borderRadius: 12,
                    padding: 14,
                    border: "1px solid var(--glass-border)",
                    textAlign: "center",
                  }}
                >
                  <div style={{ fontSize: 24 }}>{kpi.icon}</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: kpi.color }}>{kpi.value}</div>
                  <div style={{ fontSize: 12, color: "var(--v2-gray-400)" }}>{kpi.label}</div>
                </div>
              ))}
            </div>
            {supervisor?.alerts?.length > 0 && (
              <div
                style={{
                  background: "rgba(239,68,68,0.1)",
                  border: "1px solid rgba(239,68,68,0.3)",
                  borderRadius: 10,
                  padding: 12,
                  marginBottom: 16,
                }}
              >
                <p style={{ fontWeight: 700, color: "#EF4444", marginBottom: 8 }}>
                  🚨 {supervisor.alerts.length} שיחות ממתינות מעל 10 דקות
                </p>
                {supervisor.alerts.map((a) => (
                  <div key={a.id} style={{ fontSize: 13, color: "#e5e7eb", marginBottom: 4 }}>
                    📞 {a.customer_phone} — {Math.round(Number(a.wait_minutes))} דקות המתנה
                    {a.agent_name && ` | נציג: ${a.agent_name}`}
                  </div>
                ))}
              </div>
            )}
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 10 }}>נציגים</h3>
            <div style={{ marginBottom: 20 }}>
              {(supervisor?.agents || []).map((agent) => (
                <div
                  key={agent.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 12px",
                    background: "var(--v2-dark-3)",
                    borderRadius: 10,
                    marginBottom: 8,
                    border: "1px solid var(--glass-border)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        background: agent.is_online ? "#22C55E" : "#9CA3AF",
                      }}
                    />
                    <span style={{ fontWeight: 600 }}>{agent.full_name || "נציג"}</span>
                    <span style={{ fontSize: 12, color: "var(--v2-gray-400)" }}>{agent.role}</span>
                  </div>
                  <div style={{ display: "flex", gap: 16, fontSize: 13, color: "var(--v2-gray-400)" }}>
                    <span>
                      עומס: {agent.current_load}/{agent.max_capacity}
                    </span>
                    {agent.avg_resolution_minutes != null && (
                      <span>ממוצע: {agent.avg_resolution_minutes} דק'</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 10 }}>תורים</h3>
            <div style={{ marginBottom: 20 }}>
              {(supervisor?.queues || []).map((q) => (
                <div
                  key={String(q.queue_name)}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "10px 12px",
                    background: "var(--v2-dark-3)",
                    borderRadius: 10,
                    marginBottom: 8,
                    border: "1px solid var(--glass-border)",
                  }}
                >
                  <span style={{ fontWeight: 600 }}>{q.queue_name}</span>
                  <div style={{ display: "flex", gap: 12, fontSize: 13 }}>
                    <span style={{ color: "#F59E0B" }}>{q.waiting} ממתינות</span>
                    <span style={{ color: "var(--v2-gray-400)" }}>המתנה: {q.avg_wait_minutes} דק'</span>
                  </div>
                </div>
              ))}
            </div>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 10 }}>שיחות פעילות</h3>
            {(supervisor?.activeConvs || []).map((conv) => (
              <div
                key={conv.id}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    setSelectedConv(conv);
                    setActiveTab("conversations");
                    refetchConversations();
                    queryClient.invalidateQueries({ queryKey: ["messages", conv.id] });
                  }
                }}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "10px 12px",
                  background: "var(--v2-dark-3)",
                  borderRadius: 10,
                  marginBottom: 8,
                  border: "1px solid var(--glass-border)",
                  cursor: "pointer",
                }}
                onClick={() => {
                  setSelectedConv(conv);
                  setActiveTab("conversations");
                  refetchConversations();
                  queryClient.invalidateQueries({ queryKey: ["messages", conv.id] });
                }}
              >
                <div>
                  <span style={{ fontWeight: 600 }}>{conv.customer_phone}</span>
                  <span style={{ fontSize: 12, color: "var(--v2-gray-400)", marginRight: 8 }}>
                    {conv.queue_name || "כללי"}
                  </span>
                </div>
                <div style={{ display: "flex", gap: 12, fontSize: 13 }}>
                  <span style={{ color: Number(conv.wait_minutes) > 10 ? "#EF4444" : "var(--v2-gray-400)" }}>
                    {Math.round(Number(conv.wait_minutes))} דק'
                  </span>
                  <span style={{ color: "var(--v2-gray-400)" }}>{conv.agent_name || "לא מוקצה"}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
        <div className="inbox-unified-row">
        <div className="inbox-list">
          <div className="inbox-list-header">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <h2 style={{ margin: 0, fontSize: 18 }}>אינבוקס מאוחד</h2>
              <button className="btn btn--primary btn--sm" onClick={() => { setShowNewMessage(true); setPreselectedPhone(preselectedPhone || null); }}>
                <Plus size={14} /> חדש
              </button>
            </div>
            <div
              style={{
                display: "flex",
                gap: 6,
                padding: "6px 12px",
                flexWrap: "wrap",
                borderBottom: "1px solid var(--glass-border)",
              }}
            >
              {["הכל", "WA", "SMS", "לא מוקצה", "לא נענה"].map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  style={{
                    padding: "4px 12px",
                    borderRadius: 20,
                    border: "none",
                    background: filter === f ? "var(--primary, var(--v2-primary))" : "var(--glass-bg)",
                    color: filter === f ? "#fff" : "var(--text, #fff)",
                    fontSize: 12,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  {f}
                </button>
              ))}
            </div>
            <div style={{ padding: "8px 12px", position: "relative" }}>
              <Search
                size={14}
                color="var(--v2-gray-400)"
                style={{
                  position: "absolute",
                  right: 22,
                  top: "50%",
                  transform: "translateY(-50%)",
                  pointerEvents: "none",
                }}
              />
              <input
                placeholder="חיפוש לפי טלפון או הודעה..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                dir="rtl"
                style={{
                  width: "100%",
                  height: 36,
                  paddingRight: 36,
                  paddingLeft: 12,
                  borderRadius: 8,
                  border: "1px solid var(--glass-border)",
                  background: "var(--glass-bg)",
                  color: "var(--text, #fff)",
                  fontSize: 13,
                  boxSizing: "border-box",
                }}
              />
            </div>
            {isSupervisor && staff.length > 0 && (
              <select
                value={agentFilter}
                onChange={(e) => setAgentFilter(e.target.value)}
                style={{ ...SELECT_STYLE, marginBottom: 8, marginTop: 8, padding: "6px 10px", background: "var(--v2-dark-2)", color: "#fff", fontSize: 12 }}
              >
                <option value="">כל הנציגים</option>
                {staff.map((s) => (
                  <option key={s.id} value={s.id}>#{s.role}</option>
                ))}
              </select>
            )}
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
                    <span className="inbox-conv-icon" style={{ display: "flex", alignItems: "center" }}>
                      {c.channel === "whatsapp" ? (
                        <MessageCircle size={13} color="#22C55E" />
                      ) : (
                        <MessageSquare size={13} color="#3B82F6" />
                      )}
                    </span>
                    <span className="inbox-conv-name">{c.customer_phone}</span>
                    <span className="inbox-conv-time">{formatRelative(c.last_message_at)}</span>
                  </div>
                  <div className="inbox-conv-preview">
                    {(c.last_message || "—").slice(0, 50)}
                    {(c.last_message || "").length > 50 ? "…" : ""}
                  </div>
                  <div className="inbox-conv-badges">
                    {(c.unread_count || 0) > 0 && (
                      <span
                        style={{
                          background: "#00C37A",
                          color: "#000",
                          borderRadius: "50%",
                          width: 18,
                          height: 18,
                          fontSize: 11,
                          fontWeight: 700,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        {(c.unread_count || 0) > 9 ? "9+" : c.unread_count}
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
                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
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
                  <div style={{ display: "flex", flexDirection: "column", padding: 0 }}>
                    {messages.map((m) => {
                      const isIn = m.direction === "in";
                      const direction = isIn ? "inbound" : "outbound";
                      const waSt = m.metadata?.wa_status;
                      const tickStatus =
                        waSt === "read" ? "read" : waSt === "delivered" ? "delivered" : "sent";
                      return (
                        <div
                          key={m.id}
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: m.is_internal ? "center" : isIn ? "flex-end" : "flex-start",
                          }}
                        >
                          <div style={BubbleStyle(direction, !!m.is_internal)}>
                            {m.is_internal && (
                              <span style={{ fontSize: 11, color: "#F59E0B" }}>
                                🔒 {m.agent_name || "סוכן"} ·{" "}
                              </span>
                            )}
                            {m.message || m.action || "—"}
                          </div>
                          <div
                            style={{
                              fontSize: 11,
                              color: "var(--v2-gray-400)",
                              marginBottom: 8,
                              display: "flex",
                              alignItems: "center",
                              gap: 4,
                              alignSelf: isIn ? "flex-end" : "flex-start",
                            }}
                          >
                            {formatTime(m.created_at)}
                            {!m.is_internal && m.direction === "out" && (
                              <span
                                style={{
                                  color: tickStatus === "read" ? "#00C37A" : "var(--v2-gray-400)",
                                }}
                              >
                                {tickStatus === "read" ? "✓✓" : tickStatus === "delivered" ? "✓✓" : "✓"}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
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
                  agents={agents}
                  agentOnline={agentOnline}
                  onAgentStatusChange={setAgentOnline}
                  queues={queues}
                  onSent={() => {
                    refetchConversations();
                    queryClient.invalidateQueries({ queryKey: ["messages", selectedConv.id] });
                  }}
                  apiFetch={{ token: session?.access_token, businessId }}
                />
              </div>
              {showSupervisor && isSupervisor && (
                <SupervisorPanel
                  conv={selectedConv}
                  staff={staff}
                  agents={agents}
                  memberRole={role}
                  authHeaders={authHeaders}
                  onAfterTransfer={() => {
                    refetchConversations();
                    queryClient.invalidateQueries({ queryKey: ["messages", selectedConv.id] });
                    queryClient.invalidateQueries({ queryKey: ["inbox-supervisor", businessId] });
                  }}
                  onAfterWhisper={() => {
                    queryClient.invalidateQueries({ queryKey: ["messages", selectedConv.id] });
                  }}
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
        )}
      </div>

      {showNewMessage && (
        <div className="inbox-overlay" onClick={() => setShowNewMessage(false)}>
          <div className="inbox-new-msg-panel" onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: 16, borderBottom: "1px solid var(--glass-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0 }}>הודעה חדשה</h3>
              <button className="btn btn--ghost" onClick={() => setShowNewMessage(false)}><X size={20} /></button>
            </div>
            <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, color: "var(--v2-gray-500)", marginBottom: 6 }}>חיפוש נמען (שם או טלפון)</label>
                <input
                  type="text"
                  className="inbox-search-input"
                  placeholder="הקלד לחיפוש..."
                  value={recipientSearch}
                  onChange={(e) => setRecipientSearch(e.target.value)}
                  dir="rtl"
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--glass-border)", background: "var(--v2-dark-3)", color: "#fff" }}
                />
                {recipientResults.length > 0 && (
                  <ul style={{ margin: "8px 0 0", padding: 0, listStyle: "none", maxHeight: 200, overflowY: "auto", border: "1px solid var(--glass-border)", borderRadius: 8 }}>
                    {recipientResults.map((r) => (
                      <li
                        key={r.id || r.phone}
                        onClick={() => { setSelectedRecipient({ phone: r.phone, name: r.name || "" }); setRecipientSearch(r.phone || r.name); setRecipientResults([]); }}
                        style={{ padding: "10px 12px", cursor: "pointer", borderBottom: "1px solid var(--glass-border)", background: selectedRecipient?.phone === r.phone ? "rgba(0,195,122,0.15)" : "transparent" }}
                      >
                        <span style={{ fontWeight: 600 }}>{r.name || "—"}</span>
                        <span dir="ltr" style={{ marginRight: 8, color: "var(--v2-gray-400)", fontSize: 13 }}>{r.phone}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {selectedRecipient && (
                  <p style={{ marginTop: 8, fontSize: 13, color: "var(--v2-gray-400)" }}>
                    נבחר: <span style={{ fontWeight: 600 }}>{selectedRecipient.name || "—"}</span> <span dir="ltr">{selectedRecipient.phone}</span>
                  </p>
                )}
              </div>

              {(waStatus?.connected) && (
                <div>
                  <label style={{ display: "block", fontSize: 12, color: "var(--v2-gray-500)", marginBottom: 6 }}>ערוץ</label>
                  <div className="inbox-send-tabs" style={{ display: "flex", gap: 8 }}>
                    <button type="button" className={newMsgChannel === "sms" ? "active" : ""} onClick={() => setNewMsgChannel("sms")} style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid var(--glass-border)", background: newMsgChannel === "sms" ? "var(--v2-primary)" : "transparent", color: newMsgChannel === "sms" ? "var(--v2-dark)" : "var(--v2-gray-400)", cursor: "pointer" }}>💬 SMS</button>
                    <button type="button" className={newMsgChannel === "whatsapp" ? "active" : ""} onClick={() => setNewMsgChannel("whatsapp")} style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid var(--glass-border)", background: newMsgChannel === "whatsapp" ? "var(--v2-primary)" : "transparent", color: newMsgChannel === "whatsapp" ? "var(--v2-dark)" : "var(--v2-gray-400)", cursor: "pointer" }}>🟢 WhatsApp</button>
                  </div>
                </div>
              )}

              {newMsgChannel === "whatsapp" && (templates || []).filter((t) => t.meta_status === "APPROVED").length > 0 && (
                <>
                  <div>
                    <label style={{ display: "block", fontSize: 12, color: "var(--v2-gray-500)", marginBottom: 6 }}>תבנית (אם אין חלון 24 שעות)</label>
                    <select value={newMsgTemplateName} onChange={(e) => setNewMsgTemplateName(e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1px solid var(--glass-border)", background: "var(--v2-dark-3)", color: "#fff" }}>
                      <option value="">בחר תבנית...</option>
                      {(templates || []).filter((t) => t.meta_status === "APPROVED").map((t) => (
                        <option key={t.id} value={t.template_name}>{t.template_name}</option>
                      ))}
                    </select>
                  </div>
                  {newMsgTemplateName && (() => {
                    const t = (templates || []).find((x) => x.template_name === newMsgTemplateName);
                    const n = extractVariables(t?.components);
                    if (n === 0) return null;
                    return (
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {Array.from({ length: n }, (_, i) => i + 1).map((i) => (
                          <input key={i} placeholder={`משתנה {{${i}}}`} value={newMsgTemplateVars[i] || ""} onChange={(e) => setNewMsgTemplateVars((v) => ({ ...v, [i]: e.target.value }))} style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid var(--glass-border)", background: "var(--v2-dark-3)", color: "#fff" }} />
                        ))}
                      </div>
                    );
                  })()}
                </>
              )}

              <div>
                <label style={{ display: "block", fontSize: 12, color: "var(--v2-gray-500)", marginBottom: 6 }}>הודעה</label>
                {(newMsgChannel === "sms" || (newMsgChannel === "whatsapp" && (!newMsgTemplateName || (waStatus?.active_sessions_count || 0) > 0))) && (
                  <>
                    <textarea
                      placeholder="כתוב הודעה..."
                      value={newMsgMessage}
                      onChange={(e) => setNewMsgMessage(e.target.value)}
                      rows={3}
                      maxLength={612}
                      dir="rtl"
                      style={{ width: "100%", padding: 12, borderRadius: 8, border: "1px solid var(--glass-border)", background: "var(--v2-dark-3)", color: "#fff", resize: "none" }}
                    />
                    {newMsgChannel === "sms" && newMsgMessage.length > 0 && (
                      <div className="inbox-char-count" style={{ fontSize: 11, color: "var(--v2-gray-500)", marginTop: 4 }}>
                        {newMsgMessage.length <= 160 ? 160 - newMsgMessage.length : 153 - ((newMsgMessage.length - 160) % 153)} תווים • {newMsgMessage.length <= 160 ? 1 : Math.ceil(newMsgMessage.length / 153)} SMS
                      </div>
                    )}
                  </>
                )}
              </div>

              <button
                className="btn btn--primary"
                disabled={!selectedRecipient?.phone || newMsgSending || (newMsgChannel === "sms" && !newMsgMessage.trim()) || (newMsgChannel === "whatsapp" && !newMsgTemplateName && !newMsgMessage.trim())}
                onClick={async () => {
                  if (!selectedRecipient?.phone || !session?.access_token || !businessId) return;
                  const useTemplate = newMsgChannel === "whatsapp" && newMsgTemplateName;
                  if (newMsgChannel === "sms" && !newMsgMessage.trim()) return toast.error("הכנס הודעה");
                  if (newMsgChannel === "whatsapp" && !useTemplate && !newMsgMessage.trim()) return toast.error("הכנס הודעה או בחר תבנית");
                  setNewMsgSending(true);
                  try {
                    const createRes = await fetch(`${API_BASE}/api/inbox/conversations`, {
                      method: "POST",
                      headers: authHeaders(),
                      body: JSON.stringify({ business_id: businessId, customer_phone: selectedRecipient.phone, channel: newMsgChannel }),
                    });
                    const convData = await createRes.json().catch(() => ({}));
                    if (!createRes.ok) throw new Error(convData.error || "שגיאה ביצירת שיחה");
                    const convId = convData.id;
                    const sendBody = { channel: newMsgChannel, target_conversation_id: convId };
                    if (newMsgChannel === "sms") sendBody.message = newMsgMessage.trim();
                    else {
                      if (useTemplate) {
                        sendBody.template_name = newMsgTemplateName;
                        sendBody.template_variables = Object.keys(newMsgTemplateVars).sort().map((k) => newMsgTemplateVars[k]);
                      } else sendBody.message = newMsgMessage.trim();
                    }
                    const sendRes = await fetch(`${API_BASE}/api/inbox/conversations/${convId}/send`, {
                      method: "POST",
                      headers: authHeaders(),
                      body: JSON.stringify(sendBody),
                    });
                    const sendData = await sendRes.json().catch(() => ({}));
                    if (!sendRes.ok) throw new Error(sendData.message || sendData.error || "שגיאה בשליחה");
                    toast.success("נשלח");
                    setShowNewMessage(false);
                    setSelectedRecipient(null);
                    setRecipientSearch("");
                    setNewMsgMessage("");
                    setNewMsgTemplateName("");
                    setNewMsgTemplateVars({});
                    await refetchConversations();
                    setSelectedConv({ id: convId, customer_phone: selectedRecipient.phone, channel: newMsgChannel });
                  } catch (e) {
                    toast.error(e.message);
                  } finally {
                    setNewMsgSending(false);
                  }
                }}
              >
                {newMsgSending ? <RefreshCw size={16} className="spin" /> : <Send size={16} />} שלח
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
