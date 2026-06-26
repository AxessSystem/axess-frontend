import { useEffect, useMemo, useState } from 'react'
import CustomSelect from '@/components/ui/CustomSelect'
import FormPhoneInput from '@/components/ui/FormPhoneInput'
import StepIndicator from '@/components/ui/StepIndicator'
import MultiSelect from '@/components/ui/MultiSelect'
import InfoTooltip from '@/components/ui/InfoTooltip'
import { validateIsraeliPhone } from '@/utils/validation'

const API_BASE = import.meta.env.VITE_API_URL || 'https://api.axess.pro'

const ROLE_OPTIONS = [
  { value: 'ספק / נותן שירות בתעשיית האירועים', label: 'ספק / נותן שירות בתעשיית האירועים' },
  { value: 'מזמין מקצועי (חברה / ארגון / מוסד)', label: 'מזמין מקצועי (חברה / ארגון / מוסד)' },
  { value: 'מפיק — גם ספק וגם מזמין', label: 'מפיק — גם ספק וגם מזמין' },
  { value: 'מתכנן/ת אירוע פרטי', label: 'מתכנן/ת אירוע פרטי' },
  { value: 'מתעניין/ת — המסיבה והאירוע', label: 'מתעניין/ת — המסיבה והאירוע' },
]

const EMPLOYMENT_INTEREST_OPTIONS = [
  { value: 'seeking_work', label: 'מחפש עבודה / פרויקטים' },
  { value: 'hiring', label: 'מגייס לצוות שלי' },
]

const BUYER_TYPES_OPTIONS = [
  { value: 'private', label: 'פרטי' },
  { value: 'business', label: 'עסקי' },
  { value: 'institutional', label: 'מוסדי' },
  { value: 'producer', label: 'מפיק' },
]

const CONNECT_OPTIONS = [
  { value: 'כן — פתוח לחלוטין', label: 'כן — פתוח לחלוטין' },
  { value: 'כן — רק עם אישורי שלי', label: 'כן — רק עם אישורי שלי' },
  { value: 'לא כרגע', label: 'לא כרגע' },
]

const HEAR_ABOUT_OPTIONS = [
  { value: 'פייסבוק', label: 'פייסבוק' },
  { value: 'אינסטגרם', label: 'אינסטגרם' },
  { value: 'חבר/קולגה', label: 'חבר/קולגה' },
  { value: 'קבוצת וואטסאפ', label: 'קבוצת וואטסאפ' },
  { value: 'לינקדאין', label: 'לינקדאין' },
  { value: 'אחר', label: 'אחר' },
]

const YEARS_ACTIVE_OPTIONS = [
  { value: 'פחות משנה', label: 'פחות משנה' },
  { value: '1-3 שנים', label: '1-3 שנים' },
  { value: '3-7 שנים', label: '3-7 שנים' },
  { value: '7-15 שנים', label: '7-15 שנים' },
  { value: '15+ שנים', label: '15+ שנים' },
]

const REGION_OPTIONS = [
  { value: 'north', label: 'צפון' },
  { value: 'sharon', label: 'שרון' },
  { value: 'gush_dan', label: 'גוש דן' },
  { value: 'shephelah', label: 'שפלה' },
  { value: 'jerusalem', label: 'ירושלים' },
  { value: 'south', label: 'דרום' },
  { value: 'nationwide', label: 'ארצי' },
]

const TRAVEL_OPTIONS = [
  { value: '30km', label: 'עד 30 ק״מ' },
  { value: '60km', label: 'עד 60 ק״מ' },
  { value: 'unlimited', label: 'ללא הגבלה' },
]

const EVENT_SIZE_OPTIONS = [
  { value: 'under_100', label: 'עד 100 איש' },
  { value: '100_300', label: '100-300' },
  { value: '300_1000', label: '300-1000' },
  { value: 'over_1000', label: '1000+' },
]

const EVENT_TYPE_OPTIONS = [
  { group: 'אירועי בידור ותרבות' },
  { value: 'festivals', label: 'פסטיבלים' },
  { value: 'parties', label: 'מסיבות' },
  { value: 'concerts', label: 'הופעות' },
  { value: 'lectures', label: 'הרצאות' },
  { value: 'masterclass', label: 'כיתות אמן' },
  { value: 'workshops', label: 'סדנאות' },
  { value: 'shows', label: 'מופעי בידור' },
  { value: 'standup', label: 'סטנדאפ' },
  { value: 'theater', label: 'הצגות' },
  { group: 'אירועי ילדים ונוער' },
  { value: 'activities', label: 'הפעלות ופעילויות' },
  { value: 'clubs', label: 'חוגים' },
  { value: 'kids_entertainment', label: 'מפעילים לילדים' },
  { value: 'youth_events', label: 'אירועי נוער' },
  { group: 'אירועים עסקיים וארגוניים' },
  { value: 'corporate', label: 'אירועי חברה' },
  { value: 'conferences', label: 'כנסים' },
  { value: 'fun_days', label: 'ימי כיף' },
  { value: 'team_building', label: 'גיבוש' },
  { value: 'odt', label: 'ODT' },
  { value: 'happy_hour', label: 'שעה שמחה' },
  { value: 'holiday_events', label: 'אירועי חגים' },
  { value: 'ceremonies', label: 'טקסים' },
  { group: 'אירועים פרטיים' },
  { value: 'weddings', label: 'חתונות' },
  { value: 'bar_mitzvah', label: 'בר / בת מצווה' },
  { value: 'brit', label: 'בריתות' },
  { value: 'henna', label: 'חינה' },
  { value: 'mikve', label: 'מקווה' },
  { value: 'shabbat_hatan', label: 'שבת חתן' },
  { value: 'proposal', label: 'הצעות נישואין' },
  { value: 'bachelor', label: 'מסיבות רווקים/ת' },
  { value: 'birthday', label: 'ימי הולדת ויובלים' },
  { value: 'chef_dinner', label: 'ארוחות שף' },
  { value: 'graduation', label: 'מסיבות סיום' },
]

const BUYER_TYPE_OPTIONS = [
  { group: 'ארגונים ומוסדות' },
  { value: 'welfare_hr', label: 'מנהלות רווחה / משאבי אנוש' },
  { value: 'workers_committee', label: 'ועדי עובדים' },
  { value: 'government', label: 'מוסדות ממשלתיים' },
  { value: 'municipality_culture', label: 'עיריות — מחלקת תרבות' },
  { value: 'municipality_youth', label: 'עיריות — מחלקת נוער' },
  { value: 'municipality_sport', label: 'עיריות — מחלקת ספורט' },
  { value: 'municipality_young', label: 'עיריות — מחלקת צעירים' },
  { value: 'student_unions', label: 'יו"רים אגודות סטודנטים' },
  { value: 'colleges', label: 'מכללות ואוניברסיטאות' },
  { value: 'schools', label: 'רכזות בתי ספר' },
  { value: 'community_centers', label: 'מתנסים' },
  { value: 'shopping_centers', label: 'מרכזים מסחריים וקניונים' },
  { value: 'ngo', label: 'עמותות' },
  { value: 'marketing_launches', label: 'מחלקות שיווק — השקות עסקיות' },
  { group: 'חברות' },
  { value: 'production_companies', label: 'חברות הפקה' },
  { value: 'corporate_welfare', label: 'חברות — מנהלות רווחה ומשאבי אנוש' },
  { value: 'commercial_centers', label: 'מרכזים מסחריים' },
  { group: 'פרטיים ומפיקים' },
  { value: 'freelance_producers', label: 'מפיקים פרילנסרים' },
  { value: 'private_person', label: 'אנשים פרטיים' },
  { value: 'kindergartens', label: 'גני ילדים' },
  { value: 'summer_camps', label: 'קייטנות' },
]

const SUPPLIER_GOAL_OPTIONS = [
  { value: 'new_clients', label: 'לקוחות חדשים' },
  { value: 'partnerships', label: 'שותפויות עם ספקים' },
  { value: 'branding', label: 'חשיפה ומיתוג' },
  { value: 'hiring', label: 'גיוס עובדים' },
  { value: 'wants_booth', label: 'מעוניין/ת בדוכן — שלחו פרטים' },
]

const COLLAB_WITH_OPTIONS = [
  { value: 'complementary_suppliers', label: 'ספקים משלימים' },
  { value: 'same_field', label: 'ספקים מאותו תחום' },
  { value: 'corporate_buyers', label: 'מזמינים קורפורטיביים' },
  { value: 'private_buyers', label: 'מזמינים פרטיים' },
  { value: 'investors', label: 'משקיעים' },
]

const COLLAB_SCOPE_OPTIONS = [
  { value: 'single_project', label: 'פרויקט בודד' },
  { value: 'ongoing', label: 'שיתוף קבוע' },
  { value: 'both', label: 'שניהם' },
]

const WORK_TYPE_OPTIONS = [
  { value: 'freelance', label: 'פרילנס' },
  { value: 'employee', label: 'שכיר' },
  { value: 'both', label: 'שניהם' },
]

const AVAILABILITY_OPTIONS = [
  { value: 'immediate', label: 'מיידי' },
  { value: 'soon', label: 'בחודשיים הקרובים' },
  { value: 'browsing', label: 'סתם בודק' },
]

const ORG_TYPE_OPTIONS = [
  { value: 'tech', label: 'הייטק' },
  { value: 'industry', label: 'תעשייה ומסחר' },
  { value: 'public', label: 'ציבורי / מוסדי' },
  { value: 'municipality', label: 'עירייה / רשות' },
  { value: 'education', label: 'חינוך' },
  { value: 'health', label: 'בריאות' },
  { value: 'other', label: 'אחר' },
]

const ORG_SIZE_OPTIONS = [
  { value: 'under_50', label: 'עד 50 עובדים' },
  { value: '50_200', label: '50-200' },
  { value: '200_1000', label: '200-1000' },
  { value: 'over_1000', label: '1000+' },
]

const EVENTS_PER_YEAR_OPTIONS = [
  { value: '1_3', label: '1-3' },
  { value: '4_10', label: '4-10' },
  { value: '10_30', label: '10-30' },
  { value: 'over_30', label: '30+' },
]

const BUDGET_OPTIONS = [
  { value: 'under_20k', label: 'עד 20K₪' },
  { value: '20_50k', label: '20-50K₪' },
  { value: '50_150k', label: '50-150K₪' },
  { value: 'over_150k', label: '150K₪+' },
]

const BUYER_NEEDS_OPTIONS = [
  { value: 'new_suppliers', label: 'ספקים חדשים' },
  { value: 'inspiration', label: 'השראה ורעיונות' },
  { value: 'quotes', label: 'הצעות מחיר' },
  { value: 'networking', label: 'קשרים מקצועיים' },
  { value: 'all', label: 'הכל' },
]

const PRIVATE_EVENT_TYPE_OPTIONS = [
  { value: 'wedding', label: 'חתונה' },
  { value: 'bar_mitzvah', label: 'בר / בת מצווה' },
  { value: 'birthday', label: 'יובל / יום הולדת' },
  { value: 'other', label: 'אחר' },
]

const EVENT_TIMEFRAME_OPTIONS = [
  { value: '3_months', label: 'תוך 3 חודשים' },
  { value: '3_6_months', label: '3-6 חודשים' },
  { value: '6_12_months', label: '6-12 חודשים' },
  { value: 'over_year', label: 'יותר משנה' },
  { value: 'undecided', label: 'עדיין לא החלטתי' },
]

const GUEST_COUNT_OPTIONS = [
  { value: 'under_50', label: 'עד 50' },
  { value: '50_150', label: '50-150' },
  { value: '150_300', label: '150-300' },
  { value: 'over_300', label: '300+' },
]

const PRIVATE_BUDGET_OPTIONS = [
  { value: 'under_50k', label: 'עד 50K₪' },
  { value: '50_100k', label: '50-100K₪' },
  { value: '100_200k', label: '100-200K₪' },
  { value: 'over_200k', label: '200K₪+' },
  { value: 'prefer_not', label: 'מעדיף/ת לא לציין' },
]

const MISSING_SUPPLIERS_OPTIONS = [
  { value: 'venue', label: 'מקום' },
  { value: 'catering', label: 'קייטרינג' },
  { value: 'dj', label: 'DJ / מוזיקה' },
  { value: 'photography', label: 'צילום' },
  { value: 'production', label: 'מפיק' },
  { value: 'design', label: 'עיצוב ותפאורה' },
  { value: 'all_open', label: 'עדיין הכל פתוח' },
]

const ROLE_MAP = {
  'ספק / נותן שירות בתעשיית האירועים': ['supplier'],
  'מזמין מקצועי (חברה / ארגון / מוסד)': ['buyer_corporate'],
  'מפיק — גם ספק וגם מזמין': ['supplier', 'buyer_corporate'],
  'מתכנן/ת אירוע פרטי': ['buyer_private'],
  'מתעניין/ת — המסיבה והאירוע': ['party'],
}

function getMappedRoles(hebrewRoles) {
  const roles = new Set()
  for (const r of hebrewRoles || []) {
    for (const mapped of ROLE_MAP[r] || []) roles.add(mapped)
  }
  return [...roles]
}

function buildSteps(participantRoles) {
  const mapped = getMappedRoles(participantRoles)
  const steps = ['זיהוי']
  if (mapped.includes('supplier')) steps.push('פרטי ספק')
  if (mapped.includes('buyer_corporate')) steps.push('פרטי מזמין')
  if (mapped.includes('buyer_private')) steps.push('אירוע פרטי')
  steps.push('אישור')
  return steps
}

function flattenOptions(options) {
  return (options || []).filter((o) => o.value != null)
}

function labelOf(options, value) {
  const flat = flattenOptions(options)
  if (!value) return '—'
  if (Array.isArray(value)) {
    return value.map((v) => flat.find((o) => o.value === v)?.label || v).join(', ') || '—'
  }
  return flat.find((o) => o.value === value)?.label || value
}

function filterValidL2(l1Keys, l2Keys, categories) {
  const valid = new Set()
  for (const l1 of l1Keys || []) {
    for (const c of categories.l2?.[l1] || []) valid.add(c.key)
  }
  return (l2Keys || []).filter((k) => valid.has(k))
}

const INITIAL_FORM = {
  phone: '',
  first_name: '',
  last_name: '',
  participant_roles: [],
  employment_interests: [],
  buyer_types: [],
  open_to_connect: 'כן — פתוח לחלוטין',
  hear_about: '',
  sms_updates: true,
  category_l1: [],
  category_l2: [],
  category_free_text: '',
  brand_name: '',
  bio: '',
  years_active: '',
  business_city: '',
  activity_regions: [],
  travel_radius: '',
  website_url: '',
  instagram_handle: '',
  portfolio_url: '',
  event_sizes: [],
  event_types: [],
  current_buyer_types: [],
  desired_buyer_types: [],
  open_to_new_buyer_types: true,
  supplier_goals: [],
  collab_open: false,
  collab_with: [],
  collab_scope: '',
  open_positions: '',
  employment_business_type: '',
  work_type: '',
  availability: '',
  cv_url: '',
  org_name: '',
  job_title: '',
  org_type: '',
  org_size: '',
  events_per_year: '',
  avg_budget_per_event: '',
  buyer_needs: [],
  preferred_regions: [],
  works_with_categories: [],
  private_event_type: '',
  event_timeframe: '',
  guest_count: '',
  private_budget: '',
  missing_suppliers: [],
}

const inputStyle = {
  width: '100%',
  minHeight: 48,
  padding: '12px 16px',
  borderRadius: 'var(--radius-sm)',
  background: 'var(--v2-dark-2)',
  border: '1px solid var(--v2-gray-200)',
  color: '#fff',
  fontSize: 16,
  boxSizing: 'border-box',
  outline: 'none',
  fontFamily: "'DM Sans', sans-serif",
}

const selectStyle = {
  width: '100%',
  minHeight: 48,
  fontSize: 15,
  borderRadius: 'var(--radius-sm)',
}

const labelStyle = {
  display: 'block',
  fontSize: 14,
  fontWeight: 600,
  marginBottom: 8,
  color: '#fff',
}

function FieldLabel({ children, required, tooltip }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        marginBottom: 8,
      }}
    >
      <label style={{ ...labelStyle, marginBottom: 0 }}>
        {children}
        {required && <span style={{ color: '#EF4444' }}> *</span>}
      </label>
      {tooltip && <InfoTooltip text={tooltip} />}
    </div>
  )
}

function TextInput({ value, onChange, placeholder, type = 'text', maxLength, dir }) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      maxLength={maxLength}
      dir={dir}
      style={inputStyle}
    />
  )
}

function TextArea({ value, onChange, placeholder, maxLength, rows = 4 }) {
  return (
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      maxLength={maxLength}
      rows={rows}
      style={{
        ...inputStyle,
        minHeight: 100,
        resize: 'vertical',
        lineHeight: 1.5,
      }}
    />
  )
}

function Toggle({ value, onChange, label }) {
  return (
    <label
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        padding: '12px 0',
        cursor: 'pointer',
      }}
    >
      <span style={{ fontSize: 14, color: '#fff', flex: 1 }}>{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        onClick={() => onChange(!value)}
        style={{
          width: 48,
          height: 28,
          borderRadius: 999,
          border: 'none',
          background: value ? '#00C37A' : 'var(--v2-gray-600)',
          position: 'relative',
          cursor: 'pointer',
          flexShrink: 0,
          transition: 'background 0.2s',
        }}
      >
        <span
          style={{
            position: 'absolute',
            top: 3,
            right: value ? 3 : 23,
            width: 22,
            height: 22,
            borderRadius: '50%',
            background: '#fff',
            transition: 'right 0.2s',
          }}
        />
      </button>
    </label>
  )
}

function SectionTitle({ children }) {
  return (
    <h3
      style={{
        fontSize: 16,
        fontWeight: 700,
        color: 'var(--v2-primary)',
        margin: '24px 0 12px',
        paddingTop: 16,
        borderTop: '1px solid var(--v2-gray-200)',
      }}
    >
      {children}
    </h3>
  )
}

function SummaryRow({ label, value }) {
  if (!value || value === '—') return null
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 12, color: 'var(--v2-gray-400)', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 14, color: '#fff', lineHeight: 1.5 }}>{value}</div>
    </div>
  )
}

export default function IndustryRegisterPage() {
  const [form, setForm] = useState(INITIAL_FORM)
  const [currentStep, setCurrentStep] = useState(1)
  const [errors, setErrors] = useState({})
  const [categories, setCategories] = useState({ l1: [], l2: {} })
  const [loadingCategories, setLoadingCategories] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const steps = useMemo(() => buildSteps(form.participant_roles), [form.participant_roles])
  const mappedRoles = useMemo(() => getMappedRoles(form.participant_roles), [form.participant_roles])
  const stepKey = steps[currentStep - 1]

  const l2Options = useMemo(() => {
    if (!form.category_l1?.length) return []
    const merged = []
    const seen = new Set()
    for (const l1 of form.category_l1) {
      for (const c of categories.l2[l1] || []) {
        if (!seen.has(c.key)) {
          seen.add(c.key)
          merged.push({ value: c.key, label: c.label_he })
        }
      }
    }
    return merged
  }, [form.category_l1, categories.l2])

  const l1Options = useMemo(
    () => categories.l1.map((c) => ({ value: c.key, label: c.label_he })),
    [categories.l1],
  )

  const showBuyerTypes = mappedRoles.includes('buyer_corporate')
    || mappedRoles.includes('buyer_private')

  const handleCategoryL1Change = (nextL1) => {
    setForm((f) => ({
      ...f,
      category_l1: nextL1,
      category_l2: filterValidL2(nextL1, f.category_l2, categories),
    }))
  }

  const categoryL1Labels = useMemo(
    () => categories.l1.map((c) => ({ value: c.key, label: c.label_he })),
    [categories.l1],
  )

  useEffect(() => {
    fetch(`${API_BASE}/api/industry/categories`)
      .then((r) => r.json())
      .then((data) => setCategories({ l1: data.l1 || [], l2: data.l2 || {} }))
      .catch(() => setCategories({ l1: [], l2: {} }))
      .finally(() => setLoadingCategories(false))
  }, [])

  useEffect(() => {
    if (currentStep > steps.length) setCurrentStep(steps.length)
  }, [steps.length, currentStep])

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }))

  const validateStep = () => {
    const e = {}
    if (stepKey === 'זיהוי') {
      if (!validateIsraeliPhone(form.phone)) e.phone = 'מספר טלפון לא תקין'
      if (!form.first_name.trim()) e.first_name = 'שדה חובה'
      if (!form.participant_roles.length) e.participant_roles = 'יש לבחור לפחות תפקיד אחד'
    }
    if (stepKey === 'פרטי ספק') {
      if (!form.category_l1?.length) e.category_l1 = 'שדה חובה'
      if (!form.brand_name.trim()) e.brand_name = 'שדה חובה'
    }
    if (stepKey === 'פרטי מזמין') {
      if (!form.org_name.trim()) e.org_name = 'שדה חובה'
      if (!form.job_title.trim()) e.job_title = 'שדה חובה'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const goNext = () => {
    if (!validateStep()) return
    setCurrentStep((s) => Math.min(s + 1, steps.length))
  }

  const goPrev = () => setCurrentStep((s) => Math.max(s - 1, 1))

  const buildPayload = () => {
    const interests = form.employment_interests || []
    const employment_details = {}

    if (interests.includes('hiring')) {
      employment_details.open_positions = form.open_positions || null
      employment_details.business_type = form.employment_business_type || null
    }
    if (interests.includes('seeking_work')) {
      employment_details.work_type = form.work_type || null
      employment_details.availability = form.availability || null
      employment_details.cv_url = form.cv_url || null
    }
    if (interests.length) {
      employment_details.employment_interests = interests
    }
    if (form.category_l1.length > 1 || form.category_l2.length > 1) {
      employment_details.categories_l1 = form.category_l1.length ? form.category_l1 : null
      employment_details.categories_l2 = form.category_l2.length ? form.category_l2 : null
    }

    let instagram = form.instagram_handle?.trim() || null
    if (instagram && !instagram.startsWith('@')) instagram = `@${instagram.replace(/^@/, '')}`

    let employment_interest = null
    if (interests.includes('seeking_work')) {
      employment_interest = 'כן — מחפש עבודה / פרויקטים'
    } else if (interests.includes('hiring')) {
      employment_interest = 'כן — מגייס'
    }

    let employment_role = null
    if (interests.includes('hiring') && interests.includes('seeking_work')) {
      employment_role = 'both'
    } else if (interests.includes('hiring')) {
      employment_role = 'hiring'
    } else if (interests.includes('seeking_work')) {
      employment_role = 'seeking_work'
    }

    return {
      phone: form.phone.replace(/\D/g, ''),
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim() || null,
      participant_roles: form.participant_roles,
      buyer_types: form.buyer_types.length ? form.buyer_types : null,
      employment_interest,
      open_to_connect: form.open_to_connect || null,
      hear_about: form.hear_about || null,
      sms_updates: form.sms_updates,
      brand_name: form.brand_name.trim() || null,
      category_l1: form.category_l1[0] || null,
      category_l2: form.category_l2[0] || null,
      category_free_text: form.category_free_text.trim() || null,
      bio: form.bio.trim() || null,
      years_active: form.years_active || null,
      business_city: form.business_city.trim() || null,
      activity_regions: form.activity_regions.length ? form.activity_regions : null,
      travel_radius: form.travel_radius || null,
      website_url: form.website_url.trim() || null,
      instagram_handle: instagram,
      portfolio_url: form.portfolio_url.trim() || null,
      event_sizes: form.event_sizes.length ? form.event_sizes : null,
      event_types: form.event_types.length ? form.event_types : null,
      supplier_goals: form.supplier_goals.length ? form.supplier_goals : null,
      collab_open: form.collab_open,
      collab_with: form.collab_open && form.collab_with.length ? form.collab_with : null,
      collab_scope: form.collab_open && form.collab_scope ? form.collab_scope : null,
      current_buyer_types: form.current_buyer_types.length ? form.current_buyer_types : null,
      desired_buyer_types: form.desired_buyer_types.length ? form.desired_buyer_types : null,
      open_to_new_buyer_types: form.open_to_new_buyer_types,
      employment_role,
      employment_details: Object.keys(employment_details).length ? employment_details : null,
      org_name: form.org_name.trim() || null,
      job_title: form.job_title.trim() || null,
      org_type: form.org_type || null,
      org_size: form.org_size || null,
      events_per_year: form.events_per_year || null,
      avg_budget_per_event: form.avg_budget_per_event || null,
      buyer_needs: form.buyer_needs.length ? form.buyer_needs : null,
      preferred_regions: form.preferred_regions.length ? form.preferred_regions : null,
      works_with_categories: form.works_with_categories.length ? form.works_with_categories : null,
      private_event_type: form.private_event_type || null,
      event_timeframe: form.event_timeframe || null,
      guest_count: form.guest_count || null,
      private_budget: form.private_budget || null,
      missing_suppliers: form.missing_suppliers.length ? form.missing_suppliers : null,
    }
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    setSubmitError('')
    try {
      const res = await fetch(`${API_BASE}/api/industry/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload()),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'שגיאה בהרשמה')
      setSuccess(true)
    } catch (err) {
      setSubmitError(err.message || 'שגיאה בהרשמה, נסו שוב')
    } finally {
      setSubmitting(false)
    }
  }

  const wantsBooth = form.supplier_goals.includes('wants_booth')

  if (success) {
    return (
      <div
        dir="rtl"
        style={{
          minHeight: '100vh',
          background: 'var(--v2-dark)',
          fontFamily: "'DM Sans', sans-serif",
          padding: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            maxWidth: 480,
            width: '100%',
            background: 'var(--v2-dark-3)',
            border: '1px solid var(--v2-gray-200)',
            borderRadius: 'var(--radius-md)',
            padding: 32,
            textAlign: 'center',
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎯</div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#fff', margin: '0 0 12px' }}>
            ברוך הבא לרשת!
          </h1>
          <p style={{ fontSize: 16, color: 'var(--v2-gray-400)', lineHeight: 1.7, margin: 0 }}>
            הפרופיל שלך נוצר. נעדכן אותך כשיהיו חיבורים רלוונטיים.
          </p>
          {wantsBooth && (
            <p style={{ fontSize: 15, color: 'var(--v2-primary)', marginTop: 16, lineHeight: 1.6 }}>
              קיבלנו את הבקשה שלך לביתן — נציג יצור איתך קשר בקרוב.
            </p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div
      dir="rtl"
      style={{
        minHeight: '100vh',
        background: 'var(--v2-dark)',
        fontFamily: "'DM Sans', sans-serif",
        padding: '16px 16px 32px',
      }}
    >
      <div style={{ maxWidth: 480, margin: '0 auto' }}>
        <div style={{ marginBottom: 24 }}>
          <StepIndicator steps={steps} currentStep={currentStep} />
        </div>

        <div
          style={{
            background: 'var(--v2-dark-3)',
            border: '1px solid var(--v2-gray-200)',
            borderRadius: 'var(--radius-md)',
            padding: 20,
            boxShadow: 'var(--shadow-md)',
          }}
        >
          {stepKey === 'זיהוי' && (
            <>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: '#fff', margin: '0 0 8px', lineHeight: 1.3 }}>
                תעשיית האירועים של ישראל — מתכנסת למקום אחד
              </h1>
              <p style={{ fontSize: 15, color: 'var(--v2-gray-400)', margin: '0 0 24px', lineHeight: 1.6 }}>
                ספקים. מזמינים. אמנים. מקומות. מפיקים. יחד — בפעם הראשונה.
              </p>

              <FieldLabel required>טלפון</FieldLabel>
              <FormPhoneInput
                value={form.phone}
                onChange={(v) => set('phone', v)}
                required
              />
              {errors.phone && (
                <p style={{ color: '#EF4444', fontSize: 12, margin: '-8px 0 12px' }}>{errors.phone}</p>
              )}

              <FieldLabel required>שם פרטי</FieldLabel>
              <TextInput
                value={form.first_name}
                onChange={(e) => set('first_name', e.target.value)}
                placeholder="שם פרטי"
              />
              {errors.first_name && (
                <p style={{ color: '#EF4444', fontSize: 12, margin: '4px 0 12px' }}>{errors.first_name}</p>
              )}

              <FieldLabel>שם משפחה</FieldLabel>
              <TextInput
                value={form.last_name}
                onChange={(e) => set('last_name', e.target.value)}
                placeholder="שם משפחה"
              />

              <MultiSelect
                label="אני מגיע/ה בתור"
                required
                options={ROLE_OPTIONS}
                value={form.participant_roles}
                onChange={(v) => set('participant_roles', v)}
              />
              {errors.participant_roles && (
                <p style={{ color: '#EF4444', fontSize: 12, margin: '-8px 0 12px' }}>{errors.participant_roles}</p>
              )}

              {showBuyerTypes && (
                <MultiSelect
                  label="כמזמין, אני:"
                  options={BUYER_TYPES_OPTIONS}
                  value={form.buyer_types}
                  onChange={(v) => set('buyer_types', v)}
                />
              )}

              <FieldLabel
                tooltip={'סמן אם אתה מחפש הזדמנויות עבודה, פרויקטים חדשים,\nאו אם אתה מעסיק שמחפש כוח אדם לצוות שלך.\nניתן לסמן את שתי האפשרויות.'}
              >
                האם אתה גם מחפש/מציע הזדמנויות תעסוקה?
              </FieldLabel>
              <MultiSelect
                options={EMPLOYMENT_INTEREST_OPTIONS}
                value={form.employment_interests}
                onChange={(v) => set('employment_interests', v)}
              />

              <div style={{ marginTop: 16 }}>
                <FieldLabel
                  tooltip={'בחר את רמת הפתיחות שלך לחיבורים עם משתתפים אחרים.\nפתוח לחלוטין — כל משתתף יכול לפנות אליך ישירות.\nרק עם אישורי — תקבל בקשות חיבור ותחליט מי מאושר.\nלא כרגע — הפרופיל שלך גלוי אבל לא ניתן לפנות אליך.'}
                >
                  פתיחות לחיבורים עם משתתפים אחרים בקהילת הנטוורקינג שלנו
                </FieldLabel>
                <CustomSelect
                  value={form.open_to_connect}
                  onChange={(v) => set('open_to_connect', v)}
                  options={CONNECT_OPTIONS}
                  style={selectStyle}
                />
              </div>

              <div style={{ marginTop: 16 }}>
                <FieldLabel>איך שמעת עלינו</FieldLabel>
                <CustomSelect
                  value={form.hear_about}
                  onChange={(v) => set('hear_about', v)}
                  options={HEAR_ABOUT_OPTIONS}
                  placeholder="בחר..."
                  style={selectStyle}
                />
              </div>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  marginTop: 20,
                  cursor: 'pointer',
                  fontSize: 14,
                  color: '#fff',
                }}
              >
                <input
                  type="checkbox"
                  checked={form.sms_updates}
                  onChange={(e) => set('sms_updates', e.target.checked)}
                  style={{ width: 18, height: 18, accentColor: '#00C37A' }}
                />
                קבלת עדכונים ב-SMS
              </label>
            </>
          )}

          {stepKey === 'פרטי ספק' && (
            <>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: '#fff', margin: '0 0 20px' }}>
                פרטי ספק
              </h2>

              <SectionTitle>קטגוריות</SectionTitle>
              <FieldLabel required>קטגוריה ראשית</FieldLabel>
              <MultiSelect
                options={l1Options}
                value={form.category_l1}
                onChange={handleCategoryL1Change}
              />
              {errors.category_l1 && (
                <p style={{ color: '#EF4444', fontSize: 12, margin: '4px 0 12px' }}>{errors.category_l1}</p>
              )}

              {form.category_l1.length > 0 && l2Options.length > 0 && (
                <>
                  <FieldLabel>תחום התמחות</FieldLabel>
                  <MultiSelect
                    options={l2Options}
                    value={form.category_l2}
                    onChange={(v) => set('category_l2', v)}
                  />
                </>
              )}

              <FieldLabel>תאר את הנישה שלך במילים שלך</FieldLabel>
              <TextArea
                value={form.category_free_text}
                onChange={(e) => set('category_free_text', e.target.value)}
                placeholder="עד 150 תווים"
                maxLength={150}
              />

              <SectionTitle>מותג</SectionTitle>
              <FieldLabel required>שם המותג / העסק</FieldLabel>
              <TextInput
                value={form.brand_name}
                onChange={(e) => set('brand_name', e.target.value)}
                placeholder="שם המותג"
              />
              {errors.brand_name && (
                <p style={{ color: '#EF4444', fontSize: 12, margin: '4px 0 12px' }}>{errors.brand_name}</p>
              )}

              <FieldLabel>תיאור קצר</FieldLabel>
              <TextArea
                value={form.bio}
                onChange={(e) => set('bio', e.target.value)}
                placeholder="עד 150 תווים"
                maxLength={150}
              />

              <FieldLabel>שנות פעילות</FieldLabel>
              <CustomSelect
                value={form.years_active}
                onChange={(v) => set('years_active', v)}
                options={YEARS_ACTIVE_OPTIONS}
                placeholder="בחר..."
                style={selectStyle}
              />

              <SectionTitle>מיקום ופעילות</SectionTitle>
              <FieldLabel>עיר הפעילות</FieldLabel>
              <TextInput
                value={form.business_city}
                onChange={(e) => set('business_city', e.target.value)}
                placeholder="עיר"
              />

              <MultiSelect
                label="אזורי פעילות"
                options={REGION_OPTIONS}
                value={form.activity_regions}
                onChange={(v) => set('activity_regions', v)}
              />

              <FieldLabel>נכון לנסוע עד</FieldLabel>
              <CustomSelect
                value={form.travel_radius}
                onChange={(v) => set('travel_radius', v)}
                options={TRAVEL_OPTIONS}
                placeholder="בחר..."
                style={selectStyle}
              />

              <SectionTitle>לינקים (אופציונלי)</SectionTitle>
              <FieldLabel>אתר</FieldLabel>
              <TextInput
                value={form.website_url}
                onChange={(e) => set('website_url', e.target.value)}
                placeholder="https://"
                type="url"
                dir="ltr"
              />

              <FieldLabel>אינסטגרם</FieldLabel>
              <div style={{ position: 'relative' }}>
                <span
                  style={{
                    position: 'absolute',
                    right: 14,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--v2-gray-400)',
                    fontSize: 16,
                  }}
                >
                  @
                </span>
                <TextInput
                  value={form.instagram_handle.replace(/^@/, '')}
                  onChange={(e) => set('instagram_handle', e.target.value.replace(/^@/, ''))}
                  placeholder="username"
                  dir="ltr"
                />
              </div>

              <FieldLabel>תיק עבודות / showreel</FieldLabel>
              <TextInput
                value={form.portfolio_url}
                onChange={(e) => set('portfolio_url', e.target.value)}
                placeholder="https://"
                type="url"
                dir="ltr"
              />

              <SectionTitle>התמחות</SectionTitle>
              <MultiSelect
                label="גודל אירועים"
                options={EVENT_SIZE_OPTIONS}
                value={form.event_sizes}
                onChange={(v) => set('event_sizes', v)}
              />

              <MultiSelect
                label="סוגי אירועים"
                options={EVENT_TYPE_OPTIONS}
                value={form.event_types}
                onChange={(v) => set('event_types', v)}
              />

              <SectionTitle>מזמינים</SectionTitle>
              <MultiSelect
                label="עם מי אתה עובד בדרך כלל"
                options={BUYER_TYPE_OPTIONS}
                value={form.current_buyer_types}
                onChange={(v) => set('current_buyer_types', v)}
              />

              <MultiSelect
                label="לאן תרצה חשיפה נוספת"
                options={BUYER_TYPE_OPTIONS}
                value={form.desired_buyer_types}
                onChange={(v) => set('desired_buyer_types', v)}
              />

              <Toggle
                label="פתוח לסוגי מזמינים חדשים?"
                value={form.open_to_new_buyer_types}
                onChange={(v) => set('open_to_new_buyer_types', v)}
              />

              <SectionTitle>מטרות</SectionTitle>
              <MultiSelect
                label="מה אתה מחפש באירוע"
                options={SUPPLIER_GOAL_OPTIONS}
                value={form.supplier_goals}
                onChange={(v) => set('supplier_goals', v)}
              />

              <SectionTitle>שיתופי פעולה</SectionTitle>
              <Toggle
                label="פתוח לשיתופי פעולה?"
                value={form.collab_open}
                onChange={(v) => set('collab_open', v)}
              />

              {form.collab_open && (
                <>
                  <MultiSelect
                    label="עם מי?"
                    options={COLLAB_WITH_OPTIONS}
                    value={form.collab_with}
                    onChange={(v) => set('collab_with', v)}
                  />

                  <FieldLabel>היקף</FieldLabel>
                  <CustomSelect
                    value={form.collab_scope}
                    onChange={(v) => set('collab_scope', v)}
                    options={COLLAB_SCOPE_OPTIONS}
                    placeholder="בחר..."
                    style={selectStyle}
                  />
                </>
              )}

              {form.employment_interests.includes('hiring') && (
                <>
                  <SectionTitle>גיוס</SectionTitle>
                  <FieldLabel>תפקידים פתוחים</FieldLabel>
                  <TextArea
                    value={form.open_positions}
                    onChange={(e) => set('open_positions', e.target.value)}
                    placeholder="תאר את התפקידים הפתוחים"
                  />
                  <FieldLabel>סוג עסק</FieldLabel>
                  <TextInput
                    value={form.employment_business_type}
                    onChange={(e) => set('employment_business_type', e.target.value)}
                    placeholder="סוג העסק"
                  />
                </>
              )}

              {form.employment_interests.includes('seeking_work') && (
                <>
                  <SectionTitle>חיפוש עבודה</SectionTitle>
                  <FieldLabel>סוג עבודה מבוקשת</FieldLabel>
                  <CustomSelect
                    value={form.work_type}
                    onChange={(v) => set('work_type', v)}
                    options={WORK_TYPE_OPTIONS}
                    placeholder="בחר..."
                    style={selectStyle}
                  />
                  <FieldLabel>זמינות</FieldLabel>
                  <CustomSelect
                    value={form.availability}
                    onChange={(v) => set('availability', v)}
                    options={AVAILABILITY_OPTIONS}
                    placeholder="בחר..."
                    style={selectStyle}
                  />
                  <FieldLabel>קישור ל-CV / תיק עבודות</FieldLabel>
                  <TextInput
                    value={form.cv_url}
                    onChange={(e) => set('cv_url', e.target.value)}
                    placeholder="https://"
                    type="url"
                    dir="ltr"
                  />
                </>
              )}
            </>
          )}

          {stepKey === 'פרטי מזמין' && (
            <>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: '#fff', margin: '0 0 20px' }}>
                פרטי מזמין מקצועי
              </h2>

              <FieldLabel required>שם החברה / הארגון</FieldLabel>
              <TextInput
                value={form.org_name}
                onChange={(e) => set('org_name', e.target.value)}
                placeholder="שם החברה"
              />
              {errors.org_name && (
                <p style={{ color: '#EF4444', fontSize: 12, margin: '4px 0 12px' }}>{errors.org_name}</p>
              )}

              <FieldLabel required>תפקיד</FieldLabel>
              <TextInput
                value={form.job_title}
                onChange={(e) => set('job_title', e.target.value)}
                placeholder="תפקידך בארגון"
              />
              {errors.job_title && (
                <p style={{ color: '#EF4444', fontSize: 12, margin: '4px 0 12px' }}>{errors.job_title}</p>
              )}

              <FieldLabel>סוג הארגון</FieldLabel>
              <CustomSelect
                value={form.org_type}
                onChange={(v) => set('org_type', v)}
                options={ORG_TYPE_OPTIONS}
                placeholder="בחר..."
                style={selectStyle}
              />

              <FieldLabel>גודל הארגון</FieldLabel>
              <CustomSelect
                value={form.org_size}
                onChange={(v) => set('org_size', v)}
                options={ORG_SIZE_OPTIONS}
                placeholder="בחר..."
                style={selectStyle}
              />

              <FieldLabel>כמה אירועים בשנה</FieldLabel>
              <CustomSelect
                value={form.events_per_year}
                onChange={(v) => set('events_per_year', v)}
                options={EVENTS_PER_YEAR_OPTIONS}
                placeholder="בחר..."
                style={selectStyle}
              />

              <FieldLabel>תקציב ממוצע לאירוע</FieldLabel>
              <CustomSelect
                value={form.avg_budget_per_event}
                onChange={(v) => set('avg_budget_per_event', v)}
                options={BUDGET_OPTIONS}
                placeholder="בחר..."
                style={selectStyle}
              />

              <MultiSelect
                label="מה אתה הכי צריך עכשיו"
                options={BUYER_NEEDS_OPTIONS}
                value={form.buyer_needs}
                onChange={(v) => set('buyer_needs', v)}
              />

              <MultiSelect
                label="אזורי גיאוגרפי מועדף"
                options={REGION_OPTIONS}
                value={form.preferred_regions}
                onChange={(v) => set('preferred_regions', v)}
              />

              <MultiSelect
                label="עם אילו קטגוריות ספקים אתה עובד"
                options={categoryL1Labels}
                value={form.works_with_categories}
                onChange={(v) => set('works_with_categories', v)}
              />
            </>
          )}

          {stepKey === 'אירוע פרטי' && (
            <>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: '#fff', margin: '0 0 20px' }}>
                פרטי אירוע פרטי
              </h2>

              <FieldLabel>סוג האירוע</FieldLabel>
              <CustomSelect
                value={form.private_event_type}
                onChange={(v) => set('private_event_type', v)}
                options={PRIVATE_EVENT_TYPE_OPTIONS}
                placeholder="בחר..."
                style={selectStyle}
              />

              <FieldLabel>מתי האירוע שלך</FieldLabel>
              <CustomSelect
                value={form.event_timeframe}
                onChange={(v) => set('event_timeframe', v)}
                options={EVENT_TIMEFRAME_OPTIONS}
                placeholder="בחר..."
                style={selectStyle}
              />

              <FieldLabel>מספר מוזמנים</FieldLabel>
              <CustomSelect
                value={form.guest_count}
                onChange={(v) => set('guest_count', v)}
                options={GUEST_COUNT_OPTIONS}
                placeholder="בחר..."
                style={selectStyle}
              />

              <FieldLabel>תקציב כולל</FieldLabel>
              <CustomSelect
                value={form.private_budget}
                onChange={(v) => set('private_budget', v)}
                options={PRIVATE_BUDGET_OPTIONS}
                placeholder="בחר..."
                style={selectStyle}
              />

              <MultiSelect
                label="מה עדיין חסר לך"
                options={MISSING_SUPPLIERS_OPTIONS}
                value={form.missing_suppliers}
                onChange={(v) => set('missing_suppliers', v)}
              />
            </>
          )}

          {stepKey === 'אישור' && (
            <>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: '#fff', margin: '0 0 20px' }}>
                אישור ושליחה
              </h2>

              <SummaryRow label="טלפון" value={form.phone} />
              <SummaryRow label="שם" value={`${form.first_name} ${form.last_name}`.trim()} />
              <SummaryRow label="תפקידים" value={form.participant_roles.join(', ')} />
              <SummaryRow
                label="סוג מזמין"
                value={labelOf(BUYER_TYPES_OPTIONS, form.buyer_types)}
              />
              <SummaryRow
                label="תעסוקה"
                value={labelOf(EMPLOYMENT_INTEREST_OPTIONS, form.employment_interests)}
              />
              <SummaryRow label="חיבורים" value={form.open_to_connect} />
              <SummaryRow label="איך שמעת" value={form.hear_about} />
              <SummaryRow label="SMS" value={form.sms_updates ? 'כן' : 'לא'} />

              {mappedRoles.includes('supplier') && (
                <>
                  <SectionTitle>ספק</SectionTitle>
                  <SummaryRow
                    label="קטגוריות"
                    value={labelOf(l1Options, form.category_l1)}
                  />
                  <SummaryRow
                    label="תחומי התמחות"
                    value={labelOf(l2Options, form.category_l2)}
                  />
                  <SummaryRow label="מותג" value={form.brand_name} />
                  <SummaryRow label="תיאור" value={form.bio} />
                  <SummaryRow label="עיר" value={form.business_city} />
                  <SummaryRow label="אזורים" value={labelOf(REGION_OPTIONS, form.activity_regions)} />
                  <SummaryRow label="סוגי אירועים" value={labelOf(EVENT_TYPE_OPTIONS, form.event_types)} />
                  <SummaryRow label="סוגי מזמינים" value={labelOf(BUYER_TYPE_OPTIONS, form.current_buyer_types)} />
                  <SummaryRow label="מטרות" value={labelOf(SUPPLIER_GOAL_OPTIONS, form.supplier_goals)} />
                </>
              )}

              {mappedRoles.includes('buyer_corporate') && (
                <>
                  <SectionTitle>מזמין מקצועי</SectionTitle>
                  <SummaryRow label="ארגון" value={form.org_name} />
                  <SummaryRow label="תפקיד" value={form.job_title} />
                  <SummaryRow label="סוג ארגון" value={labelOf(ORG_TYPE_OPTIONS, form.org_type)} />
                  <SummaryRow label="צרכים" value={labelOf(BUYER_NEEDS_OPTIONS, form.buyer_needs)} />
                </>
              )}

              {mappedRoles.includes('buyer_private') && (
                <>
                  <SectionTitle>אירוע פרטי</SectionTitle>
                  <SummaryRow label="סוג אירוע" value={labelOf(PRIVATE_EVENT_TYPE_OPTIONS, form.private_event_type)} />
                  <SummaryRow label="מועד" value={labelOf(EVENT_TIMEFRAME_OPTIONS, form.event_timeframe)} />
                  <SummaryRow label="מוזמנים" value={labelOf(GUEST_COUNT_OPTIONS, form.guest_count)} />
                  <SummaryRow label="תקציב" value={labelOf(PRIVATE_BUDGET_OPTIONS, form.private_budget)} />
                  <SummaryRow label="חסר" value={labelOf(MISSING_SUPPLIERS_OPTIONS, form.missing_suppliers)} />
                </>
              )}

              {submitError && (
                <p style={{ color: '#EF4444', fontSize: 14, marginTop: 16, textAlign: 'center' }}>
                  {submitError}
                </p>
              )}
            </>
          )}

          <div
            style={{
              display: 'flex',
              gap: 12,
              marginTop: 28,
            }}
          >
            {currentStep > 1 && (
              <button
                type="button"
                onClick={goPrev}
                style={{
                  flex: 1,
                  height: 52,
                  background: 'transparent',
                  color: '#fff',
                  border: '1px solid var(--glass-border)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 16,
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                הקודם
              </button>
            )}

            {stepKey !== 'אישור' ? (
              <button
                type="button"
                onClick={goNext}
                style={{
                  flex: 1,
                  height: 52,
                  background: '#00C37A',
                  color: '#000',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 16,
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily: "'DM Sans', sans-serif",
                  boxShadow: 'var(--shadow-glow-green)',
                }}
              >
                המשך
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                style={{
                  flex: 1,
                  height: 52,
                  background: submitting ? 'var(--v2-gray-600)' : '#00C37A',
                  color: '#000',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 16,
                  fontWeight: 700,
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  fontFamily: "'DM Sans', sans-serif",
                  boxShadow: submitting ? 'none' : 'var(--shadow-glow-green)',
                }}
              >
                {submitting ? 'שולח...' : 'סיים הרשמה'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
