const axios = require('axios')
const yts = require('yt-search')
const ffmpeg = require('fluent-ffmpeg')
const ffmpegPath = require('ffmpeg-static')
const fs = require('fs')
const path = require('path')
const db = require('../database/manager')
const { checkRegistration } = require('./registry')

// Configuración de FFmpeg Estático
ffmpeg.setFfmpegPath(ffmpegPath)

// Control de descargas activas por usuario
const activeAudioDownloads = new Map()

module.exports = {
    help: ['play'],
    tags: ['downloader'],
    command: ['play'],
    register: true,
    group: true,
    handler: async (m, { conn, text, usedPrefix, command }) => {
        const userId = m.sender.split('@')[0]
        const user = db.getUserData(userId)

        // Función interna para reaccionar sin errores
        const react = async (emoji) => {
            return conn.sendMessage(m.chat, { react: { text: emoji, key: m.key } })
        }

        // Verificación de registro
        if (!await checkRegistration(m, conn)) return

        if (!text) {
            await react('🤔')
            return conn.sendMessage(m.chat, { text: `> ¿Qué melodía desea escuchar hoy, cielo?` }, { quoted: m })
        }

        if (activeAudioDownloads.has(userId)) {
            await react('⏳')
            return conn.sendMessage(m.chat, { text: `> ⏳ *¡Paciencia, corazón!* Estoy puliendo tu audio para que suene perfecto.` }, { quoted: m })
        }

        const tmpDir = path.join(process.cwd(), 'tmp')
        if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir)

        const tempRaw = path.join(tmpDir, `raw_hq_${Date.now()}`)
        const tempProcessed = path.join(tmpDir, `music_hq_${Date.now()}.mp3`)

        try {
            activeAudioDownloads.set(userId, true)
            
            // 1. REACCIÓN: BÚSQUEDA 🔍
            await react('🔍')

            let videoUrl = text
            let videoInfo = null

            if (!text.includes('youtu.be') && !text.includes('youtube.com')) {
                const search = await yts(text)
                if (!search.videos.length) {
                    activeAudioDownloads.delete(userId)
                    await react('💨')
                    return conn.sendMessage(m.chat, { text: `> ⚡ *Cariño, no encontré nada.*` }, { quoted: m })
                }
                videoInfo = search.videos[0]
                videoUrl = videoInfo.url
            } else {
                const videoId = videoUrl.split('v=')[1]?.split('&')[0] || 
                                videoUrl.split('youtu.be/')[1]?.split('?')[0] ||
                                videoUrl.split('/').pop().split('?')[0]
                
                if (!videoId) {
                    activeAudioDownloads.delete(userId)
                    await react('💨')
                    return conn.sendMessage(m.chat, { text: `> ⚡ *Enlace inválido, corazón.*` }, { quoted: m })
                }
                
                const search = await yts({ videoId })
                videoInfo = search
            }

            if (!videoInfo) throw new Error('INFO_NOT_FOUND')

            const { title, author, duration, views, ago, thumbnail, url } = videoInfo

            // RESTRICCIÓN DE 15 MINUTOS
            if (duration.seconds > 900) {
                await react('❌')
                activeAudioDownloads.delete(userId)
                return conn.sendMessage(m.chat, { text: `> 🌪️ *La melodía excede los 15 minutos permitidos, corazón.*` }, { quoted: m })
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
            await react('📥')

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
            await react('⚙️')

            await new Promise((resolve, reject) => {
                ffmpeg(tempRaw)
                    .toFormat('mp3')
                    .audioCodec('libmp3lame')
                    .audioBitrate(320)
                    .audioFrequency(44100)
                    .on('end', resolve)
                    .on('error', reject)
                    .save(tempProcessed)
            })

            // 4. REACCIÓN: ENVÍO 📦
            await react('📦')

            await conn.sendMessage(m.chat, {
                document: fs.readFileSync(tempProcessed),
                mimetype: 'audio/mpeg',
                fileName: `${title}.mp3`
            }, { quoted: m })

            // 5. REACCIÓN: ÉXITO ✅
            await react('✅')

        } catch (error) {
            console.error('[Play HQ Error]:', error.message)
            await react('❌')
            
            // Devolución de Kryons por error
            db.incrementUserField(userId, 'kryons', 15)

            conn.sendMessage(m.chat, { text: `> 🌪️ *Vaya drama...* No pude procesar el audio. Te he devuelto ⚝ 15 Kryons, cielo.` }, { quoted: m })
        } finally {
            activeAudioDownloads.delete(userId)
            if (fs.existsSync(tempRaw)) fs.unlinkSync(tempRaw)
            if (fs.existsSync(tempProcessed)) fs.unlinkSync(tempProcessed)
        }
    }
}