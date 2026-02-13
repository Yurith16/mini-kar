import { watchFile, unwatchFile } from "fs";
import { fileURLToPath, pathToFileURL } from "url";

// Owners (formato: [número, nombre])
global.owner = [
  ["50496926150", "HERNANDEZ"],
  ["51913347603", "Kar"]
];

// Información del bot
global.botname = "𝙺𝙰𝚁𝙱𝙾𝚃";
global.packname = "𝙺𝙰𝚁𝙱𝙾𝚃";
global.author = "HERNANDEZ";
global.prefix = "."; // Prefijo global
global.sessions = "sessions"; // Carpeta de sesión
global.botNumber = "50498729368"; // Número del bot para código

// Precios y economía
global.moneda = "Kryons";
global.multiplier = 69;

export default {
  prefix: global.prefix,
  owner: global.owner,
  botNumber: global.botNumber,
  sessionDir: global.sessions
};