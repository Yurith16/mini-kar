let handler = async (m, { conn, text, usedPrefix, command }) => {
    let [id, tiempo] = text.split(' ')

    if (!id) return m.reply(`> 🛠️ *Uso:* ${usedPrefix + command} <número> [tiempo]`)

    let who = id.includes('@s.whatsapp.net') ? id : id.replace(/[^0-9]/g, '') + '@s.whatsapp.net'
    let user = global.db.data.users[who]
    if (!user) return m.reply(`❌ El usuario no existe en la base de datos.`)

    // --- ELIMINAR PREMIUM ---
    if (command === 'delprem') {
        user.premium = false
        user.premiumTime = 0
        await m.react('✅')
        return m.reply(`✅ Premium eliminado para: *${id.split('@')[0]}*`)
    }

    // --- AÑADIR PREMIUM ---
    let txtFecha = 'PERMANENTE'
    if (tiempo) {
        let unidad = tiempo.toLowerCase().slice(-1)
        let cantidad = parseInt(tiempo)
        let ms = unidad === 'h' ? cantidad * 3600000 : unidad === 'd' ? cantidad * 86400000 : null
        
        if (!ms) return m.reply('❌ Usa formato: 1h o 1d')
        
        let ahora = Date.now()
        user.premiumTime = (user.premiumTime > ahora ? user.premiumTime : ahora) + ms
        txtFecha = new Date(user.premiumTime).toLocaleString('es-HN')
    } else {
        user.premiumTime = 0
    }

    user.premium = true
    if (!user.customPerfil) user.customPerfil = { foto: '', emoji: '💎', frase: '¡Soy un usuario Élite!' }

    await m.react('💎')
    m.reply(`💎 *${id.split('@')[0]}* ahora es Premium.\n> *Vence:* ${txtFecha}`)

    // Aviso al usuario
    conn.sendMessage(who, { text: `👑 El Admin te ha asignado tiempo Premium.\n*Vence:* ${txtFecha}` })
}

handler.help = ['addprem', 'delprem']
handler.tags = ['owner']
handler.command = /^(addprem|delprem)$/i
handler.rowner = true 

export default handler