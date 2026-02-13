import { checkReg } from '../lib/checkReg.js'

let handler = async (m, { conn, usedPrefix, command }) => {
    const user = global.db.data.users[m.sender]

    // 1. Verificación de registro
    if (await checkReg(m, user)) return

    let who = m.mentionedJid && m.mentionedJid.length > 0 ? m.mentionedJid[0] : (m.quoted ? m.quoted.sender : null)
    let nameSender = conn.getName(m.sender)
    
    if (!who) return m.reply(`> ¿Sobre quién piensas terminar hoy, cielo? Etiqueta a alguien.`)
    
    let nameTarget = conn.getName(who)
    let str = ""

    // --- FRASES DE CLÍMAX ---
    const frasesCum = [
        `💦 ¡Qué intensidad! *${nameSender}* no pudo contenerse más y terminó cubriendo a *${nameTarget}* por completo.`,
        `🌸 El clímax ha llegado... *${nameSender}* dejó su marca más pegajosa sobre *${nameTarget}*.`,
        `🎭 ¡Escándalo total! *${nameSender}* ha dejado a *${nameTarget}* en una situación bastante blanca y comprometedora.`,
        `🔥 ¡Final explosivo! *${nameSender}* se liberó sobre *${nameTarget}* en un momento de puro drama.`
    ]
    str = frasesCum[Math.floor(Math.random() * frasesCum.length)]

    // --- LISTA DE RECURSOS (Selección aleatoria) ---
    const videos = [
        'https://image2url.com/r2/default/videos/1769730511072-05c348e5-5f5c-4a61-94b0-608cc732987e.mp4',
        'https://image2url.com/r2/default/videos/1769730916958-c1d193a1-4230-45b6-a229-01a1da33fe16.mp4'
    ]
    const media = videos[Math.floor(Math.random() * videos.length)]

    try {
        await m.react('💦')
        
        // Enviamos el video seleccionado aleatoriamente con gifPlayback
        await conn.sendMessage(m.chat, { 
            video: { url: media }, 
            gifPlayback: true, 
            caption: `> ${str}`, 
            mentions: [who] 
        }, { quoted: m })
        
    } catch (e) {
        await m.react('❌')
        console.error("Error en Cum:", e.message)
        m.reply(`> 🥀 El momento fue tan fuerte que el sistema se quedó sin aliento.`)
    }
}

handler.help = ['cum @user']
handler.tags = ['social']
handler.command = ['cum', 'correrse', 'terminar']
handler.group = true

export default handler