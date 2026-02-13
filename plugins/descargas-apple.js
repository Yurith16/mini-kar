/*
██████╗░██╗░░░██╗███████╗███████╗
██╔══██╗╚██╗░██╔╝╚════██║██╔════╝
██████╔╝░╚████╔╝░░░███╔═╝█████╗░░
██╔══██╗░░╚██╔╝░░██╔══╝░░██╔══╝░░
██║░░██║░░░██║░░░███████╗███████╗
╚═╝░░╚═╝░░░╚═╝░░░╚══════╝╚══════╝
*/
import fs from 'node:fs'
import path from 'node:path'
import axios from 'axios'
import fetch from 'node-fetch'
import { pipeline } from 'node:stream/promises'
import { wrapper } from 'axios-cookiejar-support'
import { CookieJar } from 'tough-cookie'
import { checkReg } from '../lib/checkReg.js'

const BASE_URL = 'https://aaplmusicdownloader.com'
const API_PATH = '/api/composer/swd.php'
const SONG_PAGE = '/song.php'
const DEFAULT_MIME = 'application/x-www-form-urlencoded; charset=UTF-8'
const DEFAULT_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36'
const CACHE_TTL_MS = 10 * 60 * 1000

const appleCache = global.__APPLE_SEARCH_CACHE__ || new Map()
global.__APPLE_SEARCH_CACHE__ = appleCache

function buildKey(chatId, messageId) { return `${chatId}::${messageId}` }
function cleanupExpired() {
  const now = Date.now()
  for (const [key, entry] of appleCache.entries()) {
    if (!entry?.createdAt || now - entry.createdAt > CACHE_TTL_MS) appleCache.delete(key)
  }
}
function getAppleResults(chatId, messageId) {
  if (!chatId || !messageId) return null
  cleanupExpired()
  const entry = appleCache.get(buildKey(chatId, messageId))
  return (entry && Date.now() - entry.createdAt <= CACHE_TTL_MS) ? entry.results : null
}
function pickAppleResult(chatId, messageId, index) {
  const results = getAppleResults(chatId, messageId)
  return (results && index >= 1 && index <= results.length) ? results[index - 1] : null
}
function extractQuotedMeta(m) {
  const quoted = m.quoted?.fakeObj || m.quoted
  const key = quoted?.key || {}
  return { messageId: key.id || quoted?.id || null, chatId: key.remoteJid || quoted?.chat || m.chat || null }
}

const { promises: fsp } = fs
const jar = new CookieJar()
const client = wrapper(axios.create({
  baseURL: BASE_URL, jar, withCredentials: true,
  headers: { 'user-agent': DEFAULT_USER_AGENT, accept: 'application/json, text/javascript, */*; q=0.01', referer: `${BASE_URL}${SONG_PAGE}` }
}))

function parseArgs(tokens = []) {
  const options = { songName: '', artistName: '', appleUrl: '', quality: 'm4a', cover: '' }
  const leftovers = []
  for (let i = 0; i < tokens.length; i += 1) {
    const token = tokens[i]
    if (!token) continue
    if (token === '--url') { options.appleUrl = tokens[i+1]; i++ }
    else { leftovers.push(token) }
  }
  if (!options.appleUrl) options.appleUrl = leftovers.find(v => /^https?:\/\//i.test(v)) || ''
  return options
}

async function requestDownloadLink(params) {
  const payload = new URLSearchParams()
  payload.set('song_name', params.songName || 'Song'); payload.set('artist_name', params.artistName || 'Artist')
  payload.set('url', params.appleUrl); payload.set('token', 'none'); payload.set('quality', 'm4a')
  const response = await client.post(API_PATH, payload.toString(), {
    headers: { 'content-type': DEFAULT_MIME, 'x-requested-with': 'XMLHttpRequest' }
  })
  return response.data.dlink
}

const handler = async (m, { conn, args }) => {
  if (!m) return
  const ctx = (global.rcanalr || {})
  
  let who = m.quoted ? m.quoted.sender : m.sender
  let user = global.db.data.users[who]
  if (await checkReg(m, user)) return

  const options = parseArgs(args)
  const numericSelection = (!options.appleUrl && args?.length) ? Number.parseInt(args[0], 10) : NaN

  if (!options.appleUrl && Number.isInteger(numericSelection)) {
    const { chatId, messageId } = extractQuotedMeta(m)
    const picked = pickAppleResult(chatId, messageId, numericSelection)
    if (picked) {
      options.appleUrl = picked.appleUrl
      options.songName = picked.title
      options.artistName = picked.artist
      options.cover = picked.thumbnail // Guardamos la portada del search
    }
  }

  if (!options.appleUrl) {
    return conn.reply(m.chat, `> Debe ingresar una URL de Apple Music o responder con el número.`, m, ctx)
  }

  await m.react('🕛')
  try {
    await client.get(SONG_PAGE, { params: { cb: Date.now() } })
    const downloadLink = await requestDownloadLink(options)
    
    const savedTo = path.join(process.cwd(), 'tmp', `apple_${Date.now()}.m4a`)
    const response = await axios.get(downloadLink, { responseType: 'stream' })
    await pipeline(response.data, fs.createWriteStream(savedTo))

    // Envío como AUDIO NORMAL con AD REPLY (Portada pequeñita)
    await conn.sendMessage(m.chat, { 
      audio: fs.readFileSync(savedTo), 
      mimetype: 'audio/mp4', 
      ptt: false,
      contextInfo: {
        externalAdReply: {
          title: options.songName.toUpperCase(),
          body: options.artistName,
          thumbnailUrl: options.cover || 'https://i.postimg.cc/W3RsYXJ5/applemusic-(1)-(1)-(1)-(1).png',
          mediaType: 1,
          showAdAttribution: true,
          renderLargerThumbnail: false // AQUÍ: false para que salga pequeñita
        }
      }
    }, { quoted: m })

    await fsp.unlink(savedTo).catch(() => null)
    await m.react('✅')
  } catch (e) {
    await m.react('❌')
    return conn.reply(m.chat, `> No se pudo procesar la solicitud.`, m, ctx)
  }
}

handler.help = ['appledl (musicas de apple)']
handler.tags = ['downloader']
handler.command = /^(applemusic|appledl|appletrack)$/i
handler.group = true

export default handler