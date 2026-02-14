const fetch = require('node-fetch')
const { checkRegistration } = require('./registry')

module.exports = {
  help: ['ig <url> - Descargar video/imagen de Instagram'],
  tags: ['downloader'],
  command: ['ig', 'instagram', 'igaudio'],
  register: true,
  group: true,
  handler: async (m, { conn, args, command, react }) => {
    try {
      // Verificar registro
      if (!await checkRegistration(m, conn)) return

      if (!args[0]) {
        await react('🌸')
        return conn.sendMessage(m.chat, { 
          text: '🌸 *ingresa un enlace de Instagram*\n.ej: .ig https://instagram.com/p/xxxx' 
        }, { quoted: m })
      }

      const url = args[0]
      if (!url.includes('instagram.com')) {
        await react('🌿')
        return conn.sendMessage(m.chat, { 
          text: '🌿 *eso no parece un enlace de Instagram*' 
        }, { quoted: m })
      }

      // 🔍 Buscando
      await react('🔍')
      
      // 🌿 Procesando
      await react('🌿')
      
      // 🍀 Casi listo
      await react('🍀')
      
      // 📥 Descargando
      await react('📥')

      const apiUrl = `https://api-aswin-sparky.koyeb.app/api/downloader/igdl?url=${encodeURIComponent(url)}`
      const res = await fetch(apiUrl)
      
      if (!res.ok) throw new Error('Error en API')
      
      const json = await res.json()

      if (!json.status || !json.data || json.data.length === 0) {
        throw new Error('Sin resultados')
      }

      const media = json.data[0]
      const mediaUrl = media.url
      const isVideo = media.type === 'video'
      const isAudioCommand = command.toLowerCase() === 'igaudio'

      if (isAudioCommand) {
        // Para audio, solo extraemos el audio del video
        await conn.sendMessage(m.chat, {
          audio: { url: mediaUrl },
          mimetype: 'audio/mpeg',
          fileName: `ig_audio_${Date.now()}.mp3`,
          ptt: false
        }, { quoted: m })
      } else if (isVideo) {
        await conn.sendMessage(m.chat, {
          video: { url: mediaUrl },
          caption: `┌───「 *INSTAGRAM* 」\n▢ *🎥 video descargado*\n└──────────────\n🩷 _con cariño, kar_`
        }, { quoted: m })
      } else {
        await conn.sendMessage(m.chat, {
          image: { url: mediaUrl },
          caption: `┌───「 *INSTAGRAM* 」\n▢ *🖼️ imagen descargada*\n└──────────────\n🩷 _con cariño, kar_`
        }, { quoted: m })
      }

      // ✅ Éxito
      await react('✅')

    } catch (error) {
      console.error('Error en ig:', error)
      await react('❌')
      conn.sendMessage(m.chat, { 
        text: '🌪️ *no pude descargar*\nintenta con otro enlace' 
      }, { quoted: m })
    }
  }
}