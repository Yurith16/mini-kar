import { checkReg } from '../lib/checkReg.js'

let handler = async (m, { conn, usedPrefix, command }) => {
    const user = global.db.data.users[m.sender]

    // 1. Verificación de registro KarBot
    if (await checkReg(m, user)) return

    // Determinamos quién recibe el beso
    let who = m.mentionedJid && m.mentionedJid.length > 0 ? m.mentionedJid[0] : (m.quoted ? m.quoted.sender : null)
    let nameSender = conn.getName(m.sender)
    let str = ""

    // --- SISTEMA DE FRASES CON DRAMA AMOROSO ---
    if (who) {
        let nameTarget = conn.getName(who)
        const frasesConAlguien = [
            `🩷 *${nameSender}* ha sellado sus sentimientos con un beso para *${nameTarget}*... ¡El aire se siente eléctrico!`,
            `🌸 Un pétalo de cerezo cayó justo cuando *${nameSender}* le dio un dulce beso a *${nameTarget}*.`,
            `🎭 ¡Escándalo en el jardín! *${nameSender}* no pudo resistir más y besó apasionadamente a *${nameTarget}*.`,
            `✨ Bajo la luz mágica de KarBot, *${nameSender}* y *${nameTarget}* comparten un momento inolvidable.`
        ]
        str = frasesConAlguien[Math.floor(Math.random() * frasesConAlguien.length)]
    } else {
        who = m.sender
        const frasesSolo = [
            `🩷 *${nameSender}* se está dando mucho amor frente al espejo. ¡Autoestima por las nubes!`,
            `🍃 *${nameSender}* lanzó un beso al viento... ¿A quién irá dirigido este secreto?`,
            `🎭 El drama de la soledad: *${nameSender}* se envía un beso a sí mismo en este escenario vacío.`
        ]
        str = frasesSolo[Math.floor(Math.random() * frasesSolo.length)]
    }

    // --- REPERTORIO VISUAL (Soporta MP4 y GIF Directo) ---
    const besos = [
        'https://media.tenor.com/_8oadF3hZwIAAAPo/kiss.mp4',
        'https://media.tenor.com/cQzRWAWrN6kAAAPo/ichigo-hiro.mp4',
        'https://media.tenor.com/kmxEaVuW8AoAAAPo/kiss-gentle-kiss.mp4',
        'https://media.tenor.com/NO6j5K8YuRAAAAPo/leni.mp4',
        'https://media.tenor.com/xYUjLVz6rJoAAAPo/mhel.mp4',
        'https://media.tenor.com/ZDqsYLDQzIUAAAPo/shirayuki-zen-kiss-anime.mp4',
        'https://media.tenor.com/LrKmxrDxJN0AAAPo/love-cheek.mp4'
    ]
    const media = besos[Math.floor(Math.random() * besos.length)]

    try {
        await m.react('🩷')
        
        // Enviamos como video con gifPlayback para que funcione con cualquier URL directa
        await conn.sendMessage(m.chat, { 
            video: { url: media }, 
            gifPlayback: true, 
            caption: `> ${str}`, 
            mentions: who !== m.sender ? [who] : [] 
        }, { quoted: m })
        
    } catch (e) {
        await m.react('❌')
        console.error("Error en Kiss:", e.message)
        // Fallback en caso de que la URL de imagen2url sea caprichosa
        m.reply(`> 🥀 Hubo un pequeño drama visual, pero el sentimiento de *${nameSender}* es real.`)
    }
}

handler.help = ['kiss @user']
handler.tags = ['anime']
handler.command = ['kiss', 'besar', 'beso']
handler.group = true

export default handler