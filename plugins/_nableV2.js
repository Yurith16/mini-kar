let handler = async (m, { conn, usedPrefix }) => {
    // Reacción de engranaje para configuración
    await m.react('⚙️')

    let chat = global.db.data.chats[m.chat]

    let info = `*CONFIGURACIÓN DEL GRUPO*

• *AntiLink:* ${chat.antiLink ? '*on*' : '*off*'}
• *AntiArabe:* ${chat.antiArabe ? '*on*' : '*off*'}
• *Welcome:* ${chat.welcome ? '*on*' : '*off*'}
• *NSFW:* ${chat.nsfw ? '*on*' : '*off*'}
• *Economy:* ${chat.economy ? '*on*' : '*off*'}
• *Gacha:* ${chat.gacha ? '*on*' : '*off*'}

${chat.rootowner ? '*Nota:* Solo mi creador puede usar comandos.' : ''}`.trim()

    await m.reply(info)
}

handler.help = ['config', 'settings']
handler.tags = ['group']
handler.command = /^(config|settings|configuracion)$/i
handler.group = true

export default handler