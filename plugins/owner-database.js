import fsp from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { execSync } from 'child_process'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT = path.resolve(__dirname, '..')
const TEMP = path.join(ROOT, 'temp')
const DATABASE_PATH = path.join(ROOT, 'database.json')

function stamp() {
  const d = new Date()
  const p = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`
}

let handler = async (m, { conn, usedPrefix }) => {
  const k_line = "━━━━━━━━━━━━━━━━━━━━━━"
  const k_tag = "『 🗄️ DATABASE SYSTEM 』"
  
  // Verificar si la base de datos existe
  if (!await fsp.access(DATABASE_PATH).then(() => true).catch(() => false)) {
    return conn.reply(m.chat, `${k_tag}\n\n❌ *ERROR:* No se encontró el archivo database.json en la raíz.`, m)
  }

  await m.react('🗄️')
  await fsp.mkdir(TEMP, { recursive: true }).catch(() => {})

  const zipName = `db-${stamp()}.zip`
  const zipPath = path.join(TEMP, zipName)

  try {
    let { key } = await conn.reply(m.chat, `${k_tag}\n${k_line}\n\n⏳ *PROCESANDO:* Preparando base de datos...\n\n${k_line}`, m)

    // Comprimir solo el archivo database.json
    await conn.sendMessage(m.chat, { text: `${k_tag}\n${k_line}\n\n🗜️ *COMPRIMIENDO:* Cifrando información...\n\n${k_line}`, edit: key })
    
    // Comando zip directo (funciona perfecto en UserLAnd/Linux)
    execSync(`zip -j "${zipPath}" "${DATABASE_PATH}"`, { stdio: 'ignore' })

    const stat = await fsp.stat(zipPath)
    const sizeKB = (stat.size / 1024).toFixed(2)

    await conn.sendMessage(m.chat, { text: `${k_tag}\n${k_line}\n\n📤 *ENVIANDO:* Subiendo archivo (${sizeKB} KB)...\n\n${k_line}`, edit: key })
    
    const buffer = await fsp.readFile(zipPath)
    
    await conn.sendMessage(
      m.chat,
      { 
        document: buffer, 
        mimetype: 'application/zip', 
        fileName: zipName,
        caption: `✅ *BASE DE DATOS LISTA*\n\n📅 *Fecha:* ${new Date().toLocaleString()}\n🗂️ *Archivo:* ${zipName}\n⚖️ *Peso:* ${sizeKB} KB\n\n⚠️ _Conserva este archivo en un lugar seguro._`
      },
      { quoted: m }
    )

    await m.react('✅')

  } catch (e) {
    console.error(e)
    await m.react('❌')
    await conn.reply(m.chat, `${k_tag}\n\n❌ *ERROR CRÍTICO*\nNo se pudo procesar la base de datos.`, m)
  } finally {
    // Limpieza de archivos temporales
    try { await fsp.rm(zipPath, { force: true }) } catch {}
  }
}

handler.help = ['database']
handler.tags = ['owner']
handler.command = ['database', 'db', 'dbbot', 'basedatos']
handler.rowner = true

export default handler
