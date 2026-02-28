import Badge from './Badge'

const STATUS_MAP = {
  draft:     { label: 'טיוטה',    variant: 'draft' },
  scheduled: { label: 'מתוזמן',   variant: 'scheduled' },
  sending:   { label: 'בשליחה',   variant: 'warning' },
  sent:      { label: 'נשלח',     variant: 'sent' },
  failed:    { label: 'נכשל',     variant: 'failed' },
  cancelled: { label: 'בוטל',     variant: 'default' },
}

export default function CampaignStatusBadge({ status }) {
  const s = STATUS_MAP[status] || STATUS_MAP.draft
  return <Badge variant={s.variant}>{s.label}</Badge>
}
