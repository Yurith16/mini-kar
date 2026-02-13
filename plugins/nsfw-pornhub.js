import axios from 'axios'
import { verificarSaldoNSFW, procesarPagoNSFW } from '../lib/nsfw-pago.js'
import { checkReg } from '../lib/checkReg.js'

let handler = async (m, { conn, args, usedPrefix, command }) => {
    let chat = global.db.data.chats[m.chat]
    let user = global.db.data.users[m.sender]

    // 1. Verificación de Registro
    if (await checkReg(m, user)) return

    // 2. Verificación NSFW
    if (!chat.nsfw) {
        await conn.sendMessage(m.chat, { react: { text: '🔞', key: m.key } })
        return m.reply(`> 🔞 *𝙽𝚂𝙵𝚆 𝙳𝙴𝚂𝙰𝙲𝚃𝙸𝚅𝙰𝙳𝙾*\n> 🌿 El burdel está cerrado por ahora.\n> 🔥 Actívalo con: *${usedPrefix}on nsfw*`)
    }

    // 3. Sistema de Pago NSFW (Verificación previa sin cobro)
    const v = verificarSaldoNSFW(m.sender, 'fuerte')
    if (!v.success) {
        await conn.sendMessage(m.chat, { react: { text: '🎟️', key: m.key } });
        return m.reply(v.mensajeError);
    }

    let text = args.join(" ").trim()
    if (!text || !text.match(/phub|pornhub/i)) {
        await conn.sendMessage(m.chat, { react: { text: '🥵', key: m.key } })
        return m.reply(`> 🌿 Proporcione un enlace válido de PornHub, cielo.`)
    }

    try {
        await conn.sendMessage(m.chat, { react: { text: '🔍', key: m.key } })

        const { data } = await axios.get(`https://api.ananta.qzz.io/api/phfans?url=${encodeURIComponent(text)}`, {
            headers: { "x-api-key": "antebryxivz14" }
        })

        if (!data.success || !data.data) throw new Error('API Error')

        const videoInfo = data.data
        const bestQuality = videoInfo.video.find(v => v.quality === '480') || videoInfo.video[0]
        
        await conn.sendMessage(m.chat, { react: { text: '📥', key: m.key } })

        const videoResponse = await axios({
            method: 'get',
            url: bestQuality.download,
            responseType: 'arraybuffer',
            timeout: 180000 
        })

        const buffer = videoResponse.data
        await conn.sendMessage(m.chat, { react: { text: '📤', key: m.key } })

        // 4. Lógica de Cobro Seguro: Solo procesamos si el envío es inminente
        const pago = procesarPagoNSFW(m.sender, 'fuerte')

        let caption = `> 🎬 *「 𝚅𝙸𝙳𝙴𝙾 」 ${videoInfo.title}*\n`
        caption += `> 🍃 *Calidad:* » ${bestQuality.quality}p\n`
        caption += `> ⚘ *Peso:* » ${bestQuality.size_mb} MB\n\n`
        caption += pago.caption 

        // Enviamos el video
        await conn.sendMessage(m.chat, {
            document: buffer, 
            caption: caption,
            mimetype: 'video/mp4',
            fileName: `${videoInfo.title}.mp4`
        }, { quoted: m })

        await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } })

    } catch (e) {
        console.error(e)
        // Si hay un error, no llamamos a procesarPagoNSFW, por lo que el saldo queda intacto.
        await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } })
        m.reply(`> 🥀 *Error en la descarga:* El video es demasiado pesado o el enlace expiró.\n> 🎫 *𝚃𝚞𝚜 𝚙𝚊𝚜𝚎𝚜 𝚎𝚜𝚝á𝚗 𝚊 𝚜𝚊𝚕𝚟𝚘, 𝚗𝚘 𝚜𝚎 𝚑𝚊 𝚌𝚘𝚋𝚛𝚊𝚍𝚘 𝚗𝚊𝚍𝚊.*`)
    }
}

handler.help = ['phdl + url']
handler.tags = ['NSFW']
handler.command = /^(phdl|pornhubdl|phvideo)$/i
handler.register = true
handler.group = true

export default handler