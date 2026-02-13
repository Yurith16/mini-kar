import { search, download } from 'aptoide-scraper'
import { checkReg } from '../lib/checkReg.js'
import fetch from 'node-fetch'

// Mapa para gestionar las descargas activas y evitar el abuso
let descargasActivas = new Set()

let handler = async (m, { conn, text, usedPrefix, command }) => {
  if (!m) return
  const ctx = (global.rcanalr || {})
  
  const user = global.db.data.users[m.sender]
  
  // 1. Verificación de registro
  if (await checkReg(m, user)) return

  // 2. Control de abuso (Una descarga a la vez)
  if (descargasActivas.has(m.sender)) {
    return m.reply(`> ⚠️ *𝗗𝗘𝗧𝗘𝗡𝗧𝗘:* No abuses, cielo. Ya tienes una descarga en proceso. Espera a que termine para buscar otra aplicación.`)
  }

  if (!text) {
    return conn.reply(m.chat, `> ¿Qué aplicación desea buscar hoy, cielo?\n*Uso:* ${usedPrefix + command} <Nombre>`, m, ctx)
  }

  try {
    // Añadir a descargas activas
    descargasActivas.add(m.sender)

    // Secuencia de reacciones 🔍🌿🍀📥
    const reacciones = ['🔍', '🌿', '🍀', '📥']
    for (const reacc of reacciones) {
      await m.react(reacc)
    }
    
    let searchA = await search(text)
    if (!searchA.length) {
      await m.react('❌')
      return conn.reply(m.chat, `> Lo siento, no encontré ninguna aplicación llamada "${text}".`, m, ctx)
    }

    let data5 = await download(searchA[0].id)

    // --- DISEÑO DE DETALLES APK ---
    let infoApk = `> 💰 *𝗗𝗘𝗧𝗔𝗟𝗟𝗘𝗦 𝗗𝗘𝗟 𝗔𝗣𝗞* 💰\n\n` +
                  `> 📱 *Nombre:* » _${data5.name}_\n` +
                  `> 📦 *Paquete:* » _${data5.package}_\n` +
                  `> 💾 *Tamaño:* » _${data5.size}_\n` +
                  `> 🌿 *Créditos:* » *KarBot*`

    await conn.sendFile(m.chat, data5.icon, 'apk.jpg', infoApk, m, null, ctx)

    // --- RESTRICCIÓN DE PESO (1GB) ---
    if (data5.size.includes('GB') || parseFloat(data5.size.replace(' MB', '')) > 1024) {
      await m.react('❌')
      return conn.reply(m.chat, `> ⚠️ El archivo supera el límite de 1GB permitido para descargas externas.`, m, ctx)
    }

    // Pequeña espera para no saturar el envío
    await new Promise(resolve => setTimeout(resolve, 2000))

    await conn.sendMessage(m.chat, {
        document: { url: data5.dllink },
        mimetype: 'application/vnd.android.package-archive',
        fileName: `${data5.name}.apk`
    }, { quoted: m })

    await m.react('⚙️')

  } catch (error) {
    console.error(error)
    await m.react('❌')
    return conn.reply(m.chat, `> Hubo un drama con los servidores de Aptoide y no pude obtener tu APK.`, m, ctx)
  } finally {
    // Liberar al usuario siempre
    descargasActivas.delete(m.sender)
  }
}

handler.help = ['apk (descargas de app)']
handler.tags = ['downloader']
handler.command = ['apk2', 'apk', 'aptoide']
handler.group = true

export default handler