let handler = async (m, { conn, usedPrefix }) => {
  let users = global.db.data.users
  let activeSubbots = global.subbots || []
  
  // 1. Filtrar usuarios que tienen token en la DB pero NO están en la lista de conectados
  let pendingSubbots = Object.entries(users).filter(([jid, user]) => {
    let id = jid.split('@')[0]
    return user.hasToken && user.subbotToken && !activeSubbots.some(bot => bot.id === id)
  })

  if (activeSubbots.length === 0 && pendingSubbots.length === 0) {
    return m.reply(`*⚙️ 𝙺𝙰𝚁𝙱𝙾𝚃 ⚙️*\n\n> 🍃 *𝚂𝙸𝙽 𝚁𝙴𝙶𝙸𝚂𝚃𝚁𝙾𝚂.*\n> 𝙽𝙾 𝙷𝙰𝚈 𝚂𝚄𝙱𝙱𝙾𝚃𝚂 𝙲𝙾𝙽𝙴𝙲𝚃𝙰𝙳𝙾𝚂 𝙽𝙸 𝚃𝙾𝙺𝙴𝙽𝚂 𝙴𝙽 𝙴𝚂𝙿𝙴𝚁𝙰.`)
  }

  let txt = `╭━〔 🤖 *𝙺𝙰𝚁𝙱𝙾𝚃 𝚂𝚄𝙱-𝚂𝚈𝚂𝚃𝙴𝙼* 🤖 〕━╮\n┃\n`

  // --- SECCIÓN: CONECTADOS ---
  txt += `┃ 🟢 *𝙲𝙾𝙽𝙴𝙲𝚃𝙰𝙳𝙾𝚂 (${activeSubbots.length})*\n`
  if (activeSubbots.length > 0) {
    activeSubbots.forEach((bot, index) => {
      let jid = bot.id + '@s.whatsapp.net'
      let token = users[jid]?.subbotToken || '𝚄𝙽𝙺𝙽𝙾𝚆𝙽'
      txt += `┃ ├ *${index + 1}.* @${bot.id}\n`
      txt += `┃ └ 🔑 *Token:* *${token}*\n`
    })
  } else {
    txt += `┃ └ *Ninguno activo*\n`
  }

  txt += `┃\n┃ ──────────────\n┃\n`

  // --- SECCIÓN: TOKENS PENDIENTES ---
  txt += `┃ ⏳ *𝚃𝙾𝙺𝙴𝙽𝚂 𝚂𝙸𝙽 𝚄𝚂𝙰𝚁 (${pendingSubbots.length})*\n`
  if (pendingSubbots.length > 0) {
    pendingSubbots.forEach(([jid, user], index) => {
      let id = jid.split('@')[0]
      txt += `┃ ├ *${index + 1}.* @${id}\n`
      txt += `┃ └ 🔑 *Token:* *${user.subbotToken}*\n`
    })
  } else {
    txt += `┃ └ *Ningún token libre*\n`
  }

  txt += `┃\n┃ 🍃 *𝙺𝙰𝚁𝙱𝙾𝚃 𝚂𝙴𝙻𝚅𝙰* 🍃\n╰━━━━━━━━━━━━━━━━━━╯`

  // Recopilamos todas las menciones para que salgan los nombres
  let allMentions = [
    ...activeSubbots.map(b => b.id + '@s.whatsapp.net'),
    ...pendingSubbots.map(([jid]) => jid)
  ]

  await conn.reply(m.chat, txt, m, { mentions: allMentions })
}

handler.help = ['subbots']
handler.tags = ['owner']
handler.command = /^(subbots|listsubbots|bots)$/i
handler.rowner = true 

export default handler