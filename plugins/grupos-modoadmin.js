import { checkReg } from '../lib/checkReg.js'

let handler = async (m, { conn, usedPrefix, command, isAdmin, isROwner }) => {
    const userId = m.sender
    const user = global.db.data.users[userId]
    
    // Verificación de registro
    if (await checkReg(m, user)) return
    
    if (!m.isGroup) {
        await m.react('❌')
        return m.reply('> Solo funciona en grupos.')
    }

    // Solo admins o el creador pueden usar este comando
    if (!isAdmin && !isROwner) {
        await m.react('🚫')
        return m.reply('> Solo administradores.')
    }

    let chat = global.db.data.chats[m.chat]
    let args = m.text.trim().split(' ').slice(1)
    let action = args[0]?.toLowerCase()

    if (!action || (action !== 'on' && action !== 'off')) {
        await m.react('🌿')
        
        let status = chat.adminmode ? 'activado' : 'desactivado'
        let mensaje = `> 🍃 *Modo Admin* ${status}\n\n`
        mensaje += `> Uso: ${usedPrefix}admin [on/off]`
        
        return m.reply(mensaje)
    }

    if (action === 'on') {
        if (chat.adminmode) {
            await m.react('ℹ️')
            return m.reply('> Ya está activado.')
        }
        
        chat.adminmode = true
        
        // Reacción inicial
        await m.react('🔧')
        // El engranaje final de KarBot ⚙️
        await m.react('⚙️')
        
        m.reply(`> 🍃 *Modo Admin activado*\n\n> Solo admins pueden usar comandos.`)

    } else if (action === 'off') {
        if (!chat.adminmode) {
            await m.react('ℹ️')
            return m.reply('> Ya está desactivado.')
        }
        
        chat.adminmode = false
        
        // Reacción inicial
        await m.react('🔧')
        // El engranaje final de KarBot ⚙️
        await m.react('⚙️')
        
        m.reply(`> 🍃 *Modo Admin desactivado*\n\n> Todos pueden usar comandos.`)
    }
}

handler.help = ['admin on/off']
handler.help = ['admin on', 'admin off']
handler.tags = ['group']
handler.command = /^(admin)$/i
handler.group = true
handler.admin = true

export default handler