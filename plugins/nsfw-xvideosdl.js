import fetch from 'node-fetch'
import cheerio from 'cheerio'
import { verificarSaldoNSFW, procesarPagoNSFW } from '../lib/nsfw-pago.js'
import { checkReg } from '../lib/checkReg.js'

/**
 * Scraper de Xvideos - Lógica Intacta
 */
async function xvideosdl(url) {
    return new Promise((resolve, reject) => {
        fetch(url, { method: "get" })
            .then((res) => res.text())
            .then((res) => {
                let $ = cheerio.load(res, { xmlMode: false });
                let url_high = $("#html5video > #html5video_base > div > a").attr("href");

                if (!url_high) {
                    const scriptText = $("body script").get().map((s) => $(s).html()).join("");
                    const urlMatch = scriptText.match(/setVideoUrlHigh\('(.*?)'\)/i);
                    if (urlMatch && urlMatch[1]) {
                        url_high = urlMatch[1].replace(/\\/g, "");
                    }
                }

                if (!url_high) return reject(new Error("No URL found"));

                const title = $("meta[property='og:title']").attr("content") || "Video Xvideos";
                resolve({ status: 200, result: { title, url: url_high } });
            })
            .catch(reject);
    });
}

let handler = async (m, { conn, args, usedPrefix, command }) => {
    let chat = global.db.data.chats[m.chat];
    let user = global.db.data.users[m.sender];

    // 1. Verificación de Registro y NSFW
    if (await checkReg(m, user)) return;

    if (!chat.nsfw) {
        await conn.sendMessage(m.chat, { react: { text: '🔞', key: m.key } });
        return m.reply(`> 🔞 *𝙽𝚂𝙵𝚆 𝙳𝙴𝚂𝙰𝙲𝚃𝙸𝚅𝙰𝙳𝙾*\n> 🔥 Actívalo con: *${usedPrefix}on nsfw*`);
    }

    // 2. Verificación de Saldo (Sin cobro aún)
    const v = verificarSaldoNSFW(m.sender, 'fuerte');
    if (!v.success) {
        await conn.sendMessage(m.chat, { react: { text: '🎟️', key: m.key } });
        return m.reply(v.mensajeError);
    }

    let link = args[0];
    if (!link || !link.startsWith("http")) {
        await conn.sendMessage(m.chat, { react: { text: '🥵', key: m.key } });
        return m.reply(`> 🌿 Proporciona un enlace válido de Xvideos, cielo.`);
    }

    // 3. Reacciones de proceso
    await conn.sendMessage(m.chat, { react: { text: "🔍", key: m.key } });

    try {
        const res = await xvideosdl(link);
        const downloadUrl = res.result.url;
        const videoTitle = res.result.title;

        await conn.sendMessage(m.chat, { react: { text: "👅", key: m.key } });

        // 4. Cobro Seguro y Caption Minimalista
        const pago = procesarPagoNSFW(m.sender, 'fuerte');

        let finalCaption = `> 🎬 *𝚃í𝚝𝚞𝚕𝚘:* ${videoTitle}\n`;
        finalCaption += `> 🫦 *Aquí tienes tu pedido, corazón.*\n\n`;
        finalCaption += pago.caption;

        await conn.sendMessage(m.chat, { react: { text: "⬆️", key: m.key } });

        // 5. Envío del archivo
        await conn.sendMessage(m.chat, {
            video: { url: downloadUrl },
            caption: finalCaption,
            mimetype: 'video/mp4',
            fileName: `${videoTitle}.mp4`
        }, { quoted: m });

        await conn.sendMessage(m.chat, { react: { text: "💦", key: m.key } });

    } catch (error) {
        console.error(error);
        await conn.sendMessage(m.chat, { react: { text: "❌", key: m.key } });
        m.reply(`> 💔 *Fallo:* El video es inalcanzable.\n> 🎫 *𝚃𝚞𝚜 𝚙𝚊𝚜𝚎𝚜 𝚎𝚜𝚝á𝚗 𝚊 𝚜𝚊𝚕𝚟𝚘.*`);
    }
};

handler.help = ['xvideosdl <link>'];
handler.tags = ['NSFW'];
handler.command = /^(xvideosdl|xvdl|xvideos)$/i;
handler.register = true;

export default handler;