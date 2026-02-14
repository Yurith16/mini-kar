const axios = require('axios')
const yts = require('yt-search')
const ffmpeg = require('fluent-ffmpeg')
const ffmpegPath = require('ffmpeg-static')
const fs = require('fs')
const path = require('path')
const db = require('../database/manager')
const { checkRegistration } = require('./registry')

// Configuración de FFmpeg
ffmpeg.setFfmpegPath(ffmpegPath)

// Control de descargas activas
const activeDownloads = new Map()

module.exports = {
    help: ['play2'],
    tags: ['downloader'],
    command: ['play2', 'video'],
    register: true,
    group: true,
    handler: async (m, { conn, text, usedPrefix, command }) => {
        const userId = m.sender.split('@')[0]
        
        // Función para reaccionar correctamente
        const react = async (emoji) => {
            return conn.sendMessage(m.chat, { react: { text: emoji, key: m.key } })
        }

        // 🛡️ Verificar Registro
        if (!await checkRegistration(m, conn)) return

        if (!text) {
            await react('🤔')
            return conn.sendMessage(m.chat, { text: `> ¿Qué video desea ver hoy, cielo?` }, { quoted: m })
        }

        if (activeDownloads.has(userId)) {
            await react('⏳')
            return conn.sendMessage(m.chat, { text: `> ⏳ *¡Paciencia, corazón!* Ya estoy procesando un video para ti.` }, { quoted: m })
        }

        const tmpDir = path.join(process.cwd(), 'tmp')
        if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir)

        const tempRaw = path.join(tmpDir, `raw_v_${Date.now()}.mp4`)
        const tempProcessed = path.join(tmpDir, `fixed_v_${Date.now()}.mp4`)

        try {
            activeDownloads.set(userId, true)
            await react('🔍')

            let videoUrl = text
            let videoInfo = null

            if (!text.includes('youtu.be') && !text.includes('youtube.com')) {
                const search = await yts(text)
                if (!search.videos.length) {
                    activeDownloads.delete(userId)
                    await react('💨')
                    return conn.sendMessage(m.chat, { text: `> ⚡ *Cariño, no encontré nada.*` }, { quoted: m })
                }
                videoInfo = search.videos[0]
                videoUrl = videoInfo.url
            } else {
                const videoId = videoUrl.split('v=')[1]?.split('&')[0] || 
                                videoUrl.split('youtu.be/')[1]?.split('?')[0] ||
                                videoUrl.split('/').pop().split('?')[0]
                const search = await yts({ videoId })
                videoInfo = search
            }

            if (!videoInfo) throw new Error('INFO_NOT_FOUND')

            const { title, author, duration, views, ago, thumbnail, url } = videoInfo

            // ⏱️ RESTRICCIÓN DE 20 MINUTOS
            if (duration.seconds > 1200) {
                await react('⏱️')
                activeDownloads.delete(userId)
                return conn.sendMessage(m.chat, { 
                    text: `> 🌪️ *Lo siento, cielo.* Por ahora solo puedo procesar videos menores a 20 minutos. ¡Estamos trabajando para admitir videos más grandes pronto!` 
                }, { quoted: m })
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

            await react('📥')

            // Descarga vía API
            const apiResponse = await axios.get(`https://api.ananta.qzz.io/api/yt-dl?url=${encodeURIComponent(videoUrl)}&format=360`, {
                headers: { "x-api-key": "antebryxivz14" },
                timeout: 100000
            })
            
            if (!apiResponse.data?.success) throw new Error('API_ERROR')
            const downloadUrl = apiResponse.data.data.download_url

            const response = await axios({ url: downloadUrl, method: 'GET', responseType: 'stream' })
            const writer = fs.createWriteStream(tempRaw)
            response.data.pipe(writer)

            await new Promise((resolve, reject) => {
                writer.on('finish', resolve)
                writer.on('error', reject)
            })

            await react('⚙️')

            // Procesamiento con FFmpeg
            await new Promise((resolve, reject) => {
                ffmpeg(tempRaw)
                    .outputOptions(['-c:v libx264', '-preset superfast', '-c:a aac', '-b:a 128k'])
                    .toFormat('mp4')
                    .on('end', resolve)
                    .on('error', reject)
                    .save(tempProcessed)
            })

            await react('📦')

            const videoBuffer = fs.readFileSync(tempProcessed)
            const safeTitle = `${title.substring(0, 40)}`.replace(/[<>:"/\\|?*]/g, '')

            await conn.sendMessage(m.chat, {
                document: videoBuffer,
                mimetype: 'video/mp4',
                fileName: `${safeTitle}.mp4`,
                caption: `> ✅ *Aquí tiene su video, cielo.*`
            }, { quoted: m })

            await react('✅')

        } catch (error) {
            console.error('[Play2 Error]:', error)
            await react('❌')
            
            // Devolución de Kryons por error (según tus instrucciones)
            db.incrementUserField(userId, 'kryons', 30)

            conn.sendMessage(m.chat, { 
                text: `> 🌪️ *Vaya drama...* Hubo un fallo técnico. Te he devuelto ⚝ 30 Kryons, cielo.` 
            }, { quoted: m })
        } finally {
            activeDownloads.delete(userId)
            if (fs.existsSync(tempRaw)) fs.unlinkSync(tempRaw)
            if (fs.existsSync(tempProcessed)) fs.unlinkSync(tempProcessed)
        }
    }
}