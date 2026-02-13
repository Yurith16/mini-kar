import fetch from 'node-fetch'

let handler = async (m, { conn, usedPrefix, command }) => {
  const ctxErr = (global.rcanalx || {})
  const ctxOk = (global.rcanalr || {})

  try {
    await m.react('🧧')
    
    conn.sendPresenceUpdate('composing', m.chat)
    
    let waitingMsg = await conn.sendMessage(m.chat, { 
        text: `> Un momento... estoy eligiendo a alguien especial para ti. ✨` 
    }, { quoted: m })

    let res = await fetch('https://api.waifu.pics/sfw/waifu')
    if (!res.ok) throw new Error()

    let json = await res.json()
    if (!json.url) throw new Error()

    let caption = `*Mírala bien...* ✨

> Me pregunto si ella te daría la atención que tanto me pides. 
*No te acostumbres, solo quería que vieras algo lindo por una vez.* 💖`

    await conn.sendFile(m.chat, json.url, 'waifu.jpg', caption, m, null, ctxOk)

    if (waitingMsg) {
        await conn.sendMessage(m.chat, { delete: waitingMsg.key })
    }

    await m.react('✅')

} catch (error) {
    await m.react('❌')
    await conn.reply(m.chat, `> No pude encontrar a nadie en este momento. Inténtalo después.`, m, ctxErr)
}
}

handler.help = ['waifu']
handler.tags = ['anime', 'fun']
handler.command = ['waifu', 'waifus']
handler.group = true
handler.register = true

export default handler