import axios from 'axios'
import yts from 'yt-search'
import ffmpeg from 'fluent-ffmpeg'
import ffmpegPath from 'ffmpeg-static'
import fs from 'fs'
import path from 'path'
import { checkReg } from '../lib/checkReg.js'

// Configuración de FFmpeg Estático
ffmpeg.setFfmpegPath(ffmpegPath)

let handler = async (m, { conn, text, usedPrefix, command }) => {
    const userId = m.sender
    const user = global.db.data.users[userId]

    if (await checkReg(m, user)) return

    if (!text) {
        await m.react('🤔')
        return m.reply(`> ¿Qué melodía desea escuchar hoy, cielo?`)
    }

    const tmpDir = path.join(process.cwd(), 'tmp')
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir)

    const tempRaw = path.join(tmpDir, `raw_${Date.now()}`)
    const tempProcessed = path.join(tmpDir, `audio_${Date.now()}.mp3`)

    try {
        // 1. REACCIÓN: BÚSQUEDA 🔍
        await m.react('🔍')

        let videoUrl = text
        let videoInfo = null

        if (!text.includes('youtu.be') && !text.includes('youtube.com')) {
            const search = await yts(text)
            if (!search.videos.length) {
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
                await m.react('💨')
                return m.reply(`> ⚡ *Enlace inválido, corazón.*`)
            }
            
            const search = await yts({ videoId })
            videoInfo = search
        }

        if (!videoInfo) {
            await m.react('💨')
            return m.reply(`> ⚡ *No pude obtener información del audio.*`)
        }

        const { title, author, duration, views, ago, thumbnail, url } = videoInfo

        // LÍMITE DE 30 MINUTOS
        if (duration.seconds > 1800) {
            await m.react('❌')
            return m.reply(`> 🌪️ *La melodía excede los 30 minutos permitidos, corazón.*`)
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

        // USANDO ÚNICAMENTE LA API ESPECIFICADA
        const apiResponse = await axios.get(`https://api-aswin-sparky.koyeb.app/api/downloader/song?search=${encodeURIComponent(videoUrl)}`, {
            timeout: 60000 
        })
        
        if (!apiResponse.data?.status || !apiResponse.data.data?.url) {
            throw new Error('API_NO_RESPONSE')
        }
        
        const downloadUrl = apiResponse.data.data.url

        const response = await axios({ 
            url: downloadUrl, 
            method: 'GET', 
            responseType: 'stream', 
            timeout: 120000 
        })
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
                .audioBitrate(320)
                .audioFrequency(44100)
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
        console.error('[KarBot ytmp3 Error]:', error.message)
        await m.react('❌')
        
        await m.reply(`> 🌪️ *Vaya drama...* No pude procesar el audio. ${error.message === 'API_NO_RESPONSE' ? 'La API no respondió correctamente.' : 'Inténtalo más tarde, cielo.'}`)
    } finally {
        if (fs.existsSync(tempRaw)) fs.unlinkSync(tempRaw)
        if (fs.existsSync(tempProcessed)) fs.unlinkSync(tempProcessed)
    }
}

handler.help = ['ytmp3']
handler.tags = ['downloader']
handler.command = ['ytmp3']
handler.group = true

export default handler