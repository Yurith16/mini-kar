import { saveDatabase } from '../lib/db.js'

let handler = async (m, { conn, text, usedPrefix, command }) => {
    let user = global.db.data.users[m.sender]
    if (user?.registered) return m.reply(`> 🎀 *Aviso:* Ya estás registrado, cielo.`)

    // Validación de nombre: entre 3 y 30 caracteres
    if (!text || text.length < 3) {
        return m.reply(`> 🎀 *Uso correcto:*\n> \`${usedPrefix + command} nombre\`\n\n*Ejemplo:*\n> \`${usedPrefix + command} KarBot\``)
    }

    if (text.length > 30) return m.reply("> 🎀 *Error:* El nombre es demasiado largo, máximo 30 caracteres.")

    // Guardar datos básicos
    user.registeredName = text.trim()
    user.age = 0 // Valor por defecto
    user.genre = 'no definido' // Valor por defecto
    user.registered = true
    user.regDate = new Date().toLocaleDateString('es-ES')

    // Bono inicial de KarBot
    user.coin = (user.coin || 0) + 10000
    user.diamond = (user.diamond || 0) + 5
    user.hotpass = (user.hotpass || 0) + 10

    await m.react('✅')
    
    let txt = `✅ *REGISTRO EXITOSO*\n\n`
    txt += `> *Nombre:* ${user.registeredName}\n`
    txt += `> *Fecha:* ${user.regDate}\n\n`
    txt += `🎁 *BONO:* +10k Coins, +5 Dmd, +10 HotPass.`

    await m.reply(txt)
    await saveDatabase()
}

handler.help = ['reg']
handler.tags = ['main']
handler.command = /^(reg|registro)$/i

export default handler