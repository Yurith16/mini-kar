import fetch from 'node-fetch'
import { checkReg } from '../lib/checkReg.js'

// Mapa para gestionar las descargas activas y evitar el abuso
let descargasActivas = new Set()

// ========== MÉTODOS DE DESCARGA CON FALLBACK ==========

async function tiktokApiDelirius(url) {
  try {
    const res = await fetch(`https://api.delirius.store/download/tiktok?url=${encodeURIComponent(url)}`)
    const data = await res.json()
    if (data?.status && data?.data?.meta?.media) {
      const media = data.data.meta.media[0]
      if (media.type === "image") return { images: media.images, success: true }
      if (media.type === "video") return { videoUrl: media.org || media.hd, success: true }
    }
    return { success: false }
  } catch { return { success: false } }
}

async function tiktokApiSky(url) {
  try {
    const res = await fetch(`https://api-sky.ultraplus.click/api/tiktok?url=${encodeURIComponent(url)}`)
    const data = await res.json()
    if (data.url) return { videoUrl: data.url, success: true }
    return { success: false }
  } catch { return { success: false } }
}

async function tiktokApiAswin(url) {
  try {
    const res = await fetch(`https://api-aswin-sparky.koyeb.app/api/downloader/tiktok?url=${encodeURIComponent(url)}`)
    const data = await res.json()
    if (data.status && data.data.video) return { videoUrl: data.data.video, success: true }
    return { success: false }
  } catch { return { success: false } }
}

let handler = async (m, { conn, args, command }) => {
  const user = global.db.data.users[m.sender]

  // 1. Verificación de registro
  if (await checkReg(m, user)) return

  // 2. Control de abuso (Una descarga a la vez)
  if (descargasActivas.has(m.sender)) {
    return m.reply(`> ⚠️ *𝗗𝗘𝗧𝗘𝗡𝗧𝗘:* No abuses, cielo. Ya tienes una descarga en proceso. Espera a que termine.`)
  }

  const url = args[0]
  if (!url || !/(tiktok\.com|vt\.tiktok\.com|vm\.tiktok\.com)/.test(url)) {
    return m.reply(`> Debe proporcionar un enlace válido de TikTok, cielo.`)
  }

  try {
    descargasActivas.add(m.sender)

    // Secuencia de reacciones 🔍🌿🍀📥
    const reacciones = ['🔍', '🌿', '🍀', '📥']
    for (const reacc of reacciones) {
      await m.react(reacc)
    }

    // Lógica de Fallback entre APIs
    let result = null
    const methods = [tiktokApiDelirius, tiktokApiSky, tiktokApiAswin]
    
    for (const method of methods) {
      result = await method(url)
      if (result.success) break
    }

    if (!result || !result.success) throw new Error()

    // Enviar Imágenes (Carrusel)
    if (result.images && result.images.length > 0) {
      for (let img of result.images) {
        await conn.sendMessage(m.chat, { image: { url: img }, caption: `> Imagen de TikTok descargada con éxito.` }, { quoted: m })
      }
    } 
    // Enviar Video
    else if (result.videoUrl) {
      await conn.sendMessage(m.chat, { 
        video: { url: result.videoUrl }, 
        caption: `> Video de TikTok descargado con éxito.` 
      }, { quoted: m })
    }

    await m.react('⚙️')

  } catch (e) {
    console.error(e)
    await m.react('❌')
    return m.reply(`> Lo siento, hubo un drama con los servidores y no pude obtener tu TikTok.`)
  } finally {
    descargasActivas.delete(m.sender)
  }
}

handler.help = ['tiktok2 <url>', 'tk <url>']
handler.tags = ['downloader']
handler.command = ['tiktok2', 'tk']
handler.group = true

export default handler