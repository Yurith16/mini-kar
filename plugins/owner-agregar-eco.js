const HOJITAS = ['🌿', '🍃', '🍀', '🌱', '☘️']
function getLeaf() { return HOJITAS[Math.floor(Math.random() * HOJITAS.length)] }

let handler = async (m, { conn, text, usedPrefix, command }) => {
    // 1. Descomponer el texto: item cantidad ID
    // Ejemplo: .add coin 100 50496926150
    let [type, amount, id] = text.split(' ')

    if (!type || !amount) {
        return m.reply(`> 🛠️ *Uso Correcto:*\n> ${usedPrefix + command} <tipo> <cantidad> <número>\n\n> 💡 *Ejemplo:* ${usedPrefix + command} coin 500 50496926150\n> ✨ *Tipos:* coin, diamond, hotpass, exp`)
    }

    // 2. Formatear el JID del usuario
    let who = id ? (id.replace(/[^0-9]/g, '') + '@s.whatsapp.net') : (m.quoted ? m.quoted.sender : m.mentionedJid[0])
    
    if (!who) return m.reply(`> 🍃 *Cielo, dime a quién le daremos el regalo.* (Menciona, responde a un mensaje o escribe el número)`)

    let user = global.db.data.users[who]
    if (!user) return m.reply(`❌ Ese usuario no está en mi registro de la selva.`)

    // 3. Validar el tipo de item y sumar
    let item = type.toLowerCase()
    let cant = parseInt(amount)
    if (isNaN(cant)) return m.reply('❌ La cantidad debe ser un número válido.')

    let h = getLeaf()
    let name = id.split('@')[0]

    switch (item) {
        case 'coin':
        case 'coins':
            user.coin = (user.coin || 0) + cant
            await m.react('💰')
            break
        case 'diamond':
        case 'diamante':
            user.diamond = (user.diamond || 0) + cant
            await m.react('💎')
            break
        case 'hotpass':
        case 'pass':
            user.hotpass = (user.hotpass || 0) + cant
            await m.react('🎫')
            break
        case 'exp':
        case 'experience':
            user.exp = (user.exp || 0) + cant
            await m.react('🆙')
            break
        default:
            return m.reply(`❌ El item *${type}* no es válido. Usa: coin, diamond, hotpass o exp.`)
    }

    // 4. Mensaje de confirmación KarBot Style
    let txt = `> ${h} *RECURSOS ASIGNADOS* ${h}\n\n`
    txt += `> 👤 *Usuario:* @${who.split('@')[0]}\n`
    txt += `> 📦 *Item:* ${item.toUpperCase()}\n`
    txt += `> 📈 *Cantidad:* +${cant.toLocaleString()}\n\n`
    txt += `> ✨ *El Admin ha bendecido tu cartera.*`

    await conn.reply(m.chat, txt, m, { mentions: [who] })

    // Aviso privado al usuario para que se emocione
    await conn.sendMessage(who, { 
        text: `🎁 *¡NOTIFICACIÓN DE REGALO!*\n\nUn administrador te ha enviado *${cant.toLocaleString()} ${item}*.\n¡Disfrútalos en la selva de KarBot! 🍃` 
    })
}

handler.help = ['add <tipo> <cant> <id>']
handler.tags = ['owner']
handler.command = /^(add|agregar|añadir)$/i
handler.rowner = true // Solo para el mero mero

export default handler