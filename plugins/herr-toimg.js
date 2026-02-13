let handler = async (m, { conn, usedPrefix, command }) => {
    // 1. Buscamos el sticker en el mensaje citado o en el mismo mensaje
    let q = m.quoted ? m.quoted : m
    let mime = (q.msg || q).mimetype || q.mediaType || ''

    // 2. Validación ultra-flexible
    if (!/sticker|webp/g.test(mime)) {
        return m.reply(`*⚠️ Responde a un sticker* con el comando: *${usedPrefix + command}*`)
    }

    await m.react('⏳')

    try {
        // 3. Descargamos usando la función nativa del bot
        let media = await q.download()
        
        if (!media) throw new Error('No se pudo descargar el medio')

        // 4. Enviamos la imagen
        await conn.sendMessage(m.chat, { 
            image: media, 
            caption: '*✅ Conversión exitosa*' 
        }, { quoted: m })

        await m.react('✅')

    } catch (e) {
        console.error(e)
        await m.react('❌')
        m.reply('*❌ Error:* No se pudo procesar el sticker. Intenta con otro.')
    }
}

handler.help = ['toimg']
handler.tags = ['tools']
handler.command = ['toimg', 'stickerimg', 'toimage']

export default handler