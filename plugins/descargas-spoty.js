import fetch from "node-fetch";
import fs from "fs";
import path from "path";
import { checkReg } from '../lib/checkReg.js'

async function searchSong(query) {
  const url = `https://spotdown.org/api/song-details?url=${encodeURIComponent(query)}`;
  const res = await fetch(url, {
    headers: { "Accept": "application/json, text/plain, */*" }
  });
  const data = await res.json();
  if (!data.songs || data.songs.length === 0) throw new Error("No se encontraron canciones");
  return data.songs[0];
}

async function downloadSong(songUrl, outputPath) {
  const res = await fetch("https://spotdown.org/api/download", {
    method: "POST",
    headers: { "Accept": "application/json, text/plain, */*", "Content-Type": "application/json" },
    body: JSON.stringify({ url: songUrl })
  });
  if (!res.ok) throw new Error("Error descargando la canción");

  const fileStream = fs.createWriteStream(outputPath);
  return new Promise((resolve, reject) => {
    res.body.pipe(fileStream);
    res.body.on("error", reject);
    fileStream.on("finish", resolve);
  });
}

let handler = async (m, { conn, args, usedPrefix }) => {
  const userId = m.sender
  const user = global.db.data.users[userId]
  
  // Verificación de registro
  if (await checkReg(m, user)) return
  
  const query = args.join(" ");
  if (!query) return conn.reply(m.chat, '> Debe ingresar el nombre de una canción', m)
  
  try {
    // Reacción inicial
    await m.react('🎵')
    
    const song = await searchSong(query);

    const tmpDir = path.join(".", "tmp");
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

    const outputPath = path.join(tmpDir, `${song.title}.mp3`);

    await downloadSong(song.url, outputPath);

    const audioBuffer = fs.readFileSync(outputPath);

    // Enviar como documento
    await conn.sendMessage(m.chat, {
      document: audioBuffer,
      mimetype: "audio/mpeg",
      fileName: `${song.title}.mp3`,
      caption: '> La descarga fue exitosa'
    }, { quoted: m });
    
    // Limpiar archivo temporal
    fs.unlinkSync(outputPath).catch(() => {})
    
    // El engranaje final de KarBot ⚙️
    await m.react('⚙️')
    
  } catch (err) {
    console.error('❌ Error en spotify:', err)
    await m.react('❌')
    await conn.reply(m.chat, '> Lo siento, hubo un error.', m)
  }
};


handler.help = ['spotify + nombre']    
handler.tags = ['downloader'] 
handler.command = ["spotify", "spoti", "song"];
handler.group = true;

export default handler;