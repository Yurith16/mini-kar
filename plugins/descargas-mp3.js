import axios from 'axios'
import yts from 'yt-search'
import { checkReg } from '../lib/checkReg.js'

// Mapa para gestionar las descargas activas y evitar el abuso
let descargasActivas = new Set()

let handler = async (m, { conn, text, usedPrefix, command }) => {
    const user = global.db.data.users[m.sender]

    // 1. Verificación de registro (Estilo KarBot)
    if (await checkReg(m, user)) return

    // 2. Control de abuso (Una descarga a la vez)
    if (descargasActivas.has(m.sender)) {
        return m.reply(`> ⚠️ *𝗗𝗘𝗧𝗘𝗡𝗧𝗘:* No abuses, cielo. Ya tienes una descarga en proceso. Espera a que termine para pedir otra melodía.`)
    }

    // 3. Ayuda humanizada
    if (!text) return m.reply(`> ¿Qué música desea buscar hoy, cielo?`)

    try {
        // Añadir a descargas activas
        descargasActivas.add(m.sender)

        // Secuencia de reacciones 🔍🌿🍀🎶
        const reacciones = ['🔍', '🌿', '🍀', '🎶']
        for (const reacc of reacciones) {
            await m.react(reacc)
        }

        // Búsqueda en YouTube
        const search = await yts(text)
        if (!search.videos.length) {
            descargasActivas.delete(m.sender)
            await m.react('❌')
            return m.reply(`> Lo siento, no encontré nada sobre "${text}".`)
        }

        const video = search.videos[0]
        const { title, url, thumbnail, author, views, duration, ago } = video

        // --- DISEÑO DE DETALLES KARBOT ---
        const videoDetails = `> 🎵 *「🌱」 ${title}*\n\n` +
            `> 🍃 *Canal:* » ${author.name}\n` +
            `> ⚘ *Duración:* » ${duration.timestamp}\n` +
            `> 🌼 *Vistas:* » ${(views || 0).toLocaleString()}\n` +
            `> 🍀 *Publicado:* » ${ago || 'Reciente'}\n` +
            `> 🌿 *Enlace:* » ${url}`

        await conn.sendMessage(m.chat, {
            image: { url: thumbnail },
            caption: videoDetails
        }, { quoted: m })

        let audioData
        let success = false

        // === MOTOR 1: API ANANTA (Prioridad) ===
        try {
            const resAnanta = await axios({
                method: 'get',
                url: `https://api.ananta.qzz.io/api/yt-mp3?url=${encodeURIComponent(url)}`,
                headers: { "x-api-key": "antebryxivz14" },
                responseType: 'arraybuffer',
                timeout: 30000 // 30 segundos de espera
            })
            
            if (resAnanta.data) {
                audioData = resAnanta.data
                success = true
            }
        } catch (e) {
            console.log('API Ananta falló, intentando motor secundario...')
        }

        // === MOTOR 2: API SPARKY (Backup) ===
        if (!success) {
            try {
                const { data: resSparky } = await axios.get(`https://api-aswin-sparky.koyeb.app/api/downloader/song?search=${encodeURIComponent(url)}`)
                if (resSparky.status && resSparky.data.url) {
                    const resAudio = await axios.get(resSparky.data.url, { responseType: 'arraybuffer' })
                    audioData = resAudio.data
                    success = true
                }
            } catch (e) {
                console.error('Ambas APIs fallaron:', e)
            }
        }

        if (success && audioData) {
            // Enviar el audio normal (NO como documento)
            await conn.sendMessage(m.chat, {
                audio: audioData,
                mimetype: 'audio/mpeg',
                ptt: false,
                fileName: `${title}.mp3`
            }, { quoted: m })
            await m.react('⚙️')
        } else {
            throw new Error('No se pudo obtener el audio de ninguna API')
        }

    } catch (e) {
        console.error(e)
        await m.react('❌')
        await m.reply(`> Lo siento, hubo un drama con las APIs y no pude obtener tu música.`)
    } finally {
        // Quitar de descargas activas siempre, pase lo que pase
        descargasActivas.delete(m.sender)
    }
}

handler.help = ['mp3 (musica en formato mp3)']
handler.tags = ['downloader']  
handler.command = ['mp3']
handler.group = true

export default handler