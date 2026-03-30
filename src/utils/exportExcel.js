import * as XLSX from 'xlsx';

/**
 * ייצוא לExcel עם מספר גיליונות
 * @param {Array} sheets - מערך של { name, headers, rows, totals }
 * @param {string} filename - שם הקובץ
 */
export function exportToExcel(sheets, filename) {
  const wb = XLSX.utils.book_new();

  sheets.forEach(({ name, headers, rows, totals, title }) => {
    const data = [];

    // כותרת הגיליון (אם יש)
    if (title) {
      data.push([title]);
      data.push([]); // שורה ריקה
    }

    // כותרות עמודות
    data.push(headers);

    // שורות נתונים
    rows.forEach(row => data.push(row));

    // שורת סה"כ (אם יש)
    if (totals) {
      data.push([]); // שורה ריקה
      data.push(totals);
    }

    const ws = XLSX.utils.aoa_to_sheet(data);

    // רוחב עמודות אוטומטי:
    const colWidths = headers.map((h, i) => ({
      wch: Math.max(
        String(h || '').length,
        ...rows.map(r => String(r[i] || '').length)
      ) + 2
    }));
    ws['!cols'] = colWidths;

    // סגנון כותרות (bold):
    const headerRowIndex = title ? 2 : 0;
    headers.forEach((_, i) => {
      const cellRef = XLSX.utils.encode_cell({ r: headerRowIndex, c: i });
      if (ws[cellRef]) {
        ws[cellRef].s = { font: { bold: true }, fill: { fgColor: { rgb: 'E8F5E9' } } };
      }
    });

    XLSX.utils.book_append_sheet(wb, ws, name);
  });

  // הורד:
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

/**
 * ייצוא דוח אירוע מלא
 */
export function exportEventReport(event, orders, financials, reportSettings, calcExpenseVat, calcVat) {
  const EXPENSE_CATEGORIES_MAP = {
    lineup: 'ליינאפ / אמנים',
    security: 'אבטחה',
    entry_staff: 'צוות כניסות',
    bar_staff: 'צוות בר',
    management_staff: 'צוות ניהול',
    general_staff: 'צוות כללי',
    marketing: 'שיווק ופרסום',
    lighting_sound: 'תאורה והגברה',
    cleaning: 'ניקיון',
    graphics: 'גרפיקה',
    rent: 'שכירות',
    other: 'שונות / כללי',
  };

  const PAYMENT_STATUS_MAP = {
    paid: 'שולם',
    pending: 'לא שולם',
    reviewing: 'בבדיקה',
    dispute: 'מחלוקת',
  };

  const eventDate = event?.date ? new Date(event.date).toLocaleDateString('he-IL') : '';
  const filename = `דוח-${event?.title || 'אירוע'}-${eventDate}`;

  // גיליון 1 — קהל
  const audienceSheet = {
    name: 'קהל',
    title: `קהל האירוע — ${event?.title} — ${eventDate}`,
    headers: ['שם', 'שם משפחה', 'טלפון', 'מייל', 'סוג כרטיס', 'סכום', 'סטטוס', 'צ\'ק אין', 'יחצ"ן', 'אינסטגרם', 'ת"ז', 'ערוץ', 'תאריך רכישה'],
    rows: orders.map(o => [
      o.first_name || '',
      o.last_name || '',
      o.phone || '',
      o.email || '',
      o.ticket_type || 'רגיל',
      parseFloat(o.total_price || o.amount || 0),
      o.status === 'approved' || o.status === 'confirmed' ? 'מאושר' :
        o.status === 'pending' ? 'ממתין' : 'בוטל',
      o.checked_in ? 'כן' : 'לא',
      o.promoter_name || '',
      o.instagram || '',
      o.id_number || '',
      o.sales_channel || 'axess',
      o.created_at ? new Date(o.created_at).toLocaleDateString('he-IL') : ''
    ]),
    totals: ['סה"כ', '', '', '', '', orders.reduce((s, o) => s + parseFloat(o.total_price || 0), 0), '', '', '', '', '', '', '']
  };

  // גיליון 2 — הכנסות
  const axessRevenue = parseFloat(financials.axess_revenue?.total_digital || 0);
  const revenueRows = [
    ['AXESS — מכירות דיגיטל', axessRevenue, Math.round(calcVat(axessRevenue)), Math.round(axessRevenue - calcVat(axessRevenue)), 'אוטומטי'],
    ...financials.revenues.map(r => {
      const amt = parseFloat(r.amount || 0);
      return [r.label || r.source, amt, Math.round(calcVat(amt)), Math.round(amt - calcVat(amt)), 'ידני'];
    })
  ];
  const totalRev = axessRevenue + financials.revenues.reduce((s, r) => s + parseFloat(r.amount || 0), 0);
  
  const revenueSheet = {
    name: 'הכנסות',
    title: `הכנסות — ${event?.title}`,
    headers: ['מקור', 'סכום ברוטו', 'מע"מ', 'נטו', 'ערוץ'],
    rows: revenueRows,
    totals: ['סה"כ', totalRev, Math.round(calcVat(totalRev)), Math.round(totalRev - calcVat(totalRev)), '']
  };

  // גיליון 3 — הוצאות
  const expenseRows = financials.expenses.map(exp => {
    const { total, vat } = calcExpenseVat(exp);
    return [
      exp.expense_date ? new Date(exp.expense_date).toLocaleDateString('he-IL') : '',
      EXPENSE_CATEGORIES_MAP[exp.category] || exp.category,
      exp.vendor_name || exp.item_name || '',
      parseInt(exp.quantity || 1),
      parseFloat(exp.amount || 0),
      exp.vat_mode === 'included' ? 'כולל מע"מ' : exp.vat_mode === 'excluded' ? 'לא כולל מע"מ' : 'פטור',
      total,
      vat,
      exp.invoice_type || '',
      exp.invoice_number || '',
      PAYMENT_STATUS_MAP[exp.payment_status] || '',
      exp.notes || ''
    ];
  });
  const totalExp = financials.expenses.reduce((s, e) => s + calcExpenseVat(e).total, 0);
  const totalExpVat = financials.expenses.reduce((s, e) => s + calcExpenseVat(e).vat, 0);

  const expenseSheet = {
    name: 'הוצאות',
    title: `הוצאות — ${event?.title}`,
    headers: ['תאריך', 'קטגוריה', 'פריט/ספק', 'כמות', 'מחיר', 'מע"מ', 'סה"כ', 'מע"מ ₪', 'סוג חשבונית', 'מ\' חשבונית', 'סטטוס', 'הערות'],
    rows: expenseRows,
    totals: ['סה"כ', '', '', '', '', '', Math.round(totalExp), Math.round(totalExpVat), '', '', '', '']
  };

  // גיליון 4 — P&L סיכום
  const netProfit = Math.round(totalRev - calcVat(totalRev)) - Math.round(totalExp);
  
  const plSheet = {
    name: 'רווח והפסד',
    title: `דוח רווח והפסד — ${event?.title} — ${eventDate}`,
    headers: ['סעיף', 'סכום'],
    rows: [
      ['הכנסות (נטו לפני מע"מ)', Math.round(totalRev - calcVat(totalRev))],
      ['הוצאות (כולל מע"מ)', Math.round(totalExp)],
      ['', ''],
      [netProfit >= 0 ? 'רווח נקי' : 'הפסד', Math.abs(netProfit)],
      ['', ''],
      ['פירוט מע"מ הכנסות', Math.round(calcVat(totalRev))],
      ['פירוט מע"מ הוצאות', Math.round(totalExpVat)],
    ],
    totals: null
  };

  exportToExcel([audienceSheet, revenueSheet, expenseSheet, plSheet], filename);
}

/**
 * ייצוא קהל/סגמנט
 */
export function exportAudienceToExcel(recipients, filename = 'קהל') {
  exportToExcel([{
    name: 'קהל',
    headers: ['שם פרטי', 'שם משפחה', 'טלפון', 'מייל', 'עיר', 'מגדר', 'תגיות', 'תאריך הצטרפות'],
    rows: recipients.map(r => [
      r.first_name || '',
      r.last_name || '',
      r.phone || '',
      r.email || '',
      r.city || '',
      r.gender || '',
      Array.isArray(r.tags) ? r.tags.join(', ') : '',
      r.created_at ? new Date(r.created_at).toLocaleDateString('he-IL') : ''
    ])
  }], filename);
}
