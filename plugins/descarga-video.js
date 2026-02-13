// plugins/descarga-video.js
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
        return m.reply(`> ¿Qué video desea descargar, corazón?`);
    }

    if (activeDownloads.has(userId)) {
        await m.react('⏳');
        return m.reply(`> ⏳ *Ya estoy procesando un video para ti, paciencia.*`);
    }

    const tmpDir = path.join(process.cwd(), 'tmp');
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);
    
    const tempVideo = path.join(tmpDir, `video_${Date.now()}.mp4`);

    try {
        activeDownloads.set(userId, true);
        
        // 🔍 REACCIÓN BÚSQUEDA
        await m.react('🔍');
        
        // Llamar al scraper
        const videoData = await ytdl(text, 'mp4');
        
        const { title, duration, author, thumbnail, download_url } = videoData;
        
        // ⏱️ LÍMITE 1 HORA Y MEDIA
        const duracion = parseInt(duration) || 0;
        if (duracion > 5400) {
            await m.react('❌');
            activeDownloads.delete(userId);
            return m.reply(`> 🌪️ *El video excede 1 hora y media.*`);
        }

        // 📸 ENVIAR INFORMACIÓN
        const duracionFormato = duracion > 0 
            ? `${Math.floor(duracion / 60)}:${(duracion % 60).toString().padStart(2, '0')}` 
            : 'Desconocida';
            
        const videoInfo = `> 🎬 *「🍃」 ${title}*\n\n` +
            `> ⏱️ *Duración:* ${duracionFormato}\n` +
            `> 📺 *Canal:* ${author || 'Desconocido'}\n` +
            `> ⏳ *Procesando video...*`;

        await conn.sendMessage(m.chat, {
            image: { url: thumbnail },
            caption: videoInfo
        }, { quoted: m });

        // 📥 REACCIÓN DESCARGA
        await m.react('📥');
        
        // Descargar el video
        const response = await axios({
            url: download_url,
            method: 'GET',
            responseType: 'stream',
            timeout: 600000
        });
        
        const writer = fs.createWriteStream(tempVideo);
        response.data.pipe(writer);
        
        await new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });

        // ⚙️ REACCIÓN PROCESANDO
        await m.react('⚙️');

        // 📦 REACCIÓN ENVÍO
        await m.react('📦');
        
        const videoBuffer = fs.readFileSync(tempVideo);
        const safeTitle = title.substring(0, 50).replace(/[<>:"/\\|?*]/g, '');
        
        await conn.sendMessage(m.chat, {
            document: videoBuffer,
            mimetype: 'video/mp4',
            fileName: `${safeTitle}.mp4`,
            caption: `> ✅ *Aquí tiene su video, cielo.* 🦊 Kari`
        }, { quoted: m });

        // ✅ REACCIÓN ÉXITO
        await m.react('✅');

    } catch (error) {
        console.error('[Video Download Error]:', error.message);
        await m.react('❌');
        
        let errorMsg = '> 🌪️ *Vaya drama...* ';
        if (error.message.includes('No se encontraron resultados')) {
            errorMsg += 'No encontré ese video, corazón.';
        } else {
            errorMsg += 'Hubo un error al descargar el video.';
        }
        
        await m.reply(errorMsg);
    } finally {
        activeDownloads.delete(userId);
        if (fs.existsSync(tempVideo)) fs.unlinkSync(tempVideo);
    }
};

handler.help = ['video'];
handler.tags = ['downloader'];
handler.command = ['video'];
handler.group = true;

export default handler;