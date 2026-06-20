if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  })
}

const presetSelect = document.getElementById('date-preset')
const customDateField = document.getElementById('custom-date-field')
const customDateInput = document.getElementById('custom-date')
const allDayCheckbox = document.getElementById('all-day')
const timeFields = document.getElementById('time-fields')
const form = document.getElementById('invite-form')
const result = document.getElementById('result')
const gcalLink = document.getElementById('gcal-link')
const copyBtn = document.getElementById('copy-btn')
const resetBtn = document.getElementById('reset-btn')
const resultDate = document.getElementById('result-date')
const liveCountdown = document.getElementById('live-countdown')

// Set min selectable date to tomorrow
const tomorrow = new Date()
tomorrow.setDate(tomorrow.getDate() + 1)
customDateInput.min = tomorrow.toISOString().split('T')[0]

function getTargetDate() {
  if (presetSelect.value === 'custom') {
    if (!customDateInput.value) return null
    const [y, m, d] = customDateInput.value.split('-').map(Number)
    return new Date(y, m - 1, d)
  }
  const d = new Date()
  d.setFullYear(d.getFullYear() + parseInt(presetSelect.value))
  return d
}

function formatRelative(date) {
  const msPerDay = 86_400_000
  const totalDays = Math.floor((date - Date.now()) / msPerDay)
  if (totalDays <= 0) return 'That date has already passed'

  const years = Math.floor(totalDays / 365.25)
  const leftoverDays = totalDays - Math.floor(years * 365.25)
  const months = Math.floor(leftoverDays / 30.44)
  const days = Math.floor(leftoverDays - months * 30.44)

  const parts = []
  if (years) parts.push(`${years} year${years !== 1 ? 's' : ''}`)
  if (months) parts.push(`${months} month${months !== 1 ? 's' : ''}`)
  if (days || !parts.length) parts.push(`${days} day${days !== 1 ? 's' : ''}`)

  return parts.join(', ')
}

function formatDisplayDate(date) {
  return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
}

function updateLiveCountdown() {
  const target = getTargetDate()
  if (!target) {
    liveCountdown.textContent = ''
    return
  }
  liveCountdown.textContent = `${formatDisplayDate(target)} — ${formatRelative(target)} away`
}

presetSelect.addEventListener('change', () => {
  const isCustom = presetSelect.value === 'custom'
  customDateField.hidden = !isCustom
  updateLiveCountdown()
})

customDateInput.addEventListener('input', updateLiveCountdown)

allDayCheckbox.addEventListener('change', () => {
  timeFields.hidden = allDayCheckbox.checked
})

function padDate(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}${m}${d}`
}

form.addEventListener('submit', e => {
  e.preventDefault()

  const title = document.getElementById('title').value.trim()
  if (!title) {
    document.getElementById('title').focus()
    return
  }

  const target = getTargetDate()
  if (!target) {
    customDateInput.focus()
    return
  }

  const allDay = allDayCheckbox.checked
  const description = document.getElementById('description').value.trim()
  const location = document.getElementById('location').value.trim()

  let startStr, endStr
  if (allDay) {
    startStr = padDate(target)
    const next = new Date(target)
    next.setDate(next.getDate() + 1)
    endStr = padDate(next)
  } else {
    const [sh, sm] = document.getElementById('start-time').value.split(':')
    const [eh, em] = document.getElementById('end-time').value.split(':')
    const base = padDate(target)
    startStr = `${base}T${sh}${sm}00`
    endStr = `${base}T${eh}${em}00`
  }

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${startStr}/${endStr}`,
  })
  if (description) params.set('details', description)
  if (location) params.set('location', location)

  const url = `https://calendar.google.com/calendar/render?${params}`

  gcalLink.href = url
  resultDate.innerHTML = `<strong>${formatDisplayDate(target)}</strong>${formatRelative(target)} from now`
  form.hidden = true
  result.hidden = false
  result.scrollIntoView({ behavior: 'smooth', block: 'start' })
})

copyBtn.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(gcalLink.href)
    copyBtn.textContent = 'Copied!'
  } catch {
    copyBtn.textContent = 'Copy failed'
  }
  setTimeout(() => { copyBtn.textContent = 'Copy link' }, 2000)
})

resetBtn.addEventListener('click', () => {
  result.hidden = true
  form.hidden = false
  form.scrollIntoView({ behavior: 'smooth', block: 'start' })
})

updateLiveCountdown()
