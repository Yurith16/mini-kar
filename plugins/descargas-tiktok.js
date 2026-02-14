const axios = require('axios')
const fetch = require('node-fetch')
const db = require('../database/manager')
const { checkRegistration } = require('./registry')

// Mapa para gestionar las descargas activas
let descargasActivas = new Set()

// ========== MÉTODOS DE RESPALDO (FALLBACK) ==========

async function tryTikWM(url) {
    try {
        const res = await axios.get(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}?hd=1`)
        const data = res.data?.data
        if (data) {
            return {
                video: data.play,
                audio: data.music,
                images: data.images,
                success: true
            }
        }
    } catch { return { success: false } }
    return { success: false }
}

async function tryDelirius(url) {
    try {
        const res = await fetch(`https://api.delirius.store/download/tiktok?url=${encodeURIComponent(url)}`)
        const data = await res.json()
        if (data?.status && data?.data?.meta?.media) {
            const media = data.data.meta.media[0]
            return {
                images: media.type === "image" ? media.images : null,
                video: media.type === "video" ? (media.org || media.hd) : null,
                audio: data.data.meta.music?.url || null,
                success: true
            }
        }
    } catch { return { success: false } }
    return { success: false }
}

module.exports = {
    help: ['tiktok', 'tiktokaudio'],
    tags: ['downloader'],
    command: ['tiktok', 'tt', 'tiktokaudio', 'tta', 'ttaudio'],
    register: true,
    group: true,
    handler: async (m, { conn, text, command }) => {
        const userId = m.sender.split('@')[0]
        
        // Función para enviar mensajes de texto de forma segura
        const reply = (txt) => conn.sendMessage(m.chat, { text: txt }, { quoted: m })

        // Función para reaccionar correctamente
        const react = async (emoji) => {
            return conn.sendMessage(m.chat, { react: { text: emoji, key: m.key } })
        }

        // 1. Verificación de registro
        if (!await checkRegistration(m, conn)) return

        // 2. Control de abuso
        if (descargasActivas.has(m.sender)) {
            await react('⏳')
            return reply(`> ⚠️ *𝗗𝗘𝗧𝗘𝗡𝗧𝗘:* No abuses, cielo. Ya tienes una descarga en proceso.`)
        }

        if (!text) {
            await react('🤔')
            return reply(`> ¿Qué TikTok desea buscar hoy, cielo?`)
        }

        // Limpiar el texto de basura (como el texto de compartir de TikTok Lite)
        const urlMatch = text.match(/(?:https:?\/{2})?(?:www\.|vm\.|vt\.|t\.)?tiktok\.com\/([^\s&]+)/gi)
        const videoUrl = urlMatch ? urlMatch[0] : null

        try {
            descargasActivas.add(m.sender)

            if (videoUrl) {
                // Secuencia de reacciones 🔍🌿🍀📥
                const reacciones = ['🔍', '🌿', '🍀', '📥']
                for (const reacc of reacciones) {
                    await react(reacc)
                }

                let result = await tryTikWM(videoUrl)
                if (!result.success) result = await tryDelirius(videoUrl)

                if (!result.success) throw new Error('Error en APIs')

                const isAudioCommand = ['tiktokaudio', 'tta', 'ttaudio'].includes(command)

                // CASO 1: AUDIO
                if (isAudioCommand) {
                    if (!result.audio) throw new Error('No audio found')
                    await conn.sendMessage(m.chat, {
                        audio: { url: result.audio },
                        mimetype: 'audio/mpeg',
                        fileName: `tiktok_audio.mp3`,
                        ptt: false
                    }, { quoted: m })
                } 
                // CASO 2: GALERÍA DE IMÁGENES
                else if (result.images && result.images.length > 0) {
                    for (let img of result.images) {
                        await conn.sendMessage(m.chat, { 
                            image: { url: img }, 
                            caption: `> ✅ *Imagen lista.*` 
                        }, { quoted: m })
                    }
                    if (result.audio) {
                        await conn.sendMessage(m.chat, {
                            audio: { url: result.audio },
                            mimetype: 'audio/mpeg',
                            ptt: false
                        }, { quoted: m })
                    }
                } 
                // CASO 3: VIDEO
                else if (result.video) {
                    await conn.sendMessage(m.chat, { 
                        video: { url: result.video }, 
                        caption: '> ✅ *TikTok descargado con éxito.*' 
                    }, { quoted: m })
                }

            } else {
                // BÚSQUEDA POR TEXTO
                if (['tiktokaudio', 'tta', 'ttaudio'].includes(command)) {
                    return reply(`> Para descargar audio necesitas un enlace de TikTok, cielo.`)
                }

                await react('🔍')
                const res = await axios({
                    method: 'POST',
                    url: 'https://tikwm.com/api/feed/search',
                    data: { keywords: text, count: 1, HD: 1 }
                })

                const video = res.data?.data?.videos?.[0]
                if (!video) throw new Error('No results')

                await conn.sendMessage(m.chat, { 
                    video: { url: video.play }, 
                    caption: `> ✅ *Resultado para:* ${text}` 
                }, { quoted: m })
            }

            await react('✅')

        } catch (e) {
            console.error(e)
            await react('❌')
            
            // Devolución de Kryons por error
            db.incrementUserField(userId, 'kryons', 10)
            await reply(`> 🌪️ *Vaya drama...* Hubo un error en el jardín de TikTok. Te he devuelto ⚝ 10 Kryons.`)
        } finally {
            descargasActivas.delete(m.sender)
        }
    }
}