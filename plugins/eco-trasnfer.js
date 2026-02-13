import { checkReg } from '../lib/checkReg.js'

let handler = async (m, { conn, args, usedPrefix, command }) => {
    let user = global.db.data.users[m.sender]
    if (await checkReg(m, user)) return

    // --- AYUDA ESTÉTICA ---
    if (!args[0] || !args[1] || !args[2]) {
        let help = `✨ *SISTEMA DE TRANSFERENCIA* ✨\n\n`
        help += `> *Uso:* \`${usedPrefix + command} [tipo] [cantidad] [ID]\`\n`
        help += `> *Tipos:* \`coin, diamond, hotpass\`\n\n`
        help += `_Ejemplo: ${usedPrefix + command} coin 5000 50496926150_\n`
        help += `> 💋 _Solo tratos entre usuarios registrados._`
        return m.reply(help)
    }

    let type = args[0].toLowerCase()
    let count = Math.max(1, parseInt(args[1]))
    let targetId = args[2].replace(/[^0-9]/g, '')
    let who = targetId + '@s.whatsapp.net'

    // --- VALIDACIONES DE ÉLITE ---
    if (isNaN(count)) return m.reply(`> 🎀 *Cariño:* La cantidad debe ser un número válido.`)
    
    let receiver = global.db.data.users[who]
    if (!receiver || !receiver.registered) {
        await m.react('🥀')
        return m.reply(`> 🥀 *ERROR*\n\nEse ID no pertenece a ningún usuario registrado en mi base de datos.`)
    }
    
    if (who === m.sender) return m.reply(`> 🙄 *Drama:* No puedes enviarte cosas a ti mismo, corazón.`)

    // --- MAPEO DE RECURSOS ---
    let types = {
        coin: 'coin',
        coins: 'coin',
        diamond: 'diamond',
        diamonds: 'diamond',
        hotpass: 'hotpass'
    }

    let item = types[type]
    if (!item) return m.reply(`> ⚠️ *Tipo inválido:* Usa \`coin\`, \`diamond\` o \`hotpass\`.`)

    if (user[item] < count) {
        await m.react('❌')
        return m.reply(`> ❌ *FRACASO*\n\nNo tienes suficiente saldo de *${item}* para esta transacción.`)
    }

    // --- EJECUCIÓN DEL INTERCAMBIO ---
    user[item] -= count
    receiver[item] = (receiver[item] || 0) + count

    await m.react('💸')
    
    let icon = item === 'coin' ? '🪙' : item === 'diamond' ? '💎' : '🎫'
    let label = item.toUpperCase()

    let txt = `💸 *TRANSFERENCIA EXITOSA* 💸\n\n`
    txt += `> *Emisor:* ${user.registeredName || conn.getName(m.sender)}\n`
    txt += `> *Receptor:* ${receiver.registeredName || targetId}\n`
    txt += `> *Monto:* ${count.toLocaleString()} ${icon} ${label}\n\n`
    txt += `> 💋 _El rastro de esta operación ha sido borrado. Disfruta tu fortuna._`

    return m.reply(txt)
}

handler.help = ['transferir']
handler.tags = ['economy']
handler.command = /^(transferir|transfer|dar|enviar)$/i
handler.register = true

export default handler