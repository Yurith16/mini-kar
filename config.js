import { watchFile, unwatchFile } from "fs";
import chalk from "chalk";
import { fileURLToPath, pathToFileURL } from "url";
import fs from "fs";
import * as cheerio from "cheerio";
import fetch from "node-fetch";
import axios from "axios";
import moment from "moment-timezone";
import { dirname } from "path";

global.__dirname = (url) => dirname(fileURLToPath(url));

//aquí los retirados👑🥀
global.retirado = [["50496926150", "𝙷𝙴𝚁𝙽𝙰𝙽𝙳𝙴𝚉", true]];

/*habrán comandos especiales para los retirados algo q los identifique | nota ustedes pondrán los coamndos y q solo funcione para los retirados*/

// Configuraciones principales
global.roowner = ["50496926150"];
global.owner = [["50496926150", "𝙷𝙴𝚁𝙽𝙰𝙽𝙳𝙴𝚉", true],
  ['51913347603', 'Kar', true]];

global.mods = ["50496926150"];
global.suittag = ["50496926150"];
global.prems = ["50496926150"];

// Información del bot
global.libreria = "Baileys";
global.baileys = "V 6.7.9";
global.languaje = "Español";
global.vs = "7.5.2";
global.vsJB = "5.0";
global.nameqr = "𝙺𝙰𝚁𝙱𝙾𝚃𝚀𝚁";
global.namebot = "𝙺𝙰𝚁𝙱𝙾𝚃";
global.sessions = "Sessions/Principal";
global.jadi = "Sessions/SubBot";
global.ItsukiJadibts = false;
global.Choso = false;
global.prefix = "/";
global.apikey = "𝙺𝙰𝚁𝙱𝙾𝚃𝙸𝙰"; // ¡CORREGIDO!
global.botNumber = '50498729368'// Números y settings globales para varios códigos
global.packname = "⚙️  𝙺𝙰𝚁𝙱𝙾𝚃 ⚙️";
global.botname = "⚙️  𝙺𝙰𝚁𝙱𝙾𝚃 ⚙️";
global.wm = "© 𝙷𝙴𝚁𝙽𝙰𝙽𝙳𝙴𝚉";
global.wm3 = "⚙️  𝙺𝙰𝚁𝙱𝙾𝚃 ⚙️";
global.author = "👑 𝙼𝙰𝙳𝙴 𝙱𝚈 𝙷𝙴𝚁𝙽𝙰𝙽𝙳𝙴𝚉 🧃";
global.dev = "© 𝙾𝚆𝙽𝙴𝚁-𝙷𝙴𝚁𝙽𝙰𝙽𝙳𝙴𝚉 𝙳𝙴𝚅 👑";
global.textbot = "𝙺𝙰𝚁𝙱𝙾𝚃-𝙸𝙰";
global.etiqueta = "@𝙷𝙴𝚁𝙽𝙰𝙽𝙳𝙴𝚉";
global.gt = "𝙺𝙰𝚁𝙱𝙾𝚃";
global.me = "⚙️  𝙺𝙰𝚁𝙱𝙾𝚃 𝙸𝙰 ⚙️";
global.listo = "*𝙰𝚚𝚞𝚒 𝚝𝚒𝚎𝚗𝚎*";
global.moneda = "𝙺𝚛𝚢𝚘𝚗𝚜";
global.multiplier = 69;
global.maxwarn = 3;
global.cheerio = cheerio;
global.fs = fs;
global.fetch = fetch;
global.axios = axios;
global.moment = moment;

// Enlaces oficiales del bot - ELIMINADOS COMO SOLICITASTE
global.gp1 = "";
global.comunidad1 = "";
global.channel = "";
global.channel2 = "";
global.md = "";
global.correo = "";

// Apis para las descargas y más
global.APIs = {
  ryzen: "https://api.ryzendesu.vip",
  xteam: "https://api.xteam.xyz",
  lol: "https://api.lolhuman.xyz",
  delirius: "https://delirius-apiofc.vercel.app",
  siputzx: "https://api.siputzx.my.id", // usado como fallback para sugerencias IA
  mayapi: "https://mayapi.ooguy.com",
};

global.APIKeys = {
  "https://api.xteam.xyz": "YOUR_XTEAM_KEY",
  "https://api.lolhuman.xyz": "API_KEY",
  "https://api.betabotz.eu.org": "API_KEY",
  "https://mayapi.ooguy.com": "may-f53d1d49",
};

// Endpoints de IA
global.SIPUTZX_AI = {
  base: global.APIs?.siputzx || "https://api.siputzx.my.id",
  bardPath: "/api/ai/bard",
  queryParam: "query",
  headers: { accept: "*/*" },
};

global.chatDefaults = {
  isBanned: false,
  sAutoresponder: "",
  welcome: true,
  autolevelup: false,
  autoAceptar: false,
  autosticker: false,
  autoRechazar: false,
  autoresponder: false,
  detect: true,
  antiBot: false,
  antiBot2: false,
  modoadmin: false,
  antiLink: true,
  antiImg: false,
  reaction: false,
  nsfw: false,
  antifake: false,
  delete: false,
  expired: 0,
  antiLag: false,
  per: [],
  antitoxic: false,
};

let file = fileURLToPath(import.meta.url);
watchFile(file, () => {
  unwatchFile(file);
  console.log(chalk.redBright("𝚄𝚙𝚍𝚊𝚝𝚎 '𝚌𝚘𝚗𝚏𝚒𝚐.𝚓𝚜'"));
  try {
    import(pathToFileURL(file).href + `?update=${Date.now()}`);
  } catch {}
});

// Configuraciones finales
export default {
  prefix: global.prefix,
  owner: global.owner,
  sessionDirName: global.sessions,
  sessionName: global.sessions,
  botNumber: global.botNumber,
  chatDefaults: global.chatDefaults,
};
