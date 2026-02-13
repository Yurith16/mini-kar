import axios from 'axios';
import { checkReg } from '../lib/checkReg.js';

// Sistema de descargas activas por usuario
const userDownloads = new Map();

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
        });

        const videos = response.data?.data?.videos || [];

        if (videos.length === 0) throw new Error('No se encontraron videos.');

        // Retornamos hasta 10 videos válidos
        return videos
            .map(v => ({
                description: v.title ? v.title.slice(0, 100) : "Video de TikTok",
                videoUrl: v.play || v.wmplay || v.hdplay || null,
                author: v.author?.nickname || "Usuario"
            }))
            .filter(v => v.videoUrl)
            .slice(0, 10);

    } catch (error) {
        throw new Error(`API no responde. Intenta más tarde.`);
    }
}

let handler = async (m, { conn, text, usedPrefix }) => {
    const userId = m.sender;
    const jid = m.chat;
    let user = global.db.data.users[userId];

    if (await checkReg(m, user)) return;

    if (userDownloads.has(userId)) {
        return m.react('⏳');
    }

    if (!text) {
        return conn.reply(jid, `> ⚙️ *𝙸𝙽𝙶𝚁𝙴𝚂𝙰 𝚄𝙽𝙰 𝙱𝚄́𝚂𝚀𝚄𝙴𝙳𝙰*\n▸ *Ejemplo:* ${usedPrefix}tks memes de gatos`, m);
    }

    userDownloads.set(userId, true);

    try {
        await m.react('🔍');

        const searchResults = await tiktokSearchKarbot(text);

        if (searchResults.length < 2) {
            throw new Error('No encontré suficientes videos.');
        }

        await m.react('⬇️');

        // Procesar de 2 en 2
        for (let i = 0; i < searchResults.length; i += 2) {
            const chunk = searchResults.slice(i, i + 2);
            
            await Promise.all(chunk.map(async (video, index) => {
                const globalIndex = i + index + 1;
                try {
                    await conn.sendMessage(jid, {
                        video: { url: video.videoUrl },
                        caption: `> 🎵 *${video.description}*\n> 👤 @${video.author}\n> ✨ *Video ${globalIndex}/10*`,
                        mimetype: 'video/mp4'
                    }, { quoted: m });
                } catch (e) {
                    console.error(`Error enviando video ${globalIndex}`);
                }
            }));

            // Pequeña pausa dramática entre bloques de 2 para evitar spam
            if (i + 2 < searchResults.length) {
                await new Promise(resolve => setTimeout(resolve, 1500));
            }
        }

        await m.react('✅');

    } catch (error) {
        await m.react('❌');
        await conn.reply(jid, `> 🌪️ *Vaya drama...* ${error.message}`, m);
    } finally {
        userDownloads.delete(userId);
    }
};

handler.help = ['tiktoks <texto>'];
handler.tags = ['downloader'];
handler.command = /^(tiktoks|tks|tiktoksearch)$/i;

export default handler;