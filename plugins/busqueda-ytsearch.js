import yts from "yt-search";
import { checkReg } from '../lib/checkReg.js';

let handler = async (m, { conn, text, usedPrefix, command }) => {
    const userId = m.sender;
    const user = global.db.data.users[userId];

    // 1. Verificación de Registro (Estilo KarBot)
    if (await checkReg(m, user)) return;

    // --- MENSAJE HUMANO SI NO HAY TEXTO ---
    if (!text) return m.reply(`> ¿Qué desea buscar en YouTube?`);

    try {
        // Secuencia de reacciones para dar vida al chat 🍃
        const reacciones = ['🔍', '🌿', '🍀', '🎶']
        for (const reacc of reacciones) {
            await m.react(reacc)
        }

        const results = await yts(text);

        // --- MENSAJE HUMANO SI NO HAY RESULTADOS ---
        if (!results || !results.videos.length) {
            await m.react('❌')
            return m.reply(`> Lo siento, hubo un error.`);
        }

        // Tomamos los primeros 5 resultados
        const videos = results.videos.slice(0, 5);

        // 2. Enviar los videos encontrados con el diseño de naturaleza
        for (const video of videos) {
            const videoDetails = `> 🎵 *「🌱」 ${video.title}*\n\n` +
                `> 🍃 *Canal:* » ${video.author.name}\n` +
                `> ⚘ *Duración:* » ${video.duration.timestamp}\n` +
                `> 🌼 *Vistas:* » ${(video.views || 0).toLocaleString()}\n` +
                `> 🍀 *Publicado:* » ${video.ago || 'Desconocido'}\n` +
                `> 🌿 *Enlace:* » ${video.url}`;

            await conn.sendMessage(m.chat, {
                image: { url: video.thumbnail },
                caption: videoDetails
            }, { quoted: m });
        }

        // El engranaje final, el sello de nuestra ingeniería ⚙️
        await m.react('⚙️');

    } catch (e) {
        console.error(e);
        await m.react('❌');
        m.reply(`> Lo siento, hubo un error.`);
    }
};

handler.help = ['yts (buscar en YouTube)'];
handler.tags = ['downloader']
handler.command = /^(yts|ytsearch)$/i;
handler.group = true;

export default handler;