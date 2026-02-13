// plugins/descarga-audio.js
import ytdl from './scraper-ytdl.js';
import { checkReg } from '../lib/checkReg.js';
import fs from 'fs';
import path from 'path';
import axios from 'axios';

// Control de descargas activas por usuario
const activeDownloads = new Map();

let handler = async (m, { conn, text }) => {
    const userId = m.sender;
    const user = global.db.data.users[userId];

    if (await checkReg(m, user)) return;

    if (!text) {
        await m.react('🤔');
        return m.reply(`> ¿Qué canción desea descargar, corazón?`);
    }

    if (activeDownloads.has(userId)) {
        await m.react('⏳');
        return m.reply(`> ⏳ *Ya estoy procesando un audio para ti, paciencia.*`);
    }

    const tmpDir = path.join(process.cwd(), 'tmp');
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);
    
    const tempAudio = path.join(tmpDir, `audio_${Date.now()}.mp3`);

    try {
        activeDownloads.set(userId, true);
        
        // 🔍 REACCIÓN BÚSQUEDA
        await m.react('🔍');
        
        // Llamar al scraper
        const audioData = await ytdl(text, 'mp3');
        
        const { title, duration, author, thumbnail, download_url } = audioData;
        
        // ⏱️ LÍMITE 30 MINUTOS
        const duracion = parseInt(duration) || 0;
        if (duracion > 1800) {
            await m.react('❌');
            activeDownloads.delete(userId);
            return m.reply(`> 🌪️ *La canción excede 30 minutos.*`);
        }

        // 📸 ENVIAR INFORMACIÓN
        const duracionFormato = duracion > 0 
            ? `${Math.floor(duracion / 60)}:${(duracion % 60).toString().padStart(2, '0')}` 
            : 'Desconocida';
            
        const audioInfo = `> 🎵 *「🍃」 ${title}*\n\n` +
            `> ⏱️ *Duración:* ${duracionFormato}\n` +
            `> 🎤 *Artista:* ${author || 'Desconocido'}\n` +
            `> 🔊 *Calidad:* 320kbps\n` +
            `> ⏳ *Procesando audio...*`;

        await conn.sendMessage(m.chat, {
            image: { url: thumbnail },
            caption: audioInfo
        }, { quoted: m });

        // 📥 REACCIÓN DESCARGA
        await m.react('📥');
        
        // Descargar el audio
        const response = await axios({
            url: download_url,
            method: 'GET',
            responseType: 'stream',
            timeout: 300000
        });
        
        const writer = fs.createWriteStream(tempAudio);
        response.data.pipe(writer);
        
        await new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });

        // ⚙️ REACCIÓN PROCESANDO
        await m.react('⚙️');

        // 📦 REACCIÓN ENVÍO
        await m.react('📦');
        
        const audioBuffer = fs.readFileSync(tempAudio);
        const safeTitle = title.substring(0, 50).replace(/[<>:"/\\|?*]/g, '');
        
        await conn.sendMessage(m.chat, {
            document: audioBuffer,
            mimetype: 'audio/mpeg',
            fileName: `${safeTitle}.mp3`
        }, { quoted: m });

        // ✅ REACCIÓN ÉXITO
        await m.react('✅');

    } catch (error) {
        console.error('[Audio Download Error]:', error.message);
        await m.react('❌');
        
        let errorMsg = '> 🌪️ *Vaya drama...* ';
        if (error.message.includes('No se encontraron resultados')) {
            errorMsg += 'No encontré esa canción, corazón.';
        } else {
            errorMsg += 'Hubo un error al descargar el audio.';
        }
        
        await m.reply(errorMsg);
    } finally {
        activeDownloads.delete(userId);
        if (fs.existsSync(tempAudio)) fs.unlinkSync(tempAudio);
    }
};

handler.help = ['audio'];
handler.tags = ['downloader'];
handler.command = ['audio'];
handler.group = true;

export default handler;