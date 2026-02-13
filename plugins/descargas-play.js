import axios from 'axios'
import yts from 'yt-search'
import ffmpeg from 'fluent-ffmpeg'
import ffmpegPath from 'ffmpeg-static'
import fs from 'fs'
import path from 'path'
import { checkReg } from '../lib/checkReg.js'

// Configuración de FFmpeg Estático
ffmpeg.setFfmpegPath(ffmpegPath)

// Control de descargas activas por usuario
const activeAudioDownloads = new Map()

let handler = async (m, { conn, text, usedPrefix, command }) => {
    const userId = m.sender
    const user = global.db.data.users[userId]

    if (await checkReg(m, user)) return

    if (!text) {
        await m.react('🤔')
        return m.reply(`> ¿Qué melodía desea escuchar hoy, cielo?`)
    }

    if (activeAudioDownloads.has(userId)) {
        await m.react('⏳')
        return m.reply(`> ⏳ *¡Paciencia, corazón!* Estoy puliendo tu audio para que suene perfecto.`)
    }

    const tmpDir = path.join(process.cwd(), 'tmp')
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir)

    const tempRaw = path.join(tmpDir, `raw_hq_${Date.now()}`)
    const tempProcessed = path.join(tmpDir, `music_hq_${Date.now()}.mp3`)

    try {
        activeAudioDownloads.set(userId, true)
        
        // 1. REACCIÓN: BÚSQUEDA 🔍
        await m.react('🔍')

        let videoUrl = text
        let videoInfo = null

        if (!text.includes('youtu.be') && !text.includes('youtube.com')) {
            const search = await yts(text)
            if (!search.videos.length) {
                activeAudioDownloads.delete(userId)
                await m.react('💨')
                return m.reply(`> ⚡ *Cariño, no encontré nada.*`)
            }
            videoInfo = search.videos[0]
            videoUrl = videoInfo.url
        } else {
            const videoId = videoUrl.split('v=')[1]?.split('&')[0] || 
                          videoUrl.split('youtu.be/')[1]?.split('?')[0] ||
                          videoUrl.split('/').pop().split('?')[0]
            
            if (!videoId) {
                activeAudioDownloads.delete(userId)
                await m.react('💨')
                return m.reply(`> ⚡ *Enlace inválido, corazón.*`)
            }
            
            const search = await yts({ videoId })
            videoInfo = search
        }

        if (!videoInfo) {
            activeAudioDownloads.delete(userId)
            await m.react('💨')
            return m.reply(`> ⚡ *No pude obtener información del audio.*`)
        }

        const { title, author, duration, views, ago, thumbnail, url } = videoInfo

        // RESTRICCIÓN DE 15 MINUTOS
        if (duration.seconds > 900) {
            await m.react('❌')
            activeAudioDownloads.delete(userId)
            return m.reply(`> 🌪️ *La melodía excede los 15 minutos permitidos, corazón.*`)
        }

        const audioDetails = `> 🎵 *「🌱」 ${title}*\n\n` +
            `> 🍃 *Canal:* » ${author?.name || 'Desconocido'}\n` +
            `> ⚘ *Duración:* » ${duration?.timestamp || 'Desconocida'}\n` +
            `> 🌼 *Vistas:* » ${(views || 0).toLocaleString()}\n` +
            `> 🍀 *Publicado:* » ${ago || 'Reciente'}\n` +
            `> 🌿 *Enlace:* » ${url || videoUrl}\n\n` +
            `> 🔊 *Calidad:* » 320kbps (Alta Fidelidad)\n` +
            `> ⏳ _ᴇsᴛᴏʏ ᴘʀᴇᴘᴀʀᴀɴᴅᴏ sᴜ ᴀᴜᴅɪᴏ... ᴘᴀᴄɪᴇɴᴄɪᴀ_`;

        await conn.sendMessage(m.chat, {
            image: { url: thumbnail },
            caption: audioDetails
        }, { quoted: m })

        // 2. REACCIÓN: DESCARGA 📥
        await m.react('📥')

        const apiResponse = await axios.get(`https://api.ananta.qzz.io/api/yt-dl-v2?url=${encodeURIComponent(videoUrl)}&format=mp3`, {
            headers: { "x-api-key": "antebryxivz14" },
            timeout: 60000 
        })
        
        if (!apiResponse.data?.success) throw new Error('API_v2_FAILURE')
        const downloadUrl = apiResponse.data.data.download_url

        const response = await axios({ url: downloadUrl, method: 'GET', responseType: 'stream', timeout: 120000 })
        const writer = fs.createWriteStream(tempRaw)
        response.data.pipe(writer)

        await new Promise((resolve, reject) => {
            writer.on('finish', resolve)
            writer.on('error', reject)
        })

        // 3. REACCIÓN: PROCESAMIENTO ⚙️ (MÁXIMA CALIDAD)
        await m.react('⚙️')

        await new Promise((resolve, reject) => {
            ffmpeg(tempRaw)
                .toFormat('mp3')
                .audioCodec('libmp3lame')
                .audioBitrate(320) // Subimos a la máxima calidad
                .audioFrequency(44100) // Frecuencia estándar de CD
                .on('end', resolve)
                .on('error', reject)
                .save(tempProcessed)
        })

        // 4. REACCIÓN: ENVÍO 📦
        await m.react('📦')

        const audioBuffer = fs.readFileSync(tempProcessed)
        const safeTitle = `${title.substring(0, 50)}`.replace(/[<>:"/\\|?*]/g, '')

        await conn.sendMessage(m.chat, {
            document: audioBuffer,
            mimetype: 'audio/mpeg',
            fileName: `${safeTitle}.mp3`
        }, { quoted: m })

        // 5. REACCIÓN: ÉXITO ✅
        await m.react('✅')

    } catch (error) {
        console.error('[KarBot Play HQ Error]:', error.message)
        await m.react('❌')
        
        // Devolución simbólica de coins si el usuario no es premium
        if (!user.premium) {
            // Aquí puedes añadir lógica para devolver coins si usas algún sistema de economía
        }

        await m.reply(`> 🌪️ *Vaya drama...* No pude procesar el audio en alta calidad. Inténtalo más tarde, cielo.`)
    } finally {
        activeAudioDownloads.delete(userId)
        if (fs.existsSync(tempRaw)) fs.unlinkSync(tempRaw)
        if (fs.existsSync(tempProcessed)) fs.unlinkSync(tempProcessed)
    }
}

handler.help = ['play']
handler.tags = ['downloader']
handler.command = ['play']
handler.group = true

export default handler