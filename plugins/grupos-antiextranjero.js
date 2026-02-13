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
        
        let status = chat.antiExtranjero ? 'activado' : 'desactivado'
        let mensaje = `> Anti extranjero ${status}\n\n`
        mensaje += `> Uso: ${usedPrefix}antif [on/off]`
        
        return m.reply(mensaje)
    }

    if (action === 'on') {
        if (chat.antiExtranjero) {
            await m.react('ℹ️')
            return m.reply('> Ya está activado.')
        }
        
        chat.antiExtranjero = true
        
        // Reacción inicial
        await m.react('🔧')
        // El engranaje final de KarBot ⚙️
        await m.react('⚙️')
        
        m.reply('> Anti extranjero activado')

    } else if (action === 'off') {
        if (!chat.antiExtranjero) {
            await m.react('ℹ️')
            return m.reply('> Ya está desactivado.')
        }
        
        chat.antiExtranjero = false
        
        // Reacción inicial
        await m.react('🔧')
        // El engranaje final de KarBot ⚙️
        await m.react('⚙️')
        
        m.reply('> Anti extranjero desactivado')
    }
}

handler.help = ['antif on/off (antiextr)']
handler.tags = ['group']
handler.command = /^(antiextranjero|antif|antiforeign)$/i
handler.group = true
handler.admin = true

export default handler