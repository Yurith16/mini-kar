let handler = async (m, { conn, text, usedPrefix, command }) => {
    // Si no hay texto, intentamos obtenerlo de una mención o respuesta
    let who = text ? (text.replace(/[^0-9]/g, '') + '@s.whatsapp.net') : (m.quoted ? m.quoted.sender : m.mentionedJid[0])

    if (!who) return m.reply(`> 🛠️ *Uso:* ${usedPrefix + command} <número/tag/mención>`)

    let user = global.db.data.users[who]
    if (!user) return m.reply(`❌ Este usuario no existe en mi base de datos, cielo.`)

    // El drama de la ruptura: le quitamos los permisos
    user.hasToken = false
    user.subbotToken = ''
    
    // Opcional: Si quieres que también se desconecte si está activo actualmente
    let index = global.subbots.findIndex(s => s.id === who.split('@')[0])
    if (index !== -1) {
        try {
            global.subbots[index].ws.close()
            global.subbots.splice(index, 1)
        } catch (e) {
            console.error('Error al cerrar sesión forzada:', e)
        }
    }

    let h = '🥀' // Hojita marchita por el ban
    let txt = `> ${h} *ACCESO REVOCADO* ${h}\n\n`
    txt += `> 👤 *Usuario:* @${who.split('@')[0]}\n`
    txt += `> 🚫 *Estado:* Token eliminado\n\n`
    txt += `> ✨ *Ya no tiene permiso para ser SubBot.*`

    await conn.reply(m.chat, txt, m, { mentions: [who] })

    // Notificación al "ex-autorizado"
    await conn.sendMessage(who, { 
        text: `💔 *AVISO DE KARBOT*\n\nTu token de Sub-Bot ha sido revocado por el Administrador.\nNo podrás volver a vincularte hasta que se te asigne un nuevo código.` 
    })
}

handler.help = ['deltoken <id>']
handler.tags = ['owner']
handler.command = /^(deltoken|quitartoken|revoketoken)$/i
handler.rowner = true 

export default handler