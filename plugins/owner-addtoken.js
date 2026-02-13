import { randomBytes } from 'crypto'

let handler = async (m, { conn, text, usedPrefix, command }) => {
    if (!text) return m.reply(`> 🛠️ *Uso:* ${usedPrefix + command} <número>\n> *Ejemplo:* ${usedPrefix + command} 50496926150`)

    let who = text.replace(/[^0-9]/g, '') + '@s.whatsapp.net'
    let user = global.db.data.users[who]

    if (!user) return m.reply(`❌ El usuario no existe en mi registro de la selva.`)

    // Generamos un token único de 8 caracteres
    let token = randomBytes(4).toString('hex').toUpperCase()
    
    // Guardamos el token en la base de datos del usuario
    user.subbotToken = token
    user.hasToken = true

    let txt = `╭━〔 🌿 *TOKEN GENERADO* 🌿 〕━╮\n┃\n`
    txt += `┃ 🍃 *Usuario:* @${who.split('@')[0]}\n`
    txt += `┃ 🔑 *Token:* ${token}\n`
    txt += `┃ ⚠️ *Estado:* Autorizado\n┃\n`
    txt += `╰━━━━━━━━━━━━━━━━━━╯`

    await conn.reply(m.chat, txt, m, { mentions: [who] })

    // Avisar al usuario por privado
    await conn.sendMessage(who, { 
        text: `🌿 *¡HOLA CIELO!*\n\nEl Owner te ha otorgado un Token para ser *Sub-Bot*.\n\n🔑 *Tu Token:* ${token}\n\n> Ahora puedes usar el comando: *${usedPrefix}code ${token}*` 
    })
}

handler.help = ['addtoken <id>']
handler.tags = ['owner']
handler.command = /^(addtoken|gentoken)$/i
handler.rowner = true 

export default handler