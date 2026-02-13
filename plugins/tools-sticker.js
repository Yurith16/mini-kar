import { Sticker, StickerTypes } from 'wa-sticker-formatter'

let handler = async (m, { conn, args, usedPrefix, command }) => {
  let stiker = false

  try {
    let q = m.quoted ? m.quoted : m
    let mime = (q.msg || q).mimetype || q.mediaType || ''

    if (!/webp|image|video/g.test(mime) && !args[0]) {
      await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } })
      return conn.reply(m.chat, '> 🖼️ 𝚁𝙴𝚂𝙿𝙾𝙽𝙳𝙴 𝙰 𝙸𝙼𝙰𝙶𝙴𝙽/𝚅𝙸𝙳𝙴𝙾', m)
    }

    await conn.sendMessage(m.chat, { react: { text: '🔄', key: m.key } })

    if (/webp|image|video/g.test(mime)) {
      if (/video/g.test(mime)) {
        if ((q.msg || q).seconds > 180) {
          await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } })
          return conn.reply(m.chat, '> ⚠️ 𝙼𝙰́𝚇𝙸𝙼𝙾 𝟹 𝙼𝙸𝙽𝚄𝚃𝙾𝚂', m)
        }
      }

      let img = await q.download?.()
      if (!img) throw new Error('Error al descargar')

      const stickerOptions = {
        type: StickerTypes.FULL,
        quality: 70,
      }

      const sticker = new Sticker(img, stickerOptions)
      stiker = await sticker.toBuffer()

    } else if (args[0]) {
      if (isUrl(args[0])) {
        const stickerOptions = {
          type: StickerTypes.FULL,
          quality: 70,
        }

        const sticker = new Sticker(args[0], stickerOptions)
        stiker = await sticker.toBuffer()
      } else {
        await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } })
        return conn.reply(m.chat, '> ❌ 𝚄𝚁𝙻 𝙸𝙽𝚅𝙰́𝙻𝙸𝙳𝙰', m)
      }
    }

    if (stiker) {
      const fkontak = await makeFkontak()
      await conn.sendMessage(m.chat, {
        sticker: stiker
      }, { quoted: fkontak })
      
      await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } })
    }

  } catch (error) {
    console.error('Error en sticker:', error)
    await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } })
    await conn.reply(m.chat, '> ⚠️ 𝙴𝚁𝚁𝙾𝚁 𝙰𝙻 𝙲𝚁𝙴𝙰𝚁', m)
  }
}

async function makeFkontak() {
  try {
    const { default: fetch } = await import('node-fetch')
    const res = await fetch('https://image2url.com/images/1765504298320-250ed158-9ddc-49d9-942b-2edfcc711cc8.jpg')
    const thumb2 = Buffer.from(await res.arrayBuffer())
    return {
      key: { participants: '0@s.whatsapp.net', remoteJid: 'status@broadcast', fromMe: false, id: 'Halo' },
      message: { locationMessage: { name: '🖼️ 𝚂𝚃𝙸𝙲𝙺𝙴𝚁 𝙲𝚁𝙴𝙰𝙳𝙾', jpegThumbnail: thumb2 } },
      participant: '0@s.whatsapp.net'
    }
  } catch {
    return undefined
  }
}

handler.help = [ 's (crear stickers)']
handler.tags = ['tools']
handler.command = ['s', 'sticker']

export default handler

const isUrl = (text) => {
  return text.match(new RegExp(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)(jpe?g|gif|png|webp)/, 'gi'))
}