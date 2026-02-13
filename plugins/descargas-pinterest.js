import axios from 'axios'
import cheerio from 'cheerio'
import { checkReg } from '../lib/checkReg.js'

// Sistema de búsquedas activas por usuario
const busquedasActivas = new Map();

// Quoted especial
async function makeFkontak() {
    try {
        const res = await axios.get('https://i.postimg.cc/63HSmCvV/1757985995273.png', { responseType: 'arraybuffer' })
        const thumb2 = Buffer.from(res.data)
        return {
            key: { participants: '0@s.whatsapp.net', remoteJid: 'status@broadcast', fromMe: false, id: 'Halo' },
            message: { locationMessage: { name: 'KarBot Pinterest', jpegThumbnail: thumb2 } },
            participant: '0@s.whatsapp.net'
        }
    } catch {
        return undefined
    }
}

async function dl(url) {
    try {
        let res = await axios.get(url, { headers: { "User-Agent": "Mozilla/5.0" } }).catch(e => e.response)
        let $ = cheerio.load(res.data)
        let tag = $('script[data-test-id="video-snippet"]')
        if (tag.length) {
            let result = JSON.parse(tag.text())
            return {
                title: result.name,
                download: result.contentUrl
            }
        } else {
            let json = JSON.parse($("script[data-relay-response='true']").eq(0).text())
            let result = json.response.data["v3GetPinQuery"].data
            return {
                title: result.title,
                download: result.imageLargeUrl
            }
        }
    } catch {
        return { msg: "Error, inténtalo de nuevo más tarde" }
    }
}

const pins = async (judul) => {
    const link = `https://id.pinterest.com/resource/BaseSearchResource/get/?source_url=%2Fsearch%2Fpins%2F%3Fq%3D${encodeURIComponent(judul)}%26rs%3Dtyped&data=%7B%22options%22%3A%7B%22applied_unified_filters%22%3Anull%2C%22appliedProductFilters%22%3A%22---%22%2C%22article%22%3Anull%2C%22auto_correction_disabled%22%3Afalse%2C%22corpus%22%3Anull%2C%22customized_rerank_type%22%3Anull%2C%22domains%22%3Anull%2C%22dynamicPageSizeExpGroup%22%3A"control"%2C"filters"%3Anull%2C"journey_depth"%3Anull%2C"page_size"%3Anull%2C"price_max"%3Anull%2C"price_min"%3Anull%2C"query_pin_sigs"%3Anull%2C"query"%3A"${encodeURIComponent(judul)}"%2C"redux_normalize_feed"%3Atrue%2C"request_params"%3Anull%2C"rs"%3A"typed"%2C"scope"%3A"pins"%2C"selected_one_bar_modules"%3Anull%2C"seoDrawerEnabled"%3Afalse%2C"source_id"%3Anull%2C"source_module_id"%3Anull%2C"source_url"%3A"%2Fsearch%2Fpins%2F%3Fq%3D${encodeURIComponent(judul)}%26rs%3Dtyped"%2C"top_pin_id"%3Anull%2C"top_pin_ids"%3Anull%7D%2C"context"%3A%7B%7D%7D`
    
    const headers = {
        'accept': 'application/json, text/javascript, */*; q=0.01',
        'accept-language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
        'priority': 'u=1, i',
        'referer': 'https://id.pinterest.com/',
        'screen-dpr': '1',
        'sec-ch-ua': '"Not(A:Brand";v="99", "Google Chrome";v="133", "Chromium";v="133")',
        'sec-ch-ua-full-version-list': '"Not(A:Brand";v="99.0.0.0", "Google Chrome";v="133.0.6943.142", "Chromium";v="133.0.6943.142")',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-model': '""',
        'sec-ch-ua-platform': '"Windows"',
        'sec-ch-ua-platform-version': '"10.0.0"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36',
        'x-app-version': 'c056fb7',
        'x-pinterest-appstate': 'active',
        'x-pinterest-pws-handler': 'www/index.js',
        'x-pinterest-source-url': '/',
        'x-requested-with': 'XMLHttpRequest'
    }
    
    try {
        const res = await axios.get(link, { headers })
        if (res.data && res.data.resource_response && res.data.resource_response.data && res.data.resource_response.data.results) {
            return res.data.resource_response.data.results.map(item => {
                if (item.images) {
                    return {
                        image_large_url: item.images.orig?.url || null,
                        image_medium_url: item.images['564x']?.url || null,
                        image_small_url: item.images['236x']?.url || null,
                        pinner: item.pinner,
                        title: item.title,
                        board: item.board,
                        id: item.id,
                        url: item.url
                    }
                }
                return null
            }).filter(img => img !== null)
        }
        return []
    } catch (error) {
        console.error('Error:', error)
        return []
    }
}

let handler = async (m, { conn, text, args, usedPrefix }) => {
    const userId = m.sender
    const user = global.db.data.users[userId]
    
    if (await checkReg(m, user)) return
    
    const fkontak = await makeFkontak()
    
    if (busquedasActivas.has(userId)) {
        return await conn.reply(m.chat, '> Ya tienes una búsqueda activa.', m)
    }
    
    if (!text) {
        return await conn.reply(m.chat, '> ¿Qué desea buscar en Pinterest?', m)
    }
    
    busquedasActivas.set(userId, true)
    
    try {
        // Secuencia de reacciones idéntica al comando de Instagram
        const reacciones = ['🔍', '🌿', '🍀', '📥']
        for (const reacc of reacciones) {
            await m.react(reacc)
        }
        
        if (text.includes("https://")) {
            let i = await dl(args[0])
            let isVideo = i.download.includes(".mp4")
            
            await conn.sendMessage(m.chat, { 
                [isVideo ? "video" : "image"]: { url: i.download }
            }, { quoted: fkontak || m })
            
            // El engranaje final de KarBot ⚙️
            await m.react('⚙️')
            
        } else {
            const results = await pins(text)
            
            if (!results.length) {
                await m.react('❌')
                busquedasActivas.delete(userId)
                return await conn.reply(m.chat, '> Lo siento, hubo un error.', m)
            }
            
            // Seleccionar primera imagen
            const primeraImagen = results[0]
            
            // Guardar los resultados para este usuario
            busquedasActivas.set(userId, {
                resultados: results,
                indice: 1,
                termino: text,
                chat: m.chat
            })
            
            // Enviar primera imagen con mensaje simple
            await conn.sendMessage(m.chat, { 
                image: { url: primeraImagen.image_large_url }, 
                caption: '> ¿Desea otra imagen? Escriba *si*'
            }, { quoted: m })
            
            // El engranaje final de KarBot ⚙️
            await m.react('⚙️')
        }
        
    } catch (e) {
        console.error(e)
        await m.react('❌')
        busquedasActivas.delete(userId)
        await conn.reply(m.chat, '> Lo siento, hubo un error.', m)
    }
}

// Sistema de detección de respuesta
handler.before = async (m, { conn }) => {
    let busqueda = busquedasActivas.get(m.sender)

    if (!busqueda || m.isBaileys || !m.text) return 
    if (m.chat !== busqueda.chat) return

    if (m.text.startsWith('.') || m.text.startsWith('/') || m.text.startsWith('#') || m.text.startsWith('!')) return

    let text = m.text.trim().toLowerCase()
    
    // Solo responder a "si" o "sí"
    if (text === 'si' || text === 'sí') {
        // Verificar si hay más imágenes disponibles
        if (busqueda.indice >= busqueda.resultados.length) {
            busquedasActivas.delete(m.sender)
            return conn.reply(m.chat, '> Ya no hay más imágenes.', m)
        }
        
        // Obtener la siguiente imagen
        const siguienteImagen = busqueda.resultados[busqueda.indice]
        
        // Enviar imagen con pregunta
        await conn.sendMessage(m.chat, { 
            image: { url: siguienteImagen.image_large_url }, 
            caption: '> ¿Desea otra imagen relacionada? Escriba *si*'
        }, { quoted: m })
        
        // Actualizar índice
        busqueda.indice += 1
        
        // El engranaje final de KarBot ⚙️
        await m.react('⚙️')
        
        // Si ya no hay más imágenes, limpiar la búsqueda
        if (busqueda.indice >= busqueda.resultados.length) {
            setTimeout(() => {
                busquedasActivas.delete(m.sender)
                conn.reply(m.chat, '> Ya no hay más imágenes.', m)
            }, 3000)
        }
        
        return true
    }
    
    // Si escribe cualquier otra cosa, limpiar la búsqueda
    busquedasActivas.delete(m.sender)
    return true
}

handler.help = ['pinterest + nombre']
handler.command = ['pinterest', 'pin', 'pint']
handler.tags = ['downloader']
handler.group = true

export default handler