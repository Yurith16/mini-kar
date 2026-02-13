import fetch from 'node-fetch'

let handler = async (m, { conn, usedPrefix, command, text }) => {
  const ctxErr = (global.rcanalx || {})
  const ctxWarn = (global.rcanalw || {})

  if (!text) {
    await m.react('📝')
    return conn.reply(m.chat,
`> Debe incluir el nombre del anime o manga
*Uso:* ${usedPrefix + command} <Dragon Ball Z>`, m, ctxWarn)
  }

  await m.react('🔍')

  try {
    let res = await fetch('https://api.jikan.moe/v4/manga?q=' + encodeURIComponent(text))
    if (!res.ok) throw new Error()

    let json = await res.json()
    if (!json.data || json.data.length === 0) {
      await m.react('💔')
      return conn.reply(m.chat, `> No encontré resultados para: ${text}`, m, ctxErr)
    }

    let manga = json.data[0]
    let { chapters, title_japanese, url, type, score, status, volumes, synopsis, published, genres, authors } = manga

    let mangainfo = `*📖 INFORMACIÓN DE MANGA*

*• Título:* ${manga.title}
*• Japonés:* ${title_japanese}
*• Autor:* ${authors?.[0]?.name || 'Desconocido'}
*• Tipo:* ${type}
*• Estado:* ${status}
*• Capítulos:* ${chapters || 'En emisión'}
*• Volúmenes:* ${volumes || 'En emisión'}
*• Puntaje:* ${score || 'N/A'}
*• Géneros:* ${genres?.map(g => g.name).join(', ') || 'N/A'}
*• Publicado:* ${published?.string || 'N/A'}

> ${synopsis ? synopsis.substring(0, 350).replace(/\n/g, ' ') + '...' : 'Sin descripción disponible.'}

*Enlace:* ${url}

*Espero que esta información te sea de gran ayuda.* ✨`

    await m.react('✅')
    await conn.sendFile(m.chat, manga.images.jpg.image_url, 'manga.jpg', mangainfo, m)

  } catch (error) {
    await m.react('❌')
    await conn.reply(m.chat, `> Ocurrió un error inesperado al buscar: ${text}`, m, ctxErr)
  }
}

handler.help = ['infomanga'] 
handler.tags = ['anime'] 
handler.group = true
handler.command = ['infomanga', 'manga'] 

export default handler