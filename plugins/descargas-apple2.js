import axios from 'axios'
import { checkReg } from '../lib/checkReg.js'

const SEARCH_ENDPOINT = 'https://itunes.apple.com/search'
const DEFAULT_LIMIT = 5
const DEFAULT_COUNTRY = 'us'
const AXIOS_TIMEOUT_MS = 15000
const CACHE_TTL_MS = 10 * 60 * 1000

const appleCache = global.__APPLE_SEARCH_CACHE__ || new Map()
global.__APPLE_SEARCH_CACHE__ = appleCache

function buildKey(chatId, messageId) {
  return `${chatId}::${messageId}`
}

function cleanupExpired() {
  const now = Date.now()
  for (const [key, entry] of appleCache.entries()) {
    if (!entry?.createdAt || now - entry.createdAt > CACHE_TTL_MS) {
      appleCache.delete(key)
    }
  }
}

function cacheAppleResults(chatId, messageId, results = []) {
  if (!chatId || !messageId || !Array.isArray(results) || !results.length) return false
  cleanupExpired()
  appleCache.set(buildKey(chatId, messageId), { createdAt: Date.now(), results })
  return true
}

function parseArgs(argv = []) {
  const options = {
    term: '',
    artist: '',
    limit: DEFAULT_LIMIT,
    country: DEFAULT_COUNTRY,
    json: false,
    firstOnly: false
  }
  const leftovers = []

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i]
    if (!token) continue
    switch (token) {
      case '--term':
      case '-t':
        options.term = argv[++i] ?? ''
        break
      case '--artist':
      case '-a':
        options.artist = argv[++i] ?? ''
        break
      case '--limit':
      case '-l':
        options.limit = Number(argv[++i]) || DEFAULT_LIMIT
        break
      case '--country':
      case '-c':
        options.country = (argv[++i] ?? DEFAULT_COUNTRY).toLowerCase()
        break
      case '--json':
        options.json = true
        break
      case '--first':
        options.firstOnly = true
        break
      default:
        leftovers.push(token)
        break
    }
  }

  if (!options.term && leftovers.length) options.term = leftovers.join(' ')
  options.limit = Math.max(1, Math.min(10, options.limit))
  return options
}

async function searchSongs({ term, limit, country }) {
  const params = new URLSearchParams({
    term,
    limit: String(limit),
    country,
    media: 'music',
    entity: 'song'
  })
  const { data } = await axios.get(SEARCH_ENDPOINT, { params, timeout: AXIOS_TIMEOUT_MS })
  return Array.isArray(data?.results) ? data.results : []
}

function filterResults(results, artist) {
  if (!artist) return results
  const needle = artist.trim().toLowerCase()
  return results.filter(item => item.artistName?.toLowerCase().includes(needle))
}

function mapResult(item) {
  return {
    title: item.trackName,
    artist: item.artistName,
    album: item.collectionName,
    appleUrl: item.trackViewUrl,
    previewUrl: item.previewUrl,
    artwork: item.artworkUrl100,
    releaseDate: item.releaseDate,
    trackId: item.trackId
  }
}

function buildHumanMessage(results, { term, artist }, usedPrefix = '.') {
  const header = [`> Resultados para "${term}"${artist ? ` con artista "${artist}"` : ''}:`, ' ']
  const body = results.map((result, index) => {
    const lines = [`> *${index + 1}.* ${result.title || 'Sin título'}`]
    lines.push(`> 👤 *Artista:* ${result.artist || 'Desconocido'}`)
    lines.push(`> 🔗 *Link:* ${result.appleUrl || 'sin enlace'}`)
    return lines.join('\n')
  })
  const footer = [
    ' ',
    `> Responde con *${usedPrefix}appledl <número>*`
  ]
  return [...header, ...body, ...footer].join('\n')
}

const handler = async (m, { conn, args, usedPrefix, command }) => {
  let who = m.quoted ? m.quoted.sender : m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : m.sender
  let user = global.db.data.users[who]
  if (await checkReg(m, user)) return

  const options = parseArgs(args)
  if (!options.term) {
    return conn.reply(m.chat, `> Debe ingresar un término para buscar.`, m)
  }

  await m.react?.('⏳')
  try {
    const rawResults = await searchSongs(options)
    const filtered = filterResults(rawResults, options.artist)
    const simplified = (options.firstOnly ? filtered.slice(0, 1) : filtered.slice(0, options.limit)).map(mapResult)

    if (!simplified.length) {
      await m.react?.('❌')
      return conn.reply(m.chat, '> No se encontraron coincidencias.', m)
    }

    let sentMessage
    if (options.json) {
      sentMessage = await conn.reply(m.chat, JSON.stringify(simplified, null, 2), m)
    } else {
      const text = buildHumanMessage(simplified, options, usedPrefix || '.')
      sentMessage = await conn.reply(m.chat, text, m)
    }

    const chatId = sentMessage?.key?.remoteJid || m.chat
    const messageId = sentMessage?.key?.id
    cacheAppleResults(chatId, messageId, simplified)
    await m.react?.('✅')
    return true
  } catch (error) {
    await m.react?.('❌')
    return conn.reply(m.chat, `> La búsqueda falló.`, m)
  }
}

handler.help = ['applesearch (buscar en apple)']
handler.tags = ['downloader']
handler.command = ['applesearch']

export default handler