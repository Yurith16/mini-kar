import axios from 'axios'
import fetch from 'node-fetch'
import { checkReg } from '../lib/checkReg.js'

// Mapa para gestionar las descargas activas y evitar el abuso
let descargasActivas = new Set()

// ========== MÉTODOS DE RESPALDO (FALLBACK) ==========

async function tryTikWM(url) {
    const res = await axios.get(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}?hd=1`)
    const data = res.data?.data
    if (data) {
        return {
            video: data.play,
            audio: data.music,
            images: data.images, // TikWM a veces devuelve imágenes aquí
            success: true
        }
    }
    return { success: false }
}

async function tryDelirius(url) {
    const res = await fetch(`https://api.delirius.store/download/tiktok?url=${encodeURIComponent(url)}`)
    const data = await res.json()
    if (data?.status && data?.data?.meta?.media) {
        const media = data.data.meta.media[0]
        return {
            images: media.type === "image" ? media.images : null,
            video: media.type === "video" ? (media.org || media.hd) : null,
            success: true
        }
    }
    return { success: false }
}

let handler = async (m, { conn, text, args, command }) => {
    const userId = m.sender
    const user = global.db.data.users[userId]

    // 1. Verificación de registro
    if (await checkReg(m, user)) return

    // 2. Control de abuso (Una descarga a la vez)
    if (descargasActivas.has(m.sender)) {
        return m.reply(`> ⚠️ *𝗗𝗘𝗧𝗘𝗡𝗧𝗘:* No abuses, cielo. Ya tienes una descarga en proceso. Espera a que termine.`)
    }

    if (!text) return m.reply(`> ¿Qué TikTok desea buscar hoy, cielo?`)

    const isUrl = /(?:https:?\/{2})?(?:www\.|vm\.|vt\.|t\.)?tiktok\.com\/([^\s&]+)/gi.test(text)

    try {
        descargasActivas.add(m.sender)

        // Secuencia de reacciones 🔍🌿🍀📥
        const reacciones = ['🔍', '🌿', '🍀', '📥']
        for (const reacc of reacciones) {
            await m.react(reacc)
        }

        if (isUrl) {
            let result = await tryTikWM(text)
            if (!result.success) result = await tryDelirius(text)

            if (!result.success) throw new Error('Error en APIs')

            const isAudioCommand = ['tiktokaudio', 'tta', 'ttaudio'].includes(command)

            // CASO 1: AUDIO
            if (isAudioCommand) {
                if (!result.audio) throw new Error('No audio found')
                await conn.sendMessage(m.chat, {
                    audio: { url: result.audio },
                    mimetype: 'audio/mpeg',
                    fileName: `tiktok_audio.mp3`,
                    ptt: false,
                    caption: '> Descarga completada'
                }, { quoted: m })
            } 
            // CASO 2: GALERÍA DE IMÁGENES
            else if (result.images && result.images.length > 0) {
                for (let img of result.images) {
                    await conn.sendMessage(m.chat, { 
                        image: { url: img }, 
                        caption: `> Imagen descargada con éxito.` 
                    }, { quoted: m })
                }
                // También enviar la música de la galería
                if (result.audio) {
                    await conn.sendMessage(m.chat, {
                        audio: { url: result.audio },
                        mimetype: 'audio/mpeg',
                        fileName: `tiktok_audio.mp3`,
                        ptt: false
                    }, { quoted: m })
                }
            } 
            // CASO 3: VIDEO
            else if (result.video) {
                await conn.sendMessage(m.chat, { 
                    video: { url: result.video }, 
                    caption: '> Descarga completada' 
                }, { quoted: m })
            }

        } else {
            // BÚSQUEDA POR TEXTO (Solo video)
            if (['tiktokaudio', 'tta', 'ttaudio'].includes(command)) {
                return m.reply(`> Para descargar audio necesitas un enlace de TikTok, cielo.`)
            }

            const res = await axios({
                method: 'POST',
                url: 'https://tikwm.com/api/feed/search',
                data: { keywords: text, count: 1, HD: 1 }
            })

            const video = res.data?.data?.videos?.[0]
            if (!video) throw new Error('No results')

            await conn.sendMessage(m.chat, { 
                video: { url: video.play }, 
                caption: '> Descarga completada' 
            }, { quoted: m })
        }

        await m.react('⚙️')

    } catch (e) {
        console.error(e)
        await m.react('❌')
        await m.reply(`> Lo siento, hubo un error en el jardín de TikTok.`)
    } finally {
        descargasActivas.delete(m.sender)
    }
}

handler.help = ['tiktok + url', 'tiktokaudio + url']
handler.tags = ['downloader']
handler.command = ['tiktok', 'tt', 'tiktokaudio', 'tta', 'ttaudio']
handler.group = true

export default handler