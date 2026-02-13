import axios from 'axios'
import FormData from 'form-data'
import { checkReg } from '../lib/checkReg.js'

let handler = async (m, { conn, usedPrefix, command }) => {
    const user = global.db.data.users[m.sender]

    // 1. Verificación de registro
    if (await checkReg(m, user)) return

    // 2. Detectar multimedia
    let q = m.quoted ? m.quoted : m
    let mime = (q.msg || q).mimetype || ''
    
    if (!/audio|video|octet-stream/.test(mime)) {
        return m.reply(`> 🌸 Por favor, responda a un *Audio*, *Video* o *Documento* para identificar la música, cielo.`)
    }

    try {
        // 🌱 KarBot agudiza el oído...
        await m.react('🔍')

        let media = await q.download()
        if (!media) throw new Error('No pude descargar el archivo')
        
        await m.react('🌿')

        // Creamos el FormData con especificaciones exactas
        const formData = new FormData()
        formData.append('media', media, {
            filename: 'audio.mp3', // Nombre ficticio pero necesario
            contentType: mime.includes('octet-stream') ? 'audio/mpeg' : mime 
        })

        // 3. Petición a la API de Ananta
        const { data } = await axios.post('https://api.ananta.qzz.io/api/whatmusic', formData, {
            headers: {
                ...formData.getHeaders(),
                "x-api-key": "antebryxivz14"
            }
        })

        // Verificamos si la respuesta fue exitosa según tu nueva documentación (success: true)
        if (!data.success || !data.result) {
            await m.react('❌')
            return m.reply(`> No pude reconocer la música. A veces el secreto se queda en el aire... 😔`)
        }

        const res = data.result
        const yt = res.youtube || {}
        
        // --- DISEÑO DE RESULTADOS KARBOT ---
        // Usamos los campos según la nueva estructura (subtitle, primaryGenre, etc.)
        let txt = `> 🎵 *「🌱」 MÚSICA IDENTIFICADA*\n\n`
        txt += `> 🍃 *Título:* » ${res.title || yt.title || 'Desconocido'}\n`
        txt += `> ⚘ *Artista:* » ${res.subtitle || yt.artist || 'Desconocido'}\n`
        txt += `> 🌼 *Género:* » ${res.primaryGenre || 'Desconocido'}\n`
        txt += `> 🍀 *Duración:* » ${yt.timestamp || 'Desconocido'}\n`
        txt += `> 🌿 *YouTube:* » ${yt.url || 'No disponible'}`

        await m.react('⚙️')

        // Enviar con la miniatura de YouTube si está disponible
        if (yt.thumbnail) {
            await conn.sendMessage(m.chat, { image: { url: yt.thumbnail }, caption: txt }, { quoted: m })
        } else {
            await m.reply(txt)
        }

        await m.react('✅')

    } catch (e) {
        console.error('Error en whatmusic:', e)
        await m.react('❌')
        m.reply(`> Hubo un error técnico, mi vida. Puede que el archivo sea muy pesado o la conexión se perdió en el jardín.`)
    }
}

handler.help = ['whatmusic (detectar el nombre de la musica)']
handler.tags = ['tools']
handler.command = ['whatmusic', 'shazam', 'quien-es']
handler.group = true

export default handler