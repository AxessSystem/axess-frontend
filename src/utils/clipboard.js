export const copyToClipboard = async (text, successMsg = 'הלינק הועתק ✓') => {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
    } else {
      const textarea = document.createElement('textarea')
      textarea.value = text
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.focus()
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
    }
    return { success: true, message: successMsg }
  } catch (err) {
    return { success: false, message: 'שגיאה בהעתקה' }
  }
}
