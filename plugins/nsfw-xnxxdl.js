import axios from 'axios'
import fetch from 'node-fetch'
import cheerio from 'cheerio'
import fs from 'fs'
import path from 'path'
import { verificarSaldoNSFW, procesarPagoNSFW } from '../lib/nsfw-pago.js'
import { checkReg } from '../lib/checkReg.js'

async function xnxxdl(URL) {
    return new Promise((resolve, reject) => {
        fetch(URL, { method: "get" })
            .then((res) => res.text())
            .then((res) => {
                const $ = cheerio.load(res, { xmlMode: false });
                const title = $('meta[property="og:title"]').attr("content") || "Video";
                const videoScript = $("#video-player-bg > script:nth-child(6)").html() || $('body script:contains("setVideoUrlHigh")').html();
                if (!videoScript) return reject(new Error("No script found"));
                const files = {
                    low: (videoScript.match(/html5player\.setVideoUrlLow\('(.*?)'\);/i) || [])[1]?.replace(/\\/g, ""),
                    high: (videoScript.match(/html5player\.setVideoUrlHigh\('(.*?)'\);/i) || [])[1]?.replace(/\\/g, ""),
                };
                if (!files.high) return reject(new Error("No high quality link"));
                resolve({ status: 200, result: { title, files } });
            })
            .catch((err) => reject(err));
    });
}

let handler = async (m, { conn, args, usedPrefix, command }) => {
    let chat = global.db.data.chats[m.chat];
    let user = global.db.data.users[m.sender];

    if (await checkReg(m, user)) return;

    if (!chat.nsfw) {
        await conn.sendMessage(m.chat, { react: { text: '🔞', key: m.key } });
        return m.reply(`> 🔞 *𝙽𝚂𝙵𝚆 𝙳𝙴𝚂𝙰𝙲𝚃𝙸𝚅𝙰𝙳𝙾*`);
    }

    const v = verificarSaldoNSFW(m.sender, 'fuerte');
    if (!v.success) {
        await conn.sendMessage(m.chat, { react: { text: '🎟️', key: m.key } });
        return m.reply(v.mensajeError);
    }

    let text = args.join(" ").trim();
    if (!text) return m.reply(`> 🥵 Dame el link o número, cielo.`);

    let xnLink = "";
    if (text.match(/https?:\/\/(www\.)?xnxx\.[a-z]+\/video-/i)) {
        xnLink = text;
    } else {
        const index = parseInt(text) - 1;
        if (global.videoListXXX && global.videoListXXX[m.sender] && global.videoListXXX[m.sender][index]) {
            xnLink = global.videoListXXX[m.sender][index];
        } else {
            return m.reply(`> 💔 No hay resultados previos para el número "${text}".`);
        }
    }

    let tempPath = path.join(process.cwd(), `temp/xnxx_${Date.now()}.mp4`);
    if (!fs.existsSync(path.join(process.cwd(), 'temp'))) fs.mkdirSync(path.join(process.cwd(), 'temp'));

    try {
        await conn.sendMessage(m.chat, { react: { text: "🔍", key: m.key } });
        const res = await xnxxdl(xnLink);
        
        await conn.sendMessage(m.chat, { react: { text: "📥", key: m.key } });
        const response = await axios({ method: "GET", url: res.result.files.high, responseType: "stream" });
        const writer = fs.createWriteStream(tempPath);
        response.data.pipe(writer);

        await new Promise((resolve, reject) => {
            writer.on("finish", resolve);
            writer.on("error", reject);
        });

        const stats = fs.statSync(tempPath);
        const fileSizeMB = stats.size / (1024 * 1024);

        if (fileSizeMB > 2000) {
            if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
            return m.reply(`> 🚫 Demasiado pesado para enviarlo.`);
        }

        const pago = procesarPagoNSFW(m.sender, 'fuerte');

        let caption = `> 🎬 *𝚃í𝚝𝚞𝚕𝚘:* ${res.result.title}\n`;
        caption += `> 🫦 *Aquí tienes tu pedido, corazón.*\n\n`;
        caption += pago.caption;

        await conn.sendMessage(m.chat, {
            video: fs.readFileSync(tempPath),
            caption: caption,
            mimetype: 'video/mp4'
        }, { quoted: m });

        await conn.sendMessage(m.chat, { react: { text: "💦", key: m.key } });

    } catch (error) {
        await conn.sendMessage(m.chat, { react: { text: "❌", key: m.key } });
        m.reply(`> 🥀 Falló la descarga. Tus pases están a salvo.`);
    } finally {
        if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
    }
};

handler.help = ['xnxxdl <link/num>'];
handler.tags = ['NSFW'];
handler.command = /^(xnxxdl|xnvideo)$/i;
handler.register = true;

export default handler;