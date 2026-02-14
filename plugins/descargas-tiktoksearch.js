const axios = require('axios')
const { checkRegistration } = require('./registry')

// Sistema de descargas activas por usuario
const userDownloads = new Map()

// Función de búsqueda optimizada para 10 videos
async function tiktokSearchKarbot(query) {
    try {
        const response = await axios.post("https://tikwm.com/api/feed/search",
            new URLSearchParams({
                keywords: query,
                count: '15',
                cursor: '0',
                HD: '1'
            }), {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            },
            timeout: 20000
        })

        const videos = response.data?.data?.videos || []

        if (videos.length === 0) throw new Error('No se encontraron videos.')

        // Retornamos hasta 10 videos válidos
        return videos
            .map(v => ({
                description: v.title ? v.title.slice(0, 100) : "Video de TikTok",
                videoUrl: v.play || v.wmplay || v.hdplay || null,
                author: v.author?.nickname || "Usuario"
            }))
            .filter(v => v.videoUrl)
            .slice(0, 10)

    } catch (error) {
        throw new Error(`API no responde. Intenta más tarde.`)
    }
}

module.exports = {
  help: ['tiktoks <búsqueda> - Buscar videos en TikTok'],
  tags: ['downloader'],
  command: ['tiktoks', 'tks', 'tiktoksearch'],
  register: true,
  group: true,
  handler: async (m, { conn, text, usedPrefix, react }) => {
    const userId = m.sender.split('@')[0]
    const jid = m.chat

    try {
      // Verificar registro
      if (!await checkRegistration(m, conn)) return

      if (userDownloads.has(userId)) {
        await react('⏳')
        return conn.sendMessage(m.chat, { 
          text: '⏳ *ya tengo una búsqueda tuya*\nespera a que termine' 
        }, { quoted: m })
      }

      if (!text) {
        await react('🌸')
        return conn.sendMessage(m.chat, { 
          text: `🌸 *ingresa una búsqueda*\n.ej: ${usedPrefix}tiktoks memes` 
        }, { quoted: m })
      }

      userDownloads.set(userId, true)

      // 🔍 Buscando
      await react('🔍')

      const searchResults = await tiktokSearchKarbot(text)

      if (searchResults.length < 2) {
        throw new Error('No encontré suficientes videos.')
      }

      // 📥 Descargando
      await react('📥')

      // Procesar de 2 en 2
      for (let i = 0; i < searchResults.length; i += 2) {
        const chunk = searchResults.slice(i, i + 2)
        
        await Promise.all(chunk.map(async (video, index) => {
          const globalIndex = i + index + 1
          try {
            await conn.sendMessage(jid, {
              video: { url: video.videoUrl },
              caption: `┌───「 *TIKTOK ${globalIndex}/10* 」\n▢ *🎵 ${video.description}*\n▢ *👤 ${video.author}*\n└──────────────\n🩷 _con cariño, kar_`,
              mimetype: 'video/mp4'
            }, { quoted: m })
          } catch (e) {
            console.error(`Error enviando video ${globalIndex}`)
          }
        }))

        // Pequeña pausa entre bloques
        if (i + 2 < searchResults.length) {
          await new Promise(resolve => setTimeout(resolve, 1500))
        }
      }

      // ✅ Éxito
      await react('✅')

    } catch (error) {
      console.error('Error en tiktoks:', error)
      await react('❌')
      conn.sendMessage(m.chat, { 
        text: `🌪️ *error:* ${error.message}` 
      }, { quoted: m })
    } finally {
      userDownloads.delete(userId)
    }
  }
}