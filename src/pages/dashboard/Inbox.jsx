import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'

const API_BASE = import.meta.env.VITE_API_URL || 'https://axess-production.up.railway.app'

export default function Inbox() {
  const { session, user } = useAuth()
  const [conversations, setConversations] = useState([])
  const [queues, setQueues] = useState([])
  const [agents, setAgents] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [messages, setMessages] = useState([])
  const [draft, setDraft] = useState('')
  const [messageMode, setMessageMode] = useState('message')
  const [loading, setLoading] = useState(false)
  const [isOnline, setIsOnline] = useState(true)

  const headers = useMemo(
    () =>
      session?.access_token
        ? { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' }
        : {},
    [session?.access_token]
  )

  const loadQueues = useCallback(async () => {
    if (!session?.access_token) return
    const r = await fetch(`${API_BASE}/api/inbox/queues`, { headers })
    if (!r.ok) return
    const data = await r.json()
    setQueues(data.queues || [])
  }, [session?.access_token, headers])

  const loadAgents = useCallback(async () => {
    if (!session?.access_token) return
    const r = await fetch(`${API_BASE}/api/inbox/agents`, { headers })
    if (!r.ok) return
    const data = await r.json()
    setAgents(data.agents || [])
  }, [session?.access_token, headers])

  const loadConversations = useCallback(async () => {
    if (!session?.access_token) return
    const r = await fetch(`${API_BASE}/api/inbox/conversations`, { headers })
    if (!r.ok) return
    const data = await r.json()
    setConversations(data.conversations || [])
  }, [session?.access_token, headers])

  const loadMessages = useCallback(
    async (id) => {
      if (!id || !session?.access_token) return
      const r = await fetch(`${API_BASE}/api/inbox/conversations/${id}/messages`, { headers })
      if (!r.ok) return
      const data = await r.json()
      setMessages(data.messages || [])
    },
    [session?.access_token, headers]
  )

  useEffect(() => {
    loadConversations()
    loadQueues()
    loadAgents()
  }, [loadConversations, loadQueues, loadAgents])

  useEffect(() => {
    const me = agents.find((a) => a.email === user?.email || a.email === user?.user_metadata?.email)
    if (me) setIsOnline(!!me.is_online)
  }, [agents, user])

  useEffect(() => {
    if (selectedId) loadMessages(selectedId)
  }, [selectedId, loadMessages])

  const updateAgentStatus = async (online) => {
    if (!session?.access_token) return
    setIsOnline(online)
    const r = await fetch(`${API_BASE}/api/inbox/agents/status`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ is_online: online }),
    })
    if (!r.ok) return
    loadAgents()
  }

  const send = async () => {
    const text = draft.trim()
    if (!text || !selectedId) return
    setLoading(true)
    try {
      if (messageMode === 'note') {
        const r = await fetch(`${API_BASE}/api/inbox/conversations/${selectedId}/notes`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ content: text, is_pinned: false, mentioned_agents: [] }),
        })
        if (!r.ok) throw new Error('note failed')
        setDraft('')
        await loadMessages(selectedId)
      } else {
        const r = await fetch(`${API_BASE}/api/inbox/conversations/${selectedId}/send`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ channel: 'whatsapp', message: text }),
        })
        if (!r.ok) {
          const err = await r.json().catch(() => ({}))
          throw new Error(err.message || err.error || 'send failed')
        }
        setDraft('')
        await loadMessages(selectedId)
        await loadConversations()
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const selected = conversations.find((c) => c.id === selectedId)

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        direction: 'rtl',
        fontFamily: 'system-ui, sans-serif',
        background: 'var(--bg, #0f1115)',
        color: 'var(--text, #e5e7eb)',
      }}
    >
      <aside
        style={{
          width: 260,
          borderLeft: '1px solid var(--glass-border, #334155)',
          display: 'flex',
          flexDirection: 'column',
          padding: 12,
          gap: 12,
          background: 'var(--card, #1a1d24)',
        }}
      >
        <div style={{ fontWeight: 700, fontSize: 14 }}>תורים</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, overflow: 'auto' }}>
          {queues.map((q) => (
            <div
              key={q.queue_name || '__default__'}
              style={{
                padding: '8px 10px',
                borderRadius: 8,
                background: 'var(--glass, rgba(255,255,255,0.06))',
                fontSize: 13,
              }}
            >
              <div style={{ fontWeight: 600 }}>{q.queue_name || '(ללא תור)'}</div>
              <div style={{ opacity: 0.85, marginTop: 4 }}>
                סה״כ {q.total} · לא מוקצה {q.unassigned} · מוקצה {q.assigned}
              </div>
              {q.avg_wait_minutes != null ? (
                <div style={{ opacity: 0.7, marginTop: 2, fontSize: 12 }}>ממוצע המתנה ~{q.avg_wait_minutes} דק׳</div>
              ) : null}
            </div>
          ))}
          {!queues.length ? <div style={{ fontSize: 13, opacity: 0.7 }}>אין נתוני תורים</div> : null}
        </div>

        <div style={{ fontWeight: 700, fontSize: 14, marginTop: 8 }}>שיחות</div>
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {conversations.map((c) => (
            <button
              type="button"
              key={c.id}
              onClick={() => setSelectedId(c.id)}
              style={{
                textAlign: 'right',
                padding: '8px 10px',
                borderRadius: 8,
                border: 'none',
                cursor: 'pointer',
                background: selectedId === c.id ? 'var(--primary, #6366f1)' : 'var(--glass, rgba(255,255,255,0.06))',
                color: selectedId === c.id ? '#fff' : 'var(--text, #e5e7eb)',
                fontSize: 13,
              }}
            >
              <div style={{ fontWeight: 600 }}>{c.customer_phone}</div>
              <div style={{ opacity: 0.85, fontSize: 12 }}>{c.channel} · {c.status}</div>
            </button>
          ))}
        </div>
      </aside>

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <header
          style={{
            padding: '12px 16px',
            borderBottom: '1px solid var(--glass-border, #334155)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            flexWrap: 'wrap',
            background: 'var(--card, #1a1d24)',
          }}
        >
          <div style={{ fontWeight: 700 }}>
            אינבוקס {selected ? `· ${selected.customer_phone}` : ''}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: isOnline ? '#22C55E' : '#9CA3AF',
              }}
            />
            <select
              value={isOnline ? 'online' : 'away'}
              onChange={(e) => updateAgentStatus(e.target.value === 'online')}
              style={{
                padding: '6px 10px',
                borderRadius: 8,
                border: '1px solid var(--glass-border, #334155)',
                background: 'var(--card, #1a1d24)',
                color: 'inherit',
              }}
            >
              <option value="online">זמין</option>
              <option value="away">לא זמין</option>
            </select>
          </div>
        </header>

        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          {!selectedId ? (
            <div style={{ opacity: 0.7 }}>בחר שיחה</div>
          ) : (
            messages.map((msg) =>
              msg.is_internal ? (
                <div
                  key={msg.id}
                  style={{
                    alignSelf: 'flex-start',
                    maxWidth: '85%',
                    background: 'rgba(245,158,11,0.15)',
                    border: '1px solid rgba(245,158,11,0.3)',
                    borderRadius: 8,
                    padding: '8px 12px',
                    fontSize: 13,
                  }}
                >
                  🔒 <strong>{msg.agent_name || 'סוכן'}</strong>: {msg.content}
                </div>
              ) : (
                <div
                  key={msg.id}
                  style={{
                    alignSelf: msg.direction === 'out' ? 'flex-end' : 'flex-start',
                    maxWidth: '85%',
                    background: 'var(--glass, rgba(255,255,255,0.06))',
                    borderRadius: 8,
                    padding: '8px 12px',
                    fontSize: 13,
                    border: '1px solid var(--glass-border, #334155)',
                  }}
                >
                  {msg.content}
                </div>
              )
            )
          )}
        </div>

        {selectedId ? (
          <footer style={{ padding: 16, borderTop: '1px solid var(--glass-border, #334155)', background: 'var(--card, #1a1d24)' }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <button
                type="button"
                onClick={() => setMessageMode('message')}
                style={{
                  padding: '4px 12px',
                  borderRadius: 20,
                  border: 'none',
                  background: messageMode === 'message' ? 'var(--primary, #6366f1)' : 'var(--glass, rgba(255,255,255,0.06))',
                  color: messageMode === 'message' ? '#fff' : 'var(--text, #e5e7eb)',
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                💬 הודעה ל-WA
              </button>
              <button
                type="button"
                onClick={() => setMessageMode('note')}
                style={{
                  padding: '4px 12px',
                  borderRadius: 20,
                  border: 'none',
                  background: messageMode === 'note' ? '#F59E0B' : 'var(--glass, rgba(255,255,255,0.06))',
                  color: messageMode === 'note' ? '#fff' : 'var(--text, #e5e7eb)',
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                🔒 הערה פנימית
              </button>
            </div>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={3}
              style={{
                background: messageMode === 'note' ? 'rgba(245,158,11,0.1)' : 'var(--card, #1a1d24)',
                border: `1px solid ${messageMode === 'note' ? '#F59E0B' : 'var(--glass-border, #334155)'}`,
                borderRadius: 8,
                padding: 10,
                width: '100%',
                fontFamily: 'inherit',
                resize: 'none',
                color: 'inherit',
                boxSizing: 'border-box',
              }}
              placeholder={
                messageMode === 'note' ? '🔒 הערה פנימית — הצוות בלבד רואה זאת' : 'הקלד הודעה...'
              }
            />
            <button
              type="button"
              disabled={loading || !draft.trim()}
              onClick={send}
              style={{
                marginTop: 8,
                padding: '8px 16px',
                borderRadius: 8,
                border: 'none',
                cursor: loading ? 'wait' : 'pointer',
                background: 'var(--primary, #6366f1)',
                color: '#fff',
              }}
            >
              שלח
            </button>
          </footer>
        ) : null}
      </main>
    </div>
  )
}
