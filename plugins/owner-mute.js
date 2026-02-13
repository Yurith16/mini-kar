let mutedUsers = new Set();

let handler = async (m, { conn, usedPrefix, command, isAdmin, isBotAdmin }) => {
    if (!isBotAdmin) return conn.reply(m.chat, '*⚙️ 𝙺𝙰𝚁𝙱𝙾𝚃 ⚙️*\n\n> 🚫 𝙽𝙴𝙲𝙴𝚂𝙸𝚃𝙰 𝚂𝙴𝚁 𝙰𝙳𝙼𝙸𝙽𝙸𝚂𝚃𝚁𝙰𝙳𝙾𝚁', m);
    if (!isAdmin) return conn.reply(m.chat, '*⚙️ 𝙺𝙰𝚁𝙱𝙾𝚃 ⚙️*\n\n> 👑 𝚂𝙾𝙻𝙾 𝙿𝙰𝚁𝙰 𝙰𝙳𝙼𝙸𝙽𝙸𝚂𝚃𝚁𝙰𝙳𝙾𝚁𝙴𝚂', m);

    let user;
    if (m.quoted) {
        user = m.quoted.sender;
    } else {
        return conn.reply(m.chat, '*⚙️ 𝙺𝙰𝚁𝙱𝙾𝚃 ⚙️*\n\n> 📝 𝚁𝙴𝚂𝙿𝙾𝙽𝙳𝙴 𝙰𝙻 𝙼𝙴𝙽𝚂𝙰𝙹𝙴 𝙳𝙴𝙻 𝚄𝚂𝚄𝙰𝚁𝙸𝙾', m);
    }

    if (command === "mute") {
        mutedUsers.add(user);
        conn.reply(m.chat, '*⚙️ 𝙺𝙰𝚁𝙱𝙾𝚃 ⚙️*\n\n> 🔇 𝚄𝚂𝚄𝙰𝚁𝙸𝙾 𝙼𝚄𝚃𝙴𝙰𝙳𝙾\n> 👤 @' + user.split('@')[0], m, { mentions: [user] });
    } else if (command === "unmute") {
        mutedUsers.delete(user);
        conn.reply(m.chat, '*⚙️ 𝙺𝙰𝚁𝙱𝙾𝚃 ⚙️*\n\n> 🔊 𝚄𝚂𝚄𝙰𝚁𝙸𝙾 𝙳𝙴𝚂𝙼𝚄𝚃𝙴𝙰𝙳𝙾\n> 👤 @' + user.split('@')[0], m, { mentions: [user] });
    }
};

handler.before = async (m, { conn }) => {
    if (mutedUsers.has(m.sender) && m.mtype !== 'stickerMessage') {
        try {
            await conn.sendMessage(m.chat, { delete: m.key });
        } catch (e) {
            console.error(e);
        }
    }
};

handler.help = ['mute', 'unmute'];
handler.tags = ['group'];
handler.command = ['mute', 'unmute'];
handler.group = true;
handler.admin = true;
handler.botAdmin = true;

export default handler;