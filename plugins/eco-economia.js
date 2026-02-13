let handler = async (m, { conn, args, usedPrefix, command, isAdmin, isROwner }) => {
    let chat = global.db.data.chats[m.chat] || (global.db.data.chats[m.chat] = {})

    // Verificación de Admin (Firme y humana)
    if (!(isAdmin || isROwner)) {
        await conn.sendMessage(m.chat, { react: { text: '🚫', key: m.key } })
        return m.reply(`> 🔒 *Lo siento, pero solo los administradores pueden gestionar los módulos del sistema.*`)
    }

    let action = args[0]?.toLowerCase()

    if (action === 'on') {
        chat.economy = true
        await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } })
        return m.reply(`> ✅ *𝗘𝗖𝗢𝗡𝗢𝗠Í𝗔 𝗛𝗔𝗕𝗜𝗟𝗜𝗧𝗔𝗗𝗔*\n\n*He activado todos los registros financieros. A partir de ahora, todos pueden trabajar, cazar y usar el banco en este grupo.*`)
    } else if (action === 'off') {
        chat.economy = false
        await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } })
        return m.reply(`> ❌ *𝗘𝗖𝗢𝗡𝗢𝗠Í𝗔 𝗗𝗘𝗦𝗔𝗖𝗧𝗜𝗩𝗔𝗗𝗔*\n\n*He suspendido los servicios financieros en este chat. Las carteras y bancos han sido congelados hasta nuevo aviso.*`)
    } else {
        let estado = chat.economy ? 'ACTIVO' : 'INACTIVO'

        const mensajesEstado = [
            `*Actualmente el sistema económico está ${estado}. ¿Necesitas cambiar algo?*`,
            `*He revisado la configuración y la economía figura como ${estado}.*`,
            `*El estado actual de las finanzas es ${estado}. Dime si quieres activarlo o apagarlo.*`,
            `*Mis registros indican que el módulo de monedas está ${estado} por ahora.*`,
            `*Hola, el panel de control muestra que la economía está ${estado}.*`,
            `*¿Buscabas esto? El sistema de coins se encuentra ${estado} actualmente.*`,
            `*He verificado el chat y el flujo de dinero está ${estado}.*`,
            `*Para tu información, la economía del grupo está en modo ${estado}.*`,
            `*He recibido tu consulta: la gestión económica está ${estado}.*`,
            `*Así están las cosas: el módulo de economía permanece ${estado} aquí.*`
        ]

        let txt = `⚙️ *𝗖𝗢𝗡𝗙𝗜𝗚𝗨𝗥𝗔𝗖𝗜Ó𝗡 𝗗𝗘𝗟 𝗦𝗜𝗦𝗧𝗘𝗠𝗔*\n\n`
        txt += `${mensajesEstado[Math.floor(Math.random() * mensajesEstado.length)]}\n\n`
        txt += `> 💡 *Uso:* ${usedPrefix + command} on / off\n\n`
        txt += `*Solo los administradores pueden alterar esta configuración.*`

        await conn.sendMessage(m.chat, { react: { text: '⚙️', key: m.key } })
        return m.reply(txt)
    }
}

handler.help = ['economy']
handler.tags = ['economy']
handler.command = ['economy', 'economia']
handler.group = true

export default handler