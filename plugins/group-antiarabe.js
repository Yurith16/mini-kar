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

    if (!isAdmin && !isROwner) {
        await m.react('🚫')
        return m.reply('> Solo administradores.')
    }

    let chat = global.db.data.chats[m.chat]
    let args = m.text.trim().split(' ').slice(1)
    let action = args[0]?.toLowerCase()

    if (!action || (action !== 'on' && action !== 'off')) {
        await m.react('🌿')
        
        let status = chat.antiArabe ? 'activado' : 'desactivado'
        let mensaje = `> Anti Arabe ${status}\n\n`
        mensaje += `> Uso: ${usedPrefix}antiarabe [on/off]`
        
        return m.reply(mensaje)
    }

    if (action === 'on') {
        if (chat.antiArabe) {
            await m.react('ℹ️')
            return m.reply('> Ya está activado.')
        }
        
        chat.antiArabe = true
        
        // Reacción inicial
        await m.react('🔧')
        // El engranaje final de KarBot ⚙️
        await m.react('⚙️')
        
        m.reply('> Anti Arabe activado')

    } else if (action === 'off') {
        if (!chat.antiArabe) {
            await m.react('ℹ️')
            return m.reply('> Ya está desactivado.')
        }
        
        chat.antiArabe = false
        
        // Reacción inicial
        await m.react('🔧')
        // El engranaje final de KarBot ⚙️
        await m.react('⚙️')
        
        m.reply('> Anti Arabe desactivado')
    }
}

handler.help = ['antiarabe on', 'antiarabe off']
handler.tags = ['group']
handler.command = /^(antiarabe|arabe)$/i
handler.group = true
handler.admin = true

export default handler