import axios from 'axios'
import { checkReg } from '../lib/checkReg.js'

let handler = async (m, { conn, usedPrefix, command }) => {
    const user = global.db.data.users[m.sender]

    if (await checkReg(m, user)) return

    try {
        await m.react('🔍')

        let who = m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : m.fromMe ? conn.user.jid : m.sender
        if (m.quoted) who = m.quoted.sender

        let pp = await conn.profilePictureUrl(who, 'image').catch(_ => 'https://telegra.ph/file/24fa9042b571ec3e144a1.jpg')
        
        await m.react('🌿')

        const apiUrl = `https://api.ananta.qzz.io/api/horny?avatar=${encodeURIComponent(pp)}`

        const response = await axios({
            method: 'get',
            url: apiUrl,
            headers: { "x-api-key": "antebryxivz14" },
            responseType: 'arraybuffer'
        })

        if (!response.data) throw new Error('No image')

        await m.react('⚙️')

        // Frases cortas y con sabor
        const frases = [
            `> 🍀 Licencia para permitir niveles altos de temperatura 🔥✨`,
            `> 🌿 Permiso oficial para andar de pecador por el jardín 😈🔥`,
            `> 🌼 Identificación de antojo nivel máximo detectada 🔥🔞`,
            `> 🍃 Licencia autorizada para quemar el grupo con tanta pasión 🔥🥵`
        ]
        
        const captionRandom = frases[Math.floor(Math.random() * frases.length)]

        await conn.sendMessage(m.chat, { 
            image: response.data, 
            caption: captionRandom 
        }, { quoted: m })

        await m.react('✅')

    } catch (e) {
        await m.react('❌')
        m.reply(`> Hubo un error al procesar el pecado, cielo. 🥀`)
    }
}

handler.help = ['horny (licencia hot)']
handler.tags = ['main']
handler.command = ['horny', 'hornylisence', 'licencia']
handler.group = true

export default handler