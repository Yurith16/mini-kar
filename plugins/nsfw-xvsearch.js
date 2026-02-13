import fetch from 'node-fetch'
import cheerio from 'cheerio'
import { verificarSaldoNSFW, procesarPagoNSFW } from '../lib/nsfw-pago.js'
import { checkReg } from '../lib/checkReg.js'

/**
 * Función Scraper de Búsqueda Xvideos - Lógica Intacta
 */
async function xvideosSearch(query) {
    return new Promise((resolve, reject) => {
        const baseurl = "https://www.xvideos.com";
        fetch(`${baseurl}/?k=${query}&p=${Math.floor(Math.random() * 3)}`, { method: "get" })
            .then((res) => res.text())
            .then((res) => {
                const $ = cheerio.load(res, { xmlMode: false });
                const results = [];
                $('div.mozaique > div.thumb-block').each(function (a, b) {
                    const url = baseurl + $(b).find('div.thumb > a').attr('href');
                    const title = $(b).find('p > a').attr('title');
                    const duration = $(b).find('span.duration').text();
                    if (title && url) {
                        results.push({ title, link: url, duration: duration || "N/A" });
                    }
                });
                if (results.length === 0) return reject(new Error("No results"));
                resolve({ status: true, result: results });
            })
            .catch((err) => reject(err));
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

    // 2. Verificación de Saldo (Normal)
    const v = verificarSaldoNSFW(m.sender, 'normal');
    if (!v.success) {
        await conn.sendMessage(m.chat, { react: { text: '🎟️', key: m.key } });
        return m.reply(v.mensajeError);
    }

    let text = args.join(" ").trim();
    if (!text) {
        await conn.sendMessage(m.chat, { react: { text: '🥵', key: m.key } });
        return m.reply(`> 🌿 ¿Qué se te antoja buscar hoy, cielo?`);
    }

    try {
        await conn.sendMessage(m.chat, { react: { text: "🔍", key: m.key } });

        const res = await xvideosSearch(text);
        const json = res.result;

        // 3. Cobro Seguro: Solo si el scraper encontró videos
        const pago = procesarPagoNSFW(m.sender, 'normal');

        if (!global.videoListXXX) global.videoListXXX = {};
        global.videoListXXX[m.sender] = json.map(v => v.link); 

        // 4. Caption Minimalista
        let cap = `> 😈 *𝚁𝙴𝚂𝚄𝙻𝚃𝙰𝙳𝙾𝚂 𝙳𝙴:* _${text.toUpperCase()}_\n\n`;

        let count = 1;
        for (const v of json) {
            cap += ` *${count}.* ${v.title}\n`;
            cap += `> ⏳ *𝙳𝚞𝚛𝚊𝚌𝚒ó𝚗:* ${v.duration}\n\n`;
            count++;
            if (count > 10) break;
        }

        cap += `> 🫦 *𝙳𝚎𝚜𝚌𝚊𝚛𝚐𝚊 𝚌𝚘𝚗:* \` ${usedPrefix}xvideosdl [número] \`\n\n`;
        cap += pago.caption;

        await conn.sendMessage(m.chat, { text: cap.trim() }, { quoted: m });
        await conn.sendMessage(m.chat, { react: { text: "✅", key: m.key } });

    } catch (e) {
        await conn.sendMessage(m.chat, { react: { text: "❌", key: m.key } });
        m.reply(`> 💔 *Sin resultados:* Tus gustos son muy exóticos.\n> 🎫 *𝙽𝚘 𝚜𝚎 𝚑𝚊 𝚌𝚘𝚋𝚛𝚊𝚍𝚘 𝚗𝚊𝚍𝚊.*`);
    }
};

handler.help = ['xvsearch <tema>'];
handler.tags = ['NSFW'];
handler.command = /^(xvsearch|xvideossearch)$/i;
handler.register = true;

export default handler;