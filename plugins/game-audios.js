import fs from 'fs'
import path from 'path'

let handler = m => m 

handler.before = async function (m, { conn }) {
    if (m.isBaileys || !m.text) return false
    
    let chat = global.db.data.chats?.[m.chat]
    if (chat && chat.audios === false) return false 

    const dic_audios = {
        'hola|bienvenido|hey': ['hola.mp3', 'hola2.mp3', 'hola3.mp3', 'hola4.mp3', 'hola5.mp3', 'hola6.mp3'],
        'buenos dias': ['dias.mp3', 'dias2.mp3'],
        'porno': ['porno.mp3'],
        'adios': ['hola5.mp3', 'adios.mp3'],
        'XD|xd|jaja|gogo': ['xd2.mp3', 'xd.mp3',, 'yamiamor.mp3']
    }

    let text = m.text.toLowerCase()

    for (let key in dic_audios) {
        let regex = new RegExp(`\\b(${key})\\b`, 'gi')
        
        if (regex.test(text)) {
            try {
                let seleccion = dic_audios[key]
                let nombreArchivo = Array.isArray(seleccion) 
                    ? seleccion[Math.floor(Math.random() * seleccion.length)] 
                    : seleccion

                let rutaAudio = path.join(process.cwd(), 'media', 'audios', nombreArchivo)

                if (!fs.existsSync(rutaAudio)) {
                    console.error(`> ⚠️ El archivo no existe: ${rutaAudio}`)
                    continue
                }

                await m.react('🎧')

                // Enviamos como audio normal (ptt: false)
                await conn.sendMessage(m.chat, { 
                    audio: { url: rutaAudio }, 
                    mimetype: 'audio/mpeg',
                    ptt: false, // <-- Esto hace que se envíe como archivo de audio
                    fileName: nombreArchivo // Añadimos el nombre para mejor compatibilidad
                }, { quoted: m })
                
                return true 
            } catch (e) {
                console.error(`> ❌ Error enviando audio: ${e}`)
            }
        }
    }
    return true
}

export default handler