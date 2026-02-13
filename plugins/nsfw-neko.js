import { verificarSaldoNSFW, procesarPagoNSFW } from '../lib/nsfw-pago.js';
import { checkReg } from '../lib/checkReg.js';

// --- LISTADO DE IMÁGENES ---
const nekoImages = [
  "https://files.catbox.moe/qz3pix.jpg", "https://files.catbox.moe/mv26d5.jpg", "https://files.catbox.moe/tjbhm0.jpg",
  "https://files.catbox.moe/vd6f3x.jpg", "https://files.catbox.moe/d27pwj.jpg", "https://files.catbox.moe/e69n64.jpeg",
  "https://files.catbox.moe/ocglqs.webp", "https://files.catbox.moe/ha8p64.webp", "https://files.catbox.moe/q2b5za.webp",
  "https://files.catbox.moe/uyhbvi.webp", "https://files.catbox.moe/9yxqj2.jpg", "https://files.catbox.moe/wfq3ig.jpg",
  "https://files.catbox.moe/c9vs9z.jpg", "https://files.catbox.moe/achi39.jpg", "https://files.catbox.moe/phtwri.jpg",
  "https://files.catbox.moe/sdheiy.jpg", "https://files.catbox.moe/xts6oc.jpg", "https://files.catbox.moe/74o5ad.jpg",
  "https://files.catbox.moe/1bzr5n.jpg", "https://files.catbox.moe/ngg7b1.jpg", "https://files.catbox.moe/3qrkoq.jpg",
  "https://files.catbox.moe/hyjiv4.jpg", "https://files.catbox.moe/6l7js1.jpg", "https://files.catbox.moe/8pwqm9.jpg",
  "https://files.catbox.moe/y616bz.jpg", "https://files.catbox.moe/eh200l.jpg", "https://files.catbox.moe/iq6g17.jpg",
  "https://files.catbox.moe/ef2q3v.jpg", "https://files.catbox.moe/rsmmg7.jpg", "https://files.catbox.moe/elc8xe.jpg",
  "https://files.catbox.moe/ego1js.jpg", "https://files.catbox.moe/9qy0y7.jpg", "https://files.catbox.moe/fmll00.jpg",
  "https://files.catbox.moe/k403tr.jpg", "https://files.catbox.moe/p6rm9c.jpg", "https://files.catbox.moe/r632qa.jpg",
  "https://files.catbox.moe/fh87sd.jpg", "https://files.catbox.moe/qq711z.jpg", "https://files.catbox.moe/lyii18.jpg",
  "https://files.catbox.moe/19x0x8.jpg"
];

const userNekoIndex = new Map();

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
        // 3. Sistema de Pago NSFW (HotPass) - MODO NORMAL
        const v = verificarSaldoNSFW(m.sender, 'normal');
        if (!v.success) {
            await conn.sendMessage(m.chat, { react: { text: '🎟️', key: m.key } });
            return m.reply(v.mensajeError);
        }

        await conn.sendMessage(m.chat, { react: { text: '🥵', key: m.key } });

        // 4. Lógica de selección de imagen
        let currentIndex = userNekoIndex.get(m.sender) || 0;
        let url = nekoImages[currentIndex % nekoImages.length];

        if (!url) throw 'Url no encontrada';

        // 5. Procesar el cobro y obtener el mensaje centralizado (MODO NORMAL)
        const pago = procesarPagoNSFW(m.sender, 'normal');

        // Envío con el caption diseñado desde pago-nsfw
        await conn.sendMessage(m.chat, { 
            image: { url: url }, 
            caption: pago.caption 
        }, { quoted: m });
        
        // Actualizar índice para el usuario
        userNekoIndex.set(m.sender, (currentIndex + 1) % nekoImages.length);
        
        await conn.sendMessage(m.chat, { react: { text: '💦', key: m.key } });

    } catch (e) {
        console.error(e);
        await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
        m.reply('> 🥀 La conexión falló... el deseo tendrá que esperar.');
    }
};

handler.help = ['neko2'];
handler.command = /^(neko2)$/i;
handler.tags = ['NSFW'];
handler.register = true;

export default handler;