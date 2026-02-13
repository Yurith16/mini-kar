import fetch from 'node-fetch'
import cheerio from 'cheerio'
import { verificarSaldoNSFW, procesarPagoNSFW } from '../lib/nsfw-pago.js'
import { checkReg } from '../lib/checkReg.js'

const NSFW_ATREVIDO_SEARCH = {
    buscando: "🤫 ¡Espera! Estoy revisando los rincones más sucios de XNXX por ti. Dame un momento... 🔍",
    exito: "😈 ¡Aquí están los resultados! Mira la lista y elige tu placer. 👇",
    sin_argumentos: "🥵 Veo que tienes prisa. Para empezar la acción, dame el *término* de búsqueda. ¡No seas tímido! 😌",
    error_no_encontrado: "🤔 No encontré nada para esa *fantasía*... Intenta ser más específico o buscar algo más popular. 🤨",
    error_nsfw_off: "⛔ ¡ALTO! El burdel digital está cerrado en este grupo. 😞"
};

async function xnxxsearch(query) {
    return new Promise((resolve, reject) => {
        const baseurl = "https://www.xnxx.com";
        fetch(`${baseurl}/search/${query}/${Math.floor(Math.random() * 3) + 1}`, { method: "get" })
            .then((res) => res.text())
            .then((res) => {
                const $ = cheerio.load(res, { xmlMode: false });
                const results = [];
                $("div.mozaique").each(function (a, b) {
                    $(b).find("div.thumb-under").each(function (c, d) {
                        const url = baseurl + $(d).find("a").attr("href").replace("/THUMBNUM/", "/");
                        const title = $(d).find("a").attr("title");
                        const infoString = $(d).find("p.metadata").text().trim();
                        const parts = infoString.split("|").map((p) => p.trim());
                        if (title && url) {
                            results.push({
                                title,
                                link: url,
                                durationQuality: parts[0] || "N/A",
                                viewsAndDate: parts[1] || "N/A",
                            });
                        }
                    });
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

    // 1. Verificación de Registro (KarBot Style)
    if (await checkReg(m, user)) return;
    
    // 2. Verificación NSFW
    if (!chat.nsfw) {
        await conn.sendMessage(m.chat, { react: { text: '🔞', key: m.key } });
        return m.reply(`> 🔞 *𝙽𝚂𝙵𝚆 𝙳𝙴𝚂𝙰𝙲𝚃𝙸𝚅𝙰𝙳𝙾*\n> 🌿 El burdel está cerrado por ahora.\n> 🔥 Actívalo con: *${usedPrefix}on nsfw*`);
    }

    // 3. Sistema de Pago (Solo verificación de saldo inicial)
    const v = verificarSaldoNSFW(m.sender, 'normal');
    if (!v.success) {
        await conn.sendMessage(m.chat, { react: { text: '🎟️', key: m.key } });
        return m.reply(v.mensajeError);
    }

    let text = args.join(" ").trim();
    if (!text) {
        await conn.sendMessage(m.chat, { react: { text: '🥵', key: m.key } });
        return m.reply(`> ✦ *Error:* » ${NSFW_ATREVIDO_SEARCH.sin_argumentos}\n> ⴵ *Ejemplo:* » ${usedPrefix}${command} con mi prima`);
    }

    try {
        await conn.sendMessage(m.chat, { react: { text: "🔍", key: m.key } });
        m.reply(`> 💫 *Estado:* » ${NSFW_ATREVIDO_SEARCH.buscando}`);

        const res = await xnxxsearch(text);
        const json = res.result;

        // 4. Lógica de Cobro: Solo si hay resultados (json tiene datos)
        const pago = procesarPagoNSFW(m.sender, 'normal');

        if (!global.videoListXXX) global.videoListXXX = {};
        global.videoListXXX[m.sender] = []; 

        let cap = `╭━━━〔 🔥 *𝙺𝙰𝚁𝙱𝙾𝚃 𝚂𝙴𝙰𝚁𝙲𝙷* 〕━━━╮\n\n`;
        cap += `*${NSFW_ATREVIDO_SEARCH.exito}*\n\n`;
        cap += `*Búsqueda:* _${text.toUpperCase()}_\n\n`;

        let count = 1;
        for (const v of json) {
            global.videoListXXX[m.sender].push(v.link);
            cap += ` *「${count}」 ${v.title}*\n`;
            cap += `> ✦ *Detalles:* » ${v.durationQuality}\n`;
            cap += "—\n";
            count++;
            if (count > 10) break;
        }

        cap += `\n*😈 Descarga con:* \` ${usedPrefix}xnxxdl [número] \`\n\n`;
        cap += pago.caption; // Añadimos el diseño de pago (Costo y Saldo)

        await conn.sendMessage(m.chat, { text: cap.trim() }, { quoted: m });
        await conn.sendMessage(m.chat, { react: { text: "✅", key: m.key } });

    } catch (e) {
        await conn.sendMessage(m.chat, { react: { text: "❌", key: m.key } });
        m.reply(`> 💔 *Fallo:* » ${NSFW_ATREVIDO_SEARCH.error_no_encontrado}\n> 🎫 *𝙽𝚘 𝚜𝚎 𝚑𝚊 𝚌𝚘𝚋𝚛𝚊𝚍𝚘 𝚗𝚊𝚍𝚊 𝚊ú𝚗.*`);
    }
};

handler.help = ['xnxxsearch <texto>'];
handler.tags = ['NSFW'];
handler.command = /^(xnxxsearch|xnxxs|searchxnxx)$/i;
handler.register = true;

export default handler;