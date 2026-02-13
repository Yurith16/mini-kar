// ESM-adapted Gemini "scraper" client with image URL extraction and optional downloads
// NOTE: For authenticated sessions, set GEMINI_COOKIE in .env or save a cookie header in auth/state.json

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

let _fetch = globalThis.fetch
async function ensureFetch() {
  if (typeof _fetch === 'function') return _fetch
  try {
    const mod = await import('node-fetch')
    _fetch = mod.default
  } catch {
    // will throw later if used
  }
  return _fetch
}

// Optional cookies util (non-fatal if missing)
let cookiesUtil = null
try {
  cookiesUtil = (await import('./utils/cookies.js')).default || null
} catch {}

// ATENCIÓN: Esta cookie inline es sensible. Úsala solo localmente y evita subir este archivo al repositorio.
const INLINE_GEMINI_COOKIE = '_gcl_au=1.1.209587518.1760230963; _ga=GA1.1.172935452.1760230964; OTZ=8298783_72_76_104100_72_446760; NID=525=jRQcVq1O3X1OX3sMyr0JaXVjNOhgTNUeyxEwMMc1Uyvkh_lxI2gFFqwFAoYYBccX8TFnlI70TjoslLVikVgsf3jOM1RrqfcuRfsMSvA5xd7xj6p_zYx1OeOS5lgQ16b9SFMCqki8I9wCOdReIK6WfcCeNAGSXz8j0q7y3MICpW_tHBuvNkYnvpNG4o25AuaP0pcre0bG2HbFsBUwTrhKP5eyeJQlYEL08Z1r-ERBvOkX5aowqg_VurAYqR4kAYww7djzFhO8d9WGZPrNVQpcX9epJN5aNlihf83zvJSkhtdXUv4c3ZQ4XaImlN4PPFgpHa6DwtgrLknZFS34YZQkBOaG2paimMGeEiIe5NuhHP2tm4mnY-W1hr1w6E-eS1GVr2oRMtnxg_C-5qR0Mpf4Ua6yVSZHDlAmhVD47w-tWFxlXYHCL_UdtPQplvwewPIvMTHANMyv26Uv3u6gZfLiBMz4LYWgZGHXX-Gur1qayzww1fKVd-L1NfdjGse2tYXX3UVsXFlk3ETCw7CYTGkZterbvrH8sc48TURf6kL1dXvp9qHt1bGWAcqEN1BwYkqG4-lH-X1-OUy8J6Y4goAHrjmNQMQlIBBLiEfuxBzM585a8cXMsmqju_AhydI5kcCwhbUvfJWjI06ka1uMox-SIF6KZOH_2hDTQwGqv9ry; HSID=AViZjInap1pSdZ9RR; SSID=AuifJgTbxNQeO7gIi; APISID=vmKuxPvtZEj_gkxI/AWQlys6Gwztj5rei_; SAPISID=OJ7fazIb75sCJtt8/AoSg7Vjn0MZ9h1O6g; __Secure-1PAPISID=OJ7fazIb75sCJtt8/AoSg7Vjn0MZ9h1O6g; __Secure-3PAPISID=OJ7fazIb75sCJtt8/AoSg7Vjn0MZ9h1O6g; ACCOUNT_CHOOSER=AFx_qI5EdhajdOk_3GXlG2LBvIzV3dy0_imc4Rk1XXSzTnx6v_XGuHOYBtwmXKPQacLZdBqvQ-2uPqDaippnvEZhS51ynL-U9zAntgFWtMKkOii7pghqGgVD6vH_0Z5LFLGRX9-IMAM1HoYFSZyC44IU74S-9e3HDg; LSID=s.HN:g.a0002QhwkldrG1Bi7NRu7DpR9qFoj5xzZOwkVpMM0HhHIBWzOoWeMSO04wisJbVTbIYfzSHuUgACgYKAXESARYSFQHGX2Mis7Qh1vVwVlgwPqk3ITWWIRoVAUF8yKoSNeQiiekL0rIsJeOxytTt0076; __Host-1PLSID=s.HN:g.a0002QhwkldrG1Bi7NRu7DpR9qFoj5xzZOwkVpMM0HhHIBWzOoWechtttlEkR2pDIywodpQjqwACgYKAdASARYSFQHGX2Miwmq742aiP76zs-QMqhthOxoVAUF8yKooCnAPtOVwxw2gn4CbCmBK0076; __Host-3PLSID=s.HN:g.a0002QhwkldrG1Bi7NRu7DpR9qFoj5xzZOwkVpMM0HhHIBWzOoWeztl6f3_lLYqwRDzRISNRawACgYKAcISARYSFQHGX2MiSSvrMXhOg0TiJEFuPFB-BBoVAUF8yKqXpaA8KHHmFL4nDQdGr_7r0076; SID=g.a0002Qhwkoy_yvtodX2IhvzG7hBCODJlj1egK-FohQl6FOjTrKIRS5oERc8zXGuooYsE89F8iwACgYKATcSARYSFQHGX2Mi8VNEGFrPaT5Z2vvaLndelxoVAUF8yKpDrYbfanBBa83sQCA3BB1d0076; __Secure-1PSID=g.a0002Qhwkoy_yvtodX2IhvzG7hBCODJlj1egK-FohQl6FOjTrKIR0OlHv57_TdySPGE208bE4QACgYKAVYSARYSFQHGX2Mi84Nu4kX__MitgzS4lvbL7hoVAUF8yKq2of6jyRiy53bGOe73Eet40076; __Secure-3PSID=g.a0002Qhwkoy_yvtodX2IhvzG7hBCODJlj1egK-FohQl6FOjTrKIRQl56hA5O3Ulfn5roQO4oUgACgYKAdQSARYSFQHGX2Mi_4CA-C2kv_64pfEXar2edBoVAUF8yKrDdfuj6-VZgbesVzq62GKO0076; __Host-GAPS=1:O_JileKUKx8uWvtR6d1RRhRlP3i4cRn5C_jH0GbkIecNis9AnfKsD_ILLQqdm5RHRSDR--K_DH6bYAEjU5JSs9fdYMTQEcUAZOxVZtfvHE3BjosZvL36cXiSRbQ_zfxkf5wTROgijhqKp1cM221hBJAL4HASA2GZU76P94x9ltJeWy9KztNtTg:6M-q-HtE5KgIn6s7; __Host-GAPSTS=gapsts-Ci0BUmOUZ9PVAbqlQW8JvDwGxMdk8UZJrdT8Zp8V6c7tRVjfTBOrt4q1rbW_yP0QAQ==; __Secure-1PSIDTS=sidts-CjcBmkD5S2CXc1RnQ4jt_N4ObzBMPhyA_VfRaRG3RafGREWrbs7UznsbzUlPRxnb8VwQpH6dwFf1EAA; __Secure-1PSIDRTS=sidts-CjcBmkD5S2CXc1RnQ4jt_N4ObzBMPhyA_VfRaRG3RafGREWrbs7UznsbzUlPRxnb8VwQpH6dwFf1EAA; __Secure-3PSIDTS=sidts-CjcBmkD5S2CXc1RnQ4jt_N4ObzBMPhyA_VfRaRG3RafGREWrbs7UznsbzUlPRxnb8VwQpH6dwFf1EAA; __Secure-3PSIDRTS=sidts-CjcBmkD5S2CXc1RnQ4jt_N4ObzBMPhyA_VfRaRG3RafGREWrbs7UznsbzUlPRxnb8VwQpH6dwFf1EAA; _ga_BF8Q35BMLM=GS2.1.s1760230963$o1$g1$t1760231031$j52$l0$h0; _ga_WC57KJ50ZZ=GS2.1.s1760230963$o1$g1$t1760231032$j51$l0$h0; SIDCC=AKEyXzXcKlBCmrYY878_sNLJqX3hZ4_iZ3I6C2Ac5YusaJGjsiZjwknVY5N4SEwulqhFZc7EtA; __Secure-1PSIDCC=AKEyXzWHLXfb7AAMqj0-nxw6iEq8agD4upcFT37c2lWqKGy3MYkFDfbFj0sitE6_59mAmJ6W; __Secure-3PSIDCC=AKEyXzWF8oZ3XvDojZcScRn-4YlUp8Y9jzHX6wb44Ypz8z2Pe2YHNYWRzry7r1UtnDz9jl6Y'

function btoa2(str) { return Buffer.from(str, 'utf8').toString('base64') }
function atob2(b64) { return Buffer.from(b64, 'base64').toString('utf8') }

export async function getNewCookie() {
  const f = await ensureFetch()
  if (typeof f !== 'function') throw new Error('Este módulo requiere fetch (Node 18+) o tener node-fetch instalado.')

  const r = await f(
    'https://gemini.google.com/_/BardChatUi/data/batchexecute?rpcids=maGuAc&source-path=%2F&bl=boq_assistant-bard-web-server_20250814.06_p1&f.sid=-7816331052118000090&hl=en-US&_reqid=173780&rt=c',
    {
      headers: {
        'content-type': 'application/x-www-form-urlencoded;charset=UTF-8',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36',
      },
      body: 'f.req=%5B%5B%5B%22maGuAc%22%2C%22%5B0%5D%22%2Cnull%2C%22generic%22%5D%5D%5D&',
      method: 'POST',
      redirect: 'manual',
    }
  )

  if (!r.ok && r.status !== 302) {
    throw new Error(`Fallo al obtener cookie: ${r.status} ${r.statusText}`)
  }

  const cookies = r.headers.get('set-cookie')
  if (!cookies) throw new Error('No se recibieron cookies de Gemini')
  return cookies.split('; ')[0]
}

function readCookieFromDotEnv() {
  try {
    const envPath = path.resolve(__dirname, '..', '.env')
    if (!fs.existsSync(envPath)) return null
    const text = fs.readFileSync(envPath, 'utf8')
    for (const line of text.split(/\r?\n/)) {
      const m = /^\s*GEMINI_COOKIE\s*=\s*(.*)\s*$/i.exec(line)
      if (m && m[1]) return m[1].replace(/^['"]|['"]$/g, '').trim()
    }
  } catch {}
  return null
}

function tryGetSessionCookie(stateFilePath) {
  const candidate = stateFilePath
    ? path.resolve(stateFilePath)
    : (process.env.GEMINI_STATE_FILE
        ? path.resolve(process.env.GEMINI_STATE_FILE)
        : path.resolve(__dirname, '..', 'auth', 'state.json'))

  try {
    if (INLINE_GEMINI_COOKIE && typeof INLINE_GEMINI_COOKIE === 'string' && INLINE_GEMINI_COOKIE.trim()) {
      return INLINE_GEMINI_COOKIE.trim()
    }
    if (fs.existsSync(candidate)) {
      if (cookiesUtil && typeof cookiesUtil.getCookieHeaderFromState === 'function') {
        return cookiesUtil.getCookieHeaderFromState(candidate)
      }
      const raw = fs.readFileSync(candidate, 'utf8')
      const storage = JSON.parse(raw)
      const cookieHeader = (storage.cookies || [])
        .filter(c => /gemini\.google\.com$|\.google\.com$/.test(c.domain))
        .map(c => `${c.name}=${c.value}`)
        .join('; ')
      return cookieHeader || null
    }
    const cookieTxt = path.resolve(__dirname, '..', 'auth', 'cookie.txt')
    if (fs.existsSync(cookieTxt)) {
      const s = (fs.readFileSync(cookieTxt, 'utf8') || '').trim()
      if (s) return s
    }
    // Skipped: optional auth/local-cookie.js support in ESM mode
    const envCookie = readCookieFromDotEnv()
    if (envCookie) return envCookie
    if (process.env.GEMINI_COOKIE && typeof process.env.GEMINI_COOKIE === 'string' && process.env.GEMINI_COOKIE.trim()) {
      return process.env.GEMINI_COOKIE.trim()
    }
  } catch {}
  return null
}

async function getXsrfToken(cookieHeader) {
  const f = await ensureFetch()
  const res = await f('https://gemini.google.com/app', {
    headers: {
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36',
      cookie: cookieHeader,
      accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
    method: 'GET',
  })
  const html = await res.text()
  const re1 = /"SNlM0e":"([^"]+)"/
  const re2 = /"at":"([^"]+)"/
  const m1 = html.match(re1)
  if (m1 && m1[1]) return m1[1]
  const m2 = html.match(re2)
  if (m2 && m2[1]) return m2[1]
  const xsrfInline = /xsrf.*?([A-Za-z0-9_:-]{20,})/.exec(html)
  if (xsrfInline && xsrfInline[1]) return xsrfInline[1]
  return null
}

function extractTextAndResume(parsed) {
  const blocks = Array.isArray(parsed?.[4]) ? parsed[4] : []
  const texts = []
  let lastBlockId = null

  const isLikelyText = (s) => {
    if (typeof s !== 'string') return false
    const trimmed = s.trim()
    if (!trimmed) return false
    if (/^c_[0-9a-f]{6,}$/i.test(trimmed)) return false
    if (!/\s/.test(trimmed) && /^[A-Za-z0-9_\-+/=]+$/.test(trimmed) && trimmed.length >= 16) return false
    if (trimmed.length < 6 && !/\s/.test(trimmed)) return false
    if (/\s/.test(trimmed) || /[\.\!\?\,;:\-áéíóúñ]/i.test(trimmed)) return true
    if (trimmed.length > 30) return true
    return false
  }

  for (const blk of blocks) {
    if (!blk) continue
    if (blk[0] != null && lastBlockId == null) lastBlockId = blk[0]
    const content = blk[1]
    if (typeof content === 'string') {
      if (isLikelyText(content)) texts.push(content)
    } else if (Array.isArray(content)) {
      if (typeof content[0] === 'string') {
        if (isLikelyText(content[0])) texts.push(content[0])
      } else if (Array.isArray(content[0]) && typeof content[0][0] === 'string') {
        if (isLikelyText(content[0][0])) texts.push(content[0][0])
      }
    }
  }

  if (texts.length === 0) {
    try {
      const maybe = parsed?.[4]?.[0]?.[1]
      if (typeof maybe === 'string' && isLikelyText(maybe)) texts.push(maybe)
      else if (Array.isArray(maybe) && typeof maybe[0] === 'string' && isLikelyText(maybe[0])) texts.push(maybe[0])
      else if (Array.isArray(maybe) && Array.isArray(maybe[0]) && typeof maybe[0][0] === 'string' && isLikelyText(maybe[0][0])) texts.push(maybe[0][0])
    } catch {}
    const deepStrings = []
    const walk = (n, depth = 0) => {
      if (depth > 6) return
      if (typeof n === 'string' && isLikelyText(n)) deepStrings.push(n)
      else if (Array.isArray(n)) for (const x of n) walk(x, depth + 1)
      else if (n && typeof n === 'object') for (const k of Object.keys(n)) walk(n[k], depth + 1)
    }
    walk(parsed)
    if (deepStrings.length) texts.push(deepStrings[0])
  }

  const textJoined = texts.join('\n').replace(/\*\*(.+?)\*\*/g, '*$1*').trim()
  let resumeArray = null
  if (Array.isArray(parsed?.[1])) {
    resumeArray = [...parsed[1]]
    if (lastBlockId != null) resumeArray.push(lastBlockId)
  }

  const imageUrls = []
  const urlRegex = /https?:\/\/[^\s"'<>]+/gi
  const addUrl = (u) => {
    try {
      if (typeof u !== 'string') return
      const url = u.trim()
      if (!/^https:\/\//i.test(url)) return
      const looksExt = /\.(png|jpe?g|webp|gif)(\?|$)/i.test(url)
      const looksGuc = /^https:\/\/([a-z0-9-]+\.)+googleusercontent\.com\//i.test(url)
      if (looksExt || looksGuc) imageUrls.push(url)
    } catch {}
  }
  for (const t of texts) {
    if (typeof t === 'string') {
      const found = t.match(urlRegex) || []
      found.forEach(addUrl)
    }
  }
  const walkForUrls = (n, depth = 0) => {
    if (depth > 6) return
    if (typeof n === 'string') addUrl(n)
    else if (Array.isArray(n)) for (const x of n) walkForUrls(x, depth + 1)
    else if (n && typeof n === 'object') for (const k of Object.keys(n)) walkForUrls(n[k], depth + 1)
  }
  walkForUrls(parsed)

  return { text: textJoined, resumeArray, images: Array.from(new Set(imageUrls)) }
}

function extractImageUrlsFromStream(streamText) {
  const urls = new Set()
  if (typeof streamText !== 'string' || !streamText) return []
  const regex = /https:\/\/[\w\-\.]+(?:googleusercontent\.com|ggpht\.com)[^\s"'<>)]+|https:\/\/[^\s"'<>)]+\.(?:png|jpe?g|webp|gif)(?:\?[^\s"'<>)]*)?/gi
  const matches = streamText.match(regex) || []
  for (const m of matches) {
    try {
      const u = m.trim()
      if (!/^https:\/\//i.test(u)) continue
      if (/googleusercontent\.com\/image_generation_content\/0$/.test(u)) continue
      urls.add(u)
    } catch {}
  }
  return Array.from(urls)
}

function sanitizeImageUrl(u) {
  try {
    if (typeof u !== 'string') return null
    let s = u.trim()
    s = s.replace(/^["']|["']$/g, '')
      .replace(/\\u003d/gi, '=')
      .replace(/\\u0026/gi, '&')
      .replace(/\\u002f/gi, '/')
      .replace(/\\\//g, '/')
      .replace(/\\/g, '')
      .replace(/\s+/g, '')
    s = s.replace(/[,'\)\]]+$/g, '')
    if (!/^https:\/\//i.test(s)) return null
    const looksExt = /\.(png|jpe?g|webp|gif)(\?|$)/i.test(s)
    const looksGuc = /^https:\/\/([a-z0-9-]+\.)+googleusercontent\.com\//i.test(s) || /ggpht\.com/i.test(s)
    if (!(looksExt || looksGuc)) return null
    return s
  } catch { return null }
}

function sanitizeImageUrls(arr) {
  const out = new Set()
  for (const x of arr || []) {
    const s = sanitizeImageUrl(x)
    if (s) out.add(s)
  }
  return Array.from(out)
}

export async function ask(prompt, previousId = null) {
  const f = await ensureFetch()
  if (typeof f !== 'function') throw new Error('Este módulo requiere fetch (Node 18+) o tener node-fetch instalado.')
  if (typeof prompt !== 'string' || !prompt.trim().length) throw new Error('Prompt es requerido')

  let resumeArray = null
  let cookie = null
  if (previousId) {
    try {
      const s = atob2(previousId)
      const j = JSON.parse(s)
      resumeArray = j.newResumeArray
      cookie = j.cookie
    } catch {}
  }

  const sessionCookie = cookie ? null : tryGetSessionCookie()
  let xsrfToken = null
  const effectiveCookie = cookie || sessionCookie
  if (effectiveCookie) {
    try { xsrfToken = await getXsrfToken(effectiveCookie) } catch {}
  }

  const headers = {
    'content-type': 'application/x-www-form-urlencoded;charset=UTF-8',
    'x-goog-ext-525001261-jspb': '[1,null,null,null,"9ec249fc9ad08861",null,null,null,[4]]',
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36',
    'x-same-domain': '1',
    cookie: effectiveCookie || (await getNewCookie()),
  }

  const b = [[prompt], ['en-US'], resumeArray]
  const a = [null, JSON.stringify(b)]
  const obj = { 'f.req': JSON.stringify(a) }
  if (xsrfToken) obj['at'] = xsrfToken
  const body = new URLSearchParams(obj)

  const response = await f(
    'https://gemini.google.com/_/BardChatUi/data/assistant.lamda.BardFrontendService/StreamGenerate?bl=boq_assistant-bard-web-server_20250729.06_p0&f.sid=4206607810970164620&hl=en-US&_reqid=2813378&rt=c',
    { headers, body, method: 'POST' }
  )

  if (!response.ok) {
    let textBody = ''
    try { textBody = await response.text() } catch {}
    throw new Error(`${response.status} ${response.statusText} ${textBody || '(cuerpo vacío)'}`)
  }

  const data = await response.text()
  const match = data.matchAll(/^\d+\n(.+?)\n/gm)
  const candidates = Array.from(match).map(m => m[1]).reverse()
  let extracted = null
  for (const cand of candidates) {
    try {
      const realArray = JSON.parse(cand)
      if (!Array.isArray(realArray) || !realArray[0] || !realArray[0][2]) continue
      const parsed = JSON.parse(realArray[0][2])
      const res = extractTextAndResume(parsed)
      if (res?.text) { extracted = res; break }
    } catch {}
  }
  if (!extracted) throw new Error('Formato de respuesta inválido de Gemini (no se pudo extraer texto)')

  const newResumeArray = extracted.resumeArray || null
  const text = extracted.text
  const images = Array.from(new Set([...(extracted.images || []), ...extractImageUrlsFromStream(data)]))
  const id = btoa2(JSON.stringify({ newResumeArray, cookie: headers.cookie }))
  return { text, id, images }
}

export async function askWithCookie(prompt, previousId = null, cookieHeader) {
  if (!cookieHeader || typeof cookieHeader !== 'string') throw new Error('Se requiere cookieHeader (sesión autenticada)')
  if (typeof prompt !== 'string' || !prompt.trim().length) throw new Error('Prompt es requerido')
  const f = await ensureFetch()

  let resumeArray = null
  let cookie = null
  if (previousId) {
    try {
      const s = atob2(previousId)
      const j = JSON.parse(s)
      resumeArray = j.newResumeArray
      cookie = j.cookie
    } catch {}
  }

  const headers = {
    'content-type': 'application/x-www-form-urlencoded;charset=UTF-8',
    'x-goog-ext-525001261-jspb': '[1,null,null,null,"9ec249fc9ad08861",null,null,null,[4]]',
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36',
    cookie: cookie || cookieHeader,
  }
  const b = [[prompt], ['en-US'], resumeArray]
  const a = [null, JSON.stringify(b)]
  let xsrfToken = null
  try { xsrfToken = await getXsrfToken(headers.cookie) } catch {}
  const obj = { 'f.req': JSON.stringify(a) }
  if (xsrfToken) obj['at'] = xsrfToken
  const body = new URLSearchParams(obj)

  const response = await f(
    'https://gemini.google.com/_/BardChatUi/data/assistant.lamda.BardFrontendService/StreamGenerate?bl=boq_assistant-bard-web-server_20250729.06_p0&f.sid=4206607810970164620&hl=en-US&_reqid=2813378&rt=c',
    { headers, body, method: 'POST' }
  )

  if (!response.ok) {
    let textBody = ''
    try { textBody = await response.text() } catch {}
    throw new Error(`${response.status} ${response.statusText} ${textBody || '(cuerpo vacío)'}`)
  }
  const data = await response.text()
  const match = data.matchAll(/^\d+\n(.+?)\n/gm)
  const candidates = Array.from(match).map(m => m[1]).reverse()
  let extracted = null
  for (const cand of candidates) {
    try {
      const realArray = JSON.parse(cand)
      if (!Array.isArray(realArray) || !realArray[0] || !realArray[0][2]) continue
      const parsed = JSON.parse(realArray[0][2])
      const res = extractTextAndResume(parsed)
      if (res?.text) { extracted = res; break }
    } catch {}
  }
  if (!extracted) throw new Error('Formato de respuesta inválido de Gemini (no se pudo extraer texto)')
  const newResumeArray = extracted.resumeArray || null
  const text = extracted.text
  const images = Array.from(new Set([...(extracted.images || []), ...extractImageUrlsFromStream(data)]))
  const id = btoa2(JSON.stringify({ newResumeArray, cookie: headers.cookie }))
  return { text, id, images }
}

export async function downloadImages(urls, cookieHeader, outDir = path.resolve(__dirname, '..', 'output')) {
  const f = await ensureFetch()
  if (!urls || !urls.length) return []
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })
  const saved = []
  for (const url of urls) {
    try {
      const baseHeaders = {
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36',
        accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
        'accept-language': 'en-US,en;q=0.9',
      }
      const headers1 = cookieHeader ? { ...baseHeaders, cookie: cookieHeader } : baseHeaders
      let res = await f(url, { headers: headers1 })
      if (!res.ok) {
        const headers2 = { ...headers1, referer: 'https://gemini.google.com/' }
        res = await f(url, { headers: headers2 })
      }
      if (!res.ok) continue
      const ab = await res.arrayBuffer()
      const buf = Buffer.from(ab)
      let ext = 'jpg'
      const extMatch = /\.(png|jpe?g|webp|gif)(\?|$)/i.exec(url)
      if (extMatch) {
        ext = extMatch[1].toLowerCase().startsWith('jp') ? 'jpg' : extMatch[1].toLowerCase()
      } else {
        const ct = res.headers.get('content-type') || ''
        if (/png/i.test(ct)) ext = 'png'
        else if (/webp/i.test(ct)) ext = 'webp'
        else if (/gif/i.test(ct)) ext = 'gif'
        else if (/jpeg|jpg/i.test(ct)) ext = 'jpg'
      }
      const file = path.join(outDir, `gemini_${Date.now()}_${Math.random().toString(36).slice(2, 7)}.${ext}`)
      fs.writeFileSync(file, buf)
      saved.push(file)
    } catch {}
  }
  return saved
}

export async function askForImages(prompt, previousId = null, options = {}) {
  const { stateFilePath, outDir } = options
  let result
  try {
    const cookieHeader = tryGetSessionCookie(stateFilePath)
    if (cookieHeader) {
      result = await askWithCookie(prompt, previousId, cookieHeader)
      const clean = sanitizeImageUrls(result.images || [])
      result.images = clean
      const files = await downloadImages(clean, cookieHeader, outDir)
      return { ...result, savedFiles: files }
    }
  } catch {}
  result = await ask(prompt, previousId)
  const clean = sanitizeImageUrls(result.images || [])
  result.images = clean
  const files = await downloadImages(clean, null, outDir)
  return { ...result, savedFiles: files }
}

export async function askWithSession(prompt, previousId = null, stateFilePath) {
  const cookieHeader = tryGetSessionCookie(stateFilePath)
  if (!cookieHeader) throw new Error('No se encontró sesión guardada (auth/state.json). Configura GEMINI_COOKIE o auth/state.json')
  return askWithCookie(prompt, previousId, cookieHeader)
}

export function getSessionCookieHeader(stateFilePath) { return tryGetSessionCookie(stateFilePath) }

function parseCookieHeaderToArray(cookieHeader) {
  if (typeof cookieHeader !== 'string') return []
  const parts = cookieHeader.split(';').map(s => s.trim()).filter(Boolean)
  const pairs = []
  for (const p of parts) {
    const i = p.indexOf('=')
    if (i > 0) {
      const name = p.slice(0, i).trim()
      const value = p.slice(i + 1).trim()
      if (name) pairs.push({ name, value })
    }
  }
  return pairs
}

function writeStateFromCookieHeader(cookieHeader, stateFilePath = path.resolve(__dirname, '..', 'auth', 'state.json')) {
  const cookies = parseCookieHeaderToArray(cookieHeader).map(({ name, value }) => ({
    name,
    value,
    domain: '.google.com',
    path: '/',
    expires: -1,
    httpOnly: false,
    secure: true,
    sameSite: 'None',
  }))
  if (!cookies.length) throw new Error('Cookie header inválido (no se encontraron pares nombre=valor)')
  const dir = path.dirname(stateFilePath)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  const storage = { cookies, origins: [] }
  fs.writeFileSync(stateFilePath, JSON.stringify(storage, null, 2), 'utf8')
  return stateFilePath
}

export function setSessionCookieHeader(cookieHeader, stateFilePath) {
  return writeStateFromCookieHeader(cookieHeader, stateFilePath)
}

export async function initSession(options = {}) {
  const stateFilePath = options.stateFilePath || path.resolve(__dirname, '..', 'auth', 'state.json')
  if (options.cookieHeader && typeof options.cookieHeader === 'string' && options.cookieHeader.trim()) {
    writeStateFromCookieHeader(options.cookieHeader.trim(), stateFilePath)
    return tryGetSessionCookie(stateFilePath)
  }
  if (process.env.GEMINI_COOKIE && process.env.GEMINI_COOKIE.trim()) {
    writeStateFromCookieHeader(process.env.GEMINI_COOKIE.trim(), stateFilePath)
    return tryGetSessionCookie(stateFilePath)
  }
  const existing = tryGetSessionCookie(stateFilePath)
  if (existing) return existing
  const anon = await getNewCookie()
  return anon
}

// HAR helpers
export function extractImageUrlsFromHar(harPath) {
  try {
    const harText = fs.readFileSync(harPath, 'utf8')
    const har = JSON.parse(harText)
    const entries = har?.log?.entries || []
    const urls = []
    for (const e of entries) {
      try {
        const req = e.request
        const res = e.response
        if (!req || !res) continue
        const url = req.url
        const ct = (res.headers?.find(h => h.name.toLowerCase() === 'content-type')?.value || '').toLowerCase()
        const type = (e._resourceType || e._type || '').toLowerCase()
        const looksImageByCt = ct.startsWith('image/')
        const looksImageByExt = /\.(png|jpe?g|webp|gif)(\?|$)/i.test(url)
        const isGoogleusercontent = /googleusercontent\.com/i.test(url)
        const isImageType = type === 'image' || type === 'img' || type === 'media'
        if ((looksImageByCt || looksImageByExt) && (isGoogleusercontent || isImageType)) urls.push(url)
      } catch {}
    }
    return Array.from(new Set(urls))
  } catch (err) {
    throw new Error(`No se pudo leer HAR ${harPath}: ${err.message}`)
  }
}

export async function saveAssetsFromHar(harPath, options = {}) {
  const { stateFilePath, outDir } = options
  const cookieHeader = tryGetSessionCookie(stateFilePath)
  const urls = extractImageUrlsFromHar(harPath)
  const saved = await downloadImages(urls, cookieHeader, outDir)
  return { urls, saved }
}

export function saveInlineImagesFromHar(harPath, outDir = path.resolve(__dirname, '..', 'output')) {
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })
  const saved = []
  const harText = fs.readFileSync(harPath, 'utf8')
  const har = JSON.parse(harText)
  const entries = har?.log?.entries || []
  for (const e of entries) {
    try {
      const res = e.response
      const content = res?.content
      if (!content) continue
      const mime = (content.mimeType || '').toLowerCase()
      if (!mime.startsWith('image/')) continue
      const text = content.text
      if (!text) continue
      let buf
      if (content.encoding === 'base64') buf = Buffer.from(text, 'base64')
      else buf = Buffer.from(text, 'utf8')
      let ext = 'jpg'
      if (/png/.test(mime)) ext = 'png'
      else if (/webp/.test(mime)) ext = 'webp'
      else if (/gif/.test(mime)) ext = 'gif'
      else if (/jpeg|jpg/.test(mime)) ext = 'jpg'
      const file = path.join(outDir, `har_${Date.now()}_${Math.random().toString(36).slice(2, 7)}.${ext}`)
      fs.writeFileSync(file, buf)
      saved.push(file)
    } catch {}
  }
  return saved
}

export async function saveImagesFromHar(harPath, options = {}) {
  const { stateFilePath, outDir } = options
  const inlineSaved = saveInlineImagesFromHar(harPath, outDir)
  const { urls, saved } = await saveAssetsFromHar(harPath, { stateFilePath, outDir })
  return { inlineSaved, urls, downloaded: saved }
}
