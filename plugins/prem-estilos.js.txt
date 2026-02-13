import { premiumStyles } from '../lib/styles.js'

let handler = async (m, { conn, text, usedPrefix, command }) => {
    let user = global.db.data.users[m.sender]
    
    // Verificación Premium
    if (!user.premium) return m.reply(`> 💎 *ACCESO PREMIUM*\n\n> Esta función es exclusiva para miembros **Elite**.`)

    // Mantener el estilo actual para mostrar el menú, o luxury por defecto
    let currentStyle = user.prefStyle || "luxury"
    let s = premiumStyles[currentStyle] || premiumStyles["luxury"]

    const fuentes = {
        luxury: "ＬＵＸＵＲＹ ⚜️",
        cyber: "ＣＹＢＥＲ ⚡",
        inferno: "ＩＮＦＥＲＮＯ 🔥",
        ghost: "ＧＨＯＳＴ 👻",
        glitch: "ＧＬＩＴＣＨ 👾"
    }

    if (!text) {
        let txt = s ? `${s.top}\n\n` : ''
        txt += `✨ *CONFIGURACIÓN DE ESTILO*\n`
        txt += `_Personaliza la apariencia de tu interfaz._\n\n`
        
        Object.keys(premiumStyles).forEach(style => {
            let isCurrent = user.prefStyle === style ? "✅" : "▫️"
            txt += `> ${isCurrent} \`${style}\` — ${fuentes[style] || style.toUpperCase()}\n`
        })
        
        txt += `\n💡 *Uso:* \`${usedPrefix + command} ghost\``
        if (s) txt += `\n\n${s.footer}`
        
        return await conn.sendMessage(m.chat, { text: txt }, { quoted: m?.key ? m : null })
    }

    let input = text.toLowerCase().trim()
    
    if (!premiumStyles[input]) {
        return await conn.sendMessage(m.chat, { 
            text: `> ❌ *ESTILO NO ENCONTRADO*\n\n> El tema \`${input}\` no existe en nuestro catálogo Elite.` 
        }, { quoted: m?.key ? m : null })
    }

    // Guardar preferencia (Persistencia activada)
    user.prefStyle = input
    let newS = premiumStyles[input]

    if (newS.react) await m.react(newS.react)
    
    let confirm = newS ? `${newS.top}\n\n` : ''
    confirm += `✅ *ESTILO ACTUALIZADO*\n\n`
    confirm += `> 🎨 *Tema:* ${fuentes[input] || input.toUpperCase()}\n`
    confirm += `> ✨ *Estado:* Aplicado con éxito\n\n`
    confirm += `_A partir de ahora, tus juegos y tienda usarán este diseño._`
    if (newS) confirm += `\n\n${newS.footer}`

    return await conn.sendMessage(m.chat, { text: confirm }, { quoted: m?.key ? m : null })
}

handler.help = ['estilos']
handler.tags = ['premium']
handler.command = ['style', 'estilo', 'estilos']

export default handler