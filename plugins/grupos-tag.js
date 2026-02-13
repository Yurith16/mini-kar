import { generateWAMessageFromContent } from "@whiskeysockets/baileys";

const handler = async (m, { conn, text, participants, isOwner, isAdmin }) => {
  if (!m.isGroup) {
    await conn.sendMessage(m.chat, { react: { text: "❌", key: m.key } });
    return conn.reply(
      m.chat,
      "❌ *𝚂𝙾𝙻𝙾 𝙶𝚁𝚄𝙿𝙾𝚂*\n\n▸ 𝙴𝚜𝚝𝚎 𝚌𝚘𝚖𝚊𝚗𝚍𝚘 𝚜𝚘𝚕𝚘 𝚏𝚞𝚗𝚌𝚒𝚘𝚗𝚊 𝚎𝚗 𝚐𝚛𝚞𝚙𝚘𝚜",
      m
    );
  }

  if (!isAdmin && !isOwner) {
    await conn.sendMessage(m.chat, { react: { text: "🚫", key: m.key } });
    return conn.reply(
      m.chat,
      "🚫 *𝙽𝙾 𝙴𝚁𝙴𝚂 𝙰𝙳𝙼𝙸𝙽*\n\n▸ 𝚂𝚘𝚕𝚘 𝚕𝚘𝚜 𝚊𝚍𝚖𝚒𝚗𝚜 𝚙𝚞𝚎𝚍𝚎𝚗 𝚞𝚜𝚊𝚛 𝚎𝚜𝚝𝚎 𝚌𝚘𝚖𝚊𝚗𝚍𝚘",
      m
    );
  }

  await conn.sendMessage(m.chat, { react: { text: "⚙️", key: m.key } });

  try {
    const users = participants.map((u) => conn.decodeJid(u.id));
    const q = m.quoted ? m.quoted : m || m.text || m.sender;
    const c = m.quoted ? await m.getQuotedObj() : m.msg || m.text || m.sender;
    const msg = conn.cMod(
      m.chat,
      generateWAMessageFromContent(
        m.chat,
        {
          [m.quoted ? q.mtype : "extendedTextMessage"]: m.quoted
            ? c.message[q.mtype]
            : { text: "" || c },
        },
        { quoted: m, userJid: conn.user.id }
      ),
      text || q.text,
      conn.user.jid,
      { mentions: users }
    );
    await conn.relayMessage(m.chat, msg.message, { messageId: msg.key.id });

    await conn.sendMessage(m.chat, { react: { text: "✅", key: m.key } });
  } catch {
    const users = participants.map((u) => conn.decodeJid(u.id));
    const quoted = m.quoted ? m.quoted : m;
    const mime = (quoted.msg || quoted).mimetype || "";
    const isMedia = /image|video|sticker|audio/.test(mime);
    const more = String.fromCharCode(8206);
    const masss = more.repeat(850);
    const htextos = `${text ? text : "Ingrese un texto para mención."}`;

    if (isMedia && quoted.mtype === "imageMessage" && htextos) {
      var mediax = await quoted.download?.();
      conn.sendMessage(
        m.chat,
        { image: mediax, mentions: users, caption: htextos },
        { quoted: m }
      );
    } else if (isMedia && quoted.mtype === "videoMessage" && htextos) {
      var mediax = await quoted.download?.();
      conn.sendMessage(
        m.chat,
        {
          video: mediax,
          mentions: users,
          mimetype: "video/mp4",
          caption: htextos,
        },
        { quoted: m }
      );
    } else if (isMedia && quoted.mtype === "audioMessage" && htextos) {
      var mediax = await quoted.download?.();
      conn.sendMessage(
        m.chat,
        {
          audio: mediax,
          mentions: users,
          mimetype: "audio/mpeg",
          fileName: `TagAudio.mp3`,
        },
        { quoted: m }
      );
    } else if (isMedia && quoted.mtype === "stickerMessage" && htextos) {
      var mediax = await quoted.download?.();
      conn.sendMessage(
        m.chat,
        { sticker: mediax, mentions: users },
        { quoted: m }
      );
    } else {
      await conn.relayMessage(
        m.chat,
        {
          extendedTextMessage: {
            text: `${masss}\n${htextos}\n`,
            contextInfo: { mentionedJid: users },
          },
        },
        {}
      );
    }

    await conn.sendMessage(m.chat, { react: { text: "✅", key: m.key } });
  }
};

handler.help = ["tag <texto>"];
handler.tags = ['group'];
handler.command = ["tag"];
handler.group = true;
handler.admin = true;

export default handler;