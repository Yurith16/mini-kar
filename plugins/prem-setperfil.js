import { writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import { checkReg } from '../lib/checkReg.js'

let handler = async (m, { conn, usedPrefix, command }) => {
    let user = global.db.data.users[m.sender];

    // Verificación de registro
    if (await checkReg(m, user)) return

    let dir = join(process.cwd(), "src", "Images", "perfiles");
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

    let q = m.quoted ? m.quoted : m;
    let mime = (q.msg || q).mimetype || "";

    // Lógica para capturar Imagen
    if (/image/.test(mime)) {
        await m.react("📸");
        try {
            let img = await q.download();
            // Guardamos la imagen con el ID del usuario para que el comando perfil la reconozca
            let pathImg = join(dir, `${m.sender.split("@")[0]}.png`);
            writeFileSync(pathImg, img);

            let txt = `✨ *IDENTIDAD ACTUALIZADA*\n\n`
            txt += `> Tu esencia visual ha sido guardada en nuestros registros.\n\n`
            txt += `_Puedes ver el resultado con \`${usedPrefix}perfil\`_`

            return await conn.sendMessage(m.chat, { text: txt }, { quoted: m });
        } catch (e) {
            return m.reply("> 🥀 Hubo un problema al procesar la imagen, inténtalo de nuevo.");
        }
    }

    // Mensaje si no se envía o responde a una imagen
    let help = `🍃 *CONFIGURAR PERFIL*\n\n`
    help += `> Para cambiar tu imagen de perfil en KarBot, responde a una foto con el comando:\n\n`
    help += `*COMANDO:* \`${usedPrefix + command}\`\n\n`
    help += `_Crea una identidad que valga la pena recordar._`
    
    return await conn.sendMessage(m.chat, { text: help }, { quoted: m });
};

handler.help = ["setperfil"];
handler.tags = ["main"];
handler.command = /^(setperfil|configurar|perfilset)$/i;
handler.register = true;

export default handler;