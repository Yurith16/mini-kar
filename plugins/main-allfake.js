import fs from "fs";
import fetch from "node-fetch";
import axios from "axios";
import moment from "moment-timezone";

var handler = (m) => m;
handler.all = async function (m) {
  // 🛑 ELIMINACIÓN DE DATOS DEL CANAL 🛑
  global.canalIdM = ["120363402246635214@g.us"];
  global.canalNombreM = ["꧁​𓊈🍃𝐊𝐚𝐫𝐛𝐨𝐭 𝐎𝐟𝐢𝐜𝐢𝐚𝐥🍃𓊉꧂"];

  global.channelRD = { id: undefined, name: undefined };

  global.d = new Date(new Date() + 3600000);
  global.locale = "es";
  global.dia = d.toLocaleDateString(locale, { weekday: "long" });
  global.fecha = d.toLocaleDateString("es", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
  });
  global.mes = d.toLocaleDateString("es", { month: "long" });
  global.año = d.toLocaleDateString("es", { year: "numeric" });
  global.tiempo = d.toLocaleString("en-US", {
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: true,
  });

  global.nombre = m.pushName || "𝚄𝚜𝚞𝚊𝚛𝚒𝚘-𝙼𝙳";
  global.packsticker = ``;

  global.iconos = [
    "https://image2url.com/images/1765486012290-7e2d4538-c0d4-487b-9410-9b21ab56387f.jpg",
    "https://image2url.com/images/1765486043596-c617bb6f-828d-4dbb-87e2-ea5c0ddaebed.jpg",
    "https://image2url.com/images/1765486068515-15617e4f-aaba-4dff-b4da-0ba106f75cfd.jpg",
    "https://image2url.com/images/1765486087799-4050fc16-aeff-4200-b499-20a5538148a7.jpg",
  ];
  global.icono =
    global.iconos[Math.floor(Math.random() * global.iconos.length)];

  global.wm = "© 𝙷𝙴𝚁𝙽𝙰𝙽𝙳𝙴𝚉";
  global.wm3 = "⚙️  𝙺𝙰𝚁𝙱𝙾𝚃 ⚙️";
  global.author = "𝙷𝙴𝚁𝙽𝙰𝙽𝙳𝙴𝚉";
  global.dev = "";
  global.textbot = "𝙺𝙰𝚁𝙱𝙾𝚃-𝙸𝙰";
  global.etiqueta = "@𝙷𝙴𝚁𝙽𝙰𝙽𝙳𝙴𝚉";
  global.gt = "𝙺𝙰𝚁𝙱𝙾𝚃";
  global.me = "⚙️ 𝙺𝙰𝚁𝙱𝙾𝚃 ⚙️";

  global.fkontak = {
    key: {
      participants: "0@s.whatsapp.net",
      remoteJid: "status@broadcast",
      fromMe: false,
      id: "Halo",
    },
    message: {
      contactMessage: {
        vcard: `BEGIN:VCARD\nVERSION:3.0\nN:Sy;Bot;;;\nFN:y\nitem1.TEL;waid=${
          m.sender.split("@")[0]
        }:${m.sender.split("@")[0]}\nitem1.X-ABLabel:Ponsel\nEND:VCARD`,
      },
    },
    participant: "0@s.whatsapp.net",
  };

  // 🛑 ELIMINACIÓN DE LA URL/CONTEXTO DE CANAL 🛑
  global.rcanal = {
    contextInfo: {
      isForwarded: false,
      forwardedNewsletterMessageInfo: {
        newsletterJid: "0@s.whatsapp.net",
        serverMessageId: "1",
        newsletterName: "",
      },
      externalAdReply: {
        title: global.botname || "𝙺𝙰𝚁𝙱𝙾𝚃",
        body: global.dev,
        mediaUrl: null,
        description: null,
        previewType: "PHOTO",
        thumbnailUrl: global.icono,
        sourceUrl: "",
        mediaType: 1,
        renderLargerThumbnail: false,
      },
      mentionedJid: null,
    },
  };

  global.listo = "*𝙰𝚚𝚞𝚒 𝚝𝚒𝚎𝚗𝚎*";
  global.moneda = "𝙺𝚛𝚢𝚘𝚗𝚜";
  global.prefix = [".", "!", "/", "#", "%"];
};

export default handler;

function pickRandom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

async function getRandomChannel() {
  return { id: undefined, name: undefined };
}

if (!Array.prototype.getRandom) {
  Array.prototype.getRandom = function () {
    return this[Math.floor(Math.random() * this.length)];
  };
}
