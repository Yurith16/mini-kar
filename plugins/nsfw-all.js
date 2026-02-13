import axios from 'axios';
import fetch from 'node-fetch';
import { verificarSaldoNSFW, procesarPagoNSFW } from '../lib/nsfw-pago.js';
import { checkReg } from '../lib/checkReg.js';

let handler = async (m, { command, conn, usedPrefix }) => {
    let chat = global.db.data.chats[m.chat];
    let user = global.db.data.users[m.sender];

    // 1. Verificación de Registro (Estilo KarBot)
    if (await checkReg(m, user)) return;

    // 2. Verificación NSFW
    if (!chat.nsfw) {
        await conn.sendMessage(m.chat, { react: { text: '🔞', key: m.key } });
        return m.reply(`> 🔞 *𝙽𝚂𝙵𝚆 𝙳𝙴𝚂𝙰𝙲𝚃𝙸𝚅𝙰𝙳𝙾*\n> 🌿 El burdel está cerrado por ahora.\n> 🔥 Actívalo con: *${usedPrefix}on nsfw*`);
    }

    try {
        // 3. Sistema de Pago NSFW (HotPass)
        const v = verificarSaldoNSFW(m.sender, 'fuerte');
        if (!v.success) {
            await conn.sendMessage(m.chat, { react: { text: '🎟️', key: m.key } });
            return m.reply(v.mensajeError);
        }

        await conn.sendMessage(m.chat, { react: { text: '🥵', key: m.key } });

        let url;
        let type = command;
        if (command === 'loli') type = 'nsfwloli';
        if (command === 'imglesbi') type = 'imagenlesbians';

        // --- LÓGICA DE OBTENCIÓN DE MEDIA ---
        switch (command) {
            case 'loli':
            case 'yuri':
            case 'tetas':
            case 'booty':
            case 'ecchi':
            case 'porno':
            case 'hentai':
            case 'pechos':
            case 'panties':
                let res = (await axios.get(`https://raw.githubusercontent.com/BrunoSobrino/TheMystic-Bot-MD/master/src/JSON/${type}.json`)).data;
                url = res[Math.floor(res.length * Math.random())];
                break;

            case 'imglesbi':
                let lesb = (await axios.get(`https://raw.githubusercontent.com/BrunoSobrino/TheMystic-Bot-MD/master/src/JSON/imagenlesbians.json`)).data;
                url = lesb[Math.floor(lesb.length * Math.random())];
                break;

            case 'trapito':
                let trap = await (await fetch(`https://api.waifu.pics/nsfw/trap`)).json();
                url = trap.url;
                break;

            case 'yaoi':
                let yaoi = await (await fetch(`https://nekobot.xyz/api/image?type=yaoi`)).json();
                url = yaoi.message;
                break;

            case 'yaoi2':
            case 'yuri2':
                let category = command === 'yaoi2' ? 'yaoi' : 'yuri';
                let purr = await (await fetch(`https://purrbot.site/api/img/nsfw/${category}/gif`)).json();
                url = purr.link;
                break;

            case 'randomxxx':
                const raws = ['tetas', 'booty', 'imagenlesbians', 'panties', 'porno'];
                let pick = raws[Math.floor(raws.length * Math.random())];
                let resRand = (await axios.get(`https://raw.githubusercontent.com/BrunoSobrino/TheMystic-Bot-MD/master/src/JSON/${pick}.json`)).data;
                url = resRand[Math.floor(resRand.length * Math.random())];
                break;
        }

        if (!url) throw 'Url no encontrada';

        // 4. Procesar el cobro y obtener el mensaje diseñado
        const pago = procesarPagoNSFW(m.sender, 'fuerte');

        // 5. Envío del mensaje con el caption centralizado
        await conn.sendMessage(m.chat, { 
            image: { url: url }, 
            caption: pago.caption 
        }, { quoted: m });
        
        await conn.sendMessage(m.chat, { react: { text: '💦', key: m.key } });

    } catch (e) {
        console.error(e);
        await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
        m.reply('> 🥀 La conexión falló... el deseo tendrá que esperar.');
    }
};

handler.help = ['loli', 'yuri', 'yuri2', 'yaoi', 'yaoi2', 'tetas', 'booty', 'ecchi', 'trapito', 'imglesbi', 'porno'];
handler.command = /^(loli|yuri|yuri2|yaoi|yaoi2|tetas|booty|ecchi|trapito|imglesbi|porno|hentai|pechos|panties|randomxxx)$/i;
handler.tags = ['NSFW'];
handler.register = true;

export default handler;