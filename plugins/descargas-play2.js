import axios from 'axios'
import yts from 'yt-search'
import ffmpeg from 'fluent-ffmpeg'
import ffmpegPath from 'ffmpeg-static'
import fs from 'fs'
import path from 'path'
import { checkReg } from '../lib/checkReg.js'

// Configuración de FFmpeg Estático
ffmpeg.setFfmpegPath(ffmpegPath)

// Sistema de control de descargas activas por usuario
const activeDownloads = new Map()

let handler = async (m, { conn, text, usedPrefix, command }) => {
    const userId = m.sender
    const user = global.db.data.users[userId]

    if (await checkReg(m, user)) return

    if (!text) {
        await m.react('🤔')
        return m.reply(`> ¿Qué video desea ver hoy, cielo?`)
    }

    if (activeDownloads.has(userId)) {
        await m.react('⏳')
        return m.reply(`> ⏳ *¡Paciencia, corazón!* Ya estoy procesando un video para ti. Inténtalo en un momento.`)
    }

    const tmpDir = path.join(process.cwd(), 'tmp')
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir)

    const tempRaw = path.join(tmpDir, `raw_${Date.now()}.mp4`)
    const tempProcessed = path.join(tmpDir, `fixed_${Date.now()}.mp4`)

    try {
        activeDownloads.set(userId, true)
        
        // 1. REACCIÓN: BÚSQUEDA 🔍
        await m.react('🔍')

        let videoUrl = text
        let videoInfo = null

        if (!text.includes('youtu.be') && !text.includes('youtube.com')) {
            const search = await yts(text)
            if (!search.videos.length) {
                activeDownloads.delete(userId)
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
                activeDownloads.delete(userId)
                await m.react('💨')
                return m.reply(`> ⚡ *Enlace inválido, corazón.*`)
            }
            
            const search = await yts({ videoId })
            videoInfo = search
        }

        if (!videoInfo) {
            activeDownloads.delete(userId)
            await m.react('💨')
            return m.reply(`> ⚡ *No pude obtener información del video.*`)
        }

        const { title, author, duration, views, ago, thumbnail, url } = videoInfo

        if (duration.seconds > 1800) {
            await m.react('❌')
            activeDownloads.delete(userId)
            return m.reply(`> 🌪️ *Vaya drama... El video excede los 30 minutos permitidos.*`)
        }

        const videoDetails = `> 🎥 *「🌱」 ${title}*\n\n` +
            `> 🍃 *Canal:* » ${author?.name || 'Desconocido'}\n` +
            `> ⚘ *Duración:* » ${duration?.timestamp || 'Desconocida'}\n` +
            `> 🌼 *Vistas:* » ${(views || 0).toLocaleString()}\n` +
            `> 🍀 *Publicado:* » ${ago || 'Reciente'}\n` +
            `> 🌿 *Enlace:* » ${url || videoUrl}\n\n` +
            `> ⏳ _ᴇsᴛᴏʏ ᴘʀᴏᴄᴇsᴀɴᴅᴏ sᴜ ᴠɪᴅᴇᴏ... ᴘᴀᴄɪᴇɴᴄɪᴀ_`;

        await conn.sendMessage(m.chat, {
            image: { url: thumbnail },
            caption: videoDetails
        }, { quoted: m })

        // 2. REACCIÓN: DESCARGA 📥 (Desde la API al Bot)
        await m.react('📥')

        const apiResponse = await axios.get(`https://api.ananta.qzz.io/api/yt-dl?url=${encodeURIComponent(videoUrl)}&format=360`, {
            headers: { "x-api-key": "antebryxivz14" }
        })
        
        if (!apiResponse.data?.success) throw new Error('API Error')
        const downloadUrl = apiResponse.data.data.download_url

        const response = await axios({ url: downloadUrl, method: 'GET', responseType: 'stream' })
        const writer = fs.createWriteStream(tempRaw)
        response.data.pipe(writer)

        await new Promise((resolve, reject) => {
            writer.on('finish', () => {
                const stats = fs.statSync(tempRaw)
                if (stats.size > 300 * 1024 * 1024) {
                    reject(new Error('Tamaño excede 300MB'))
                } else resolve()
            })
            writer.on('error', reject)
        })

        // 3. REACCIÓN: PROCESAMIENTO ⚙️ (Limpieza con FFmpeg)
        await m.react('⚙️')

        await new Promise((resolve, reject) => {
            ffmpeg(tempRaw)
                .outputOptions([
                    '-c:v libx264',
                    '-preset superfast',
                    '-c:a aac',
                    '-b:a 128k',
                    '-movflags +faststart'
                ])
                .toFormat('mp4')
                .on('end', resolve)
                .on('error', reject)
                .save(tempProcessed)
        })

        // 4. REACCIÓN: ENVÍO 📦 (Subiendo archivo a WhatsApp)
        await m.react('📦')

        const videoBuffer = fs.readFileSync(tempProcessed)
        const safeTitle = `${title.substring(0, 50)}`.replace(/[<>:"/\\|?*]/g, '')

        await conn.sendMessage(m.chat, {
            document: videoBuffer,
            mimetype: 'video/mp4',
            fileName: `${safeTitle}.mp4`,
            caption: `> ✅ *Aquí tiene su video, cielo.*`
        }, { quoted: m })

        // 5. REACCIÓN: ÉXITO ✅
        await m.react('✅')

    } catch (error) {
        console.error('[KarBot Play2 Error]:', error)
        await m.react('❌')
        await m.reply(`> 🌪️ *Vaya drama...* ${error.message.includes('300MB') ? 'El video supera 300MB' : 'Hubo un fallo técnico'}. Inténtalo más tarde.`)
    } finally {
        activeDownloads.delete(userId)
        if (fs.existsSync(tempRaw)) fs.unlinkSync(tempRaw)
        if (fs.existsSync(tempProcessed)) fs.unlinkSync(tempProcessed)
    }
}

handler.help = ['play2']
handler.tags = ['downloader']
handler.command = ['play2']
handler.group = true

export default handler