let linkRegex = /https:\/\/chat\.whatsapp\.com\/([0-9A-Za-z]{20,24})/i;

let handler = async (m, { conn, text, isOwner }) => {
    if (!text) return m.reply('*⚙️ 𝙺𝙰𝚁𝙱𝙾𝚃 ⚙️*\n\n> 🚫 𝙸𝙽𝚅𝙸𝚃𝙰𝙲𝙸𝙾𝙽 𝚁𝙴𝚀𝚄𝙴𝚁𝙸𝙳𝙰');

    let [_, code] = text.match(linkRegex) || [];

    if (!code) return m.reply('*⚙️ 𝙺𝙰𝚁𝙱𝙾𝚃 ⚙️*\n\n> ❌ 𝙴𝙽𝙻𝙰𝙲𝙴 𝙸𝙽𝚅𝙰𝙻𝙸𝙳𝙾');

    if (isOwner) {
        await conn.groupAcceptInvite(code)
            .then(res => m.reply('*⚙️ 𝙺𝙰𝚁𝙱𝙾𝚃 ⚙️*\n\n> ✅ 𝚄𝙽𝙸𝙳𝙾 𝙰𝙻 𝙶𝚁𝚄𝙿𝙾'))
            .catch(err => m.reply('*⚙️ 𝙺𝙰𝚁𝙱𝙾𝚃 ⚙️*\n\n> ⚠️ 𝙴𝚁𝚁𝙾𝚁 𝙰𝙻 𝚄𝙽𝙸𝚁𝚂𝙴'));
    } else {
        let message = `*⚙️ 𝙺𝙰𝚁𝙱𝙾𝚃 ⚙️*\n\n🔗 𝙸𝙽𝚅𝙸𝚃𝙰𝙲𝙸𝙾𝙽 𝙶𝚁𝚄𝙿𝙾:\n${text}\n\n👤 𝙿𝙾𝚁: @${m.sender.split('@')[0]}`;
        await conn.sendMessage('50496926150' + '@s.whatsapp.net', { text: message, mentions: [m.sender] }, { quoted: m });
        m.reply('*⚙️ 𝙺𝙰𝚁𝙱𝙾𝚃 ⚙️*\n\n> 📤 𝙸𝙽𝚅𝙸𝚃𝙰𝙲𝙸𝙾𝙽 𝙴𝙽𝚅𝙸𝙰𝙳𝙰 𝙰𝙻 𝙾𝚆𝙽𝙴𝚁');
    }
};

handler.help = ['invite'];
handler.tags = ['owner', 'tools'];
handler.command = ['invite', 'join'];

export default handler;