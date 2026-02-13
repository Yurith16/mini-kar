import { addExif } from '../lib/sticker.js'

let handler = async (m, { conn, text }) => {
  // Emoji de espera
  try { await conn.sendMessage(m.chat, { react: { text: '🔄', key: m.key } }) } catch {}
  
  if (!m.quoted) {
    try { await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } }) } catch {}
    return conn.reply(m.chat, '> 🎴 𝚁𝙴𝚂𝙿𝙾𝙽𝙳𝙴 𝙰 𝚂𝚃𝙸𝙲𝙺𝙴𝚁', m)
  }
  
  let stiker = false
  try {
    let [packname, ...author] = text.split('|')
    author = (author || []).join('|')
    let mime = m.quoted.mimetype || ''
    
    if (!/webp/.test(mime)) {
      try { await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } }) } catch {}
      return conn.reply(m.chat, '> 🎴 𝙽𝙾 𝙴𝚂 𝚂𝚃𝙸𝙲𝙺𝙴𝚁', m)
    }
    
    let img = await m.quoted.download()
    if (!img) {
      try { await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } }) } catch {}
      return conn.reply(m.chat, '> ⚠️ 𝙴𝚁𝚁𝙾𝚁 𝙰𝙻 𝙳𝙴𝚂𝙲𝙰𝚁𝙶𝙰𝚁', m)
    }
    
    stiker = await addExif(img, packname || '', author || '')
    
  } catch (e) {
    console.error(e)
    if (Buffer.isBuffer(e)) stiker = e
  } finally {
    if (stiker) {
      try { await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } }) } catch {}
      conn.sendFile(m.chat, stiker, 'wm.webp', '', m)
    } else {
      try { await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } }) } catch {}
      return conn.reply(m.chat, '> ⚠️ 𝙴𝚁𝚁𝙾𝚁 𝙰𝙻 𝙿𝚁𝙾𝙲𝙴𝚂𝙰𝚁', m)
    }
  }
}

handler.help = ['wm (renombrar stickers)']
handler.tags = ['tools']
handler.command = ['take', 'wm']

export default handler