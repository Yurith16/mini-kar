import fsp from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { execSync } from 'child_process'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT = path.resolve(__dirname, '..')
const TEMP = path.join(ROOT, 'temp')

const ALWAYS_EXCLUDE = new Set(['node_modules', '.git', '.vscode', 'temp', '.npm'])
// Eliminamos database.json de la exclusión para que se respalde
const EXCLUDE_FILES = new Set(['package-lock.json']) 
const SESSION_DIRS = new Set(['sessions', 'sessions-qr', 'botSession'])

function stamp() {
  const d = new Date()
  const p = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`
}

async function copyTree(src, dst, includeSessions) {
  await fsp.mkdir(dst, { recursive: true })
  const entries = await fsp.readdir(src, { withFileTypes: true })
  for (const e of entries) {
    const name = e.name
    if (ALWAYS_EXCLUDE.has(name)) continue
    if (!includeSessions && SESSION_DIRS.has(name)) continue
    const sp = path.join(src, name)
    const dp = path.join(dst, name)
    if (e.isDirectory()) {
      await copyTree(sp, dp, includeSessions)
    } else if (e.isFile()) {
      if (EXCLUDE_FILES.has(name)) continue
      await fsp.mkdir(path.dirname(dp), { recursive: true })
      try { await fsp.copyFile(sp, dp) } catch {}
    }
  }
}

async function zipFolderUnix(sourceDir, zipPath) {
  try {
    execSync(`zip -r "${zipPath}" .`, { cwd: sourceDir, stdio: 'ignore' })
    return zipPath
  } catch {
    const gzPath = zipPath.replace(/\.zip$/i, '.tar.gz')
    execSync(`tar -czf "${gzPath}" .`, { cwd: sourceDir, stdio: 'ignore' })
    return gzPath
  }
}

let handler = async (m, { conn, args, usedPrefix }) => {
  const sanitize = (s = '') => String(s).replace(/\s+/g, '-').replace(/[^a-z0-9._-]/ig, '')
  const baseName = sanitize(global.namebot || 'KARBOT-BACKUP')
  const base = `${baseName}-${stamp()}`
  const exportDir = path.join(TEMP, base)
  const zipPath = path.join(TEMP, `${base}.zip`)

  await m.react('📦')
  await fsp.mkdir(TEMP, { recursive: true }).catch(() => {})

  // Diseño de KARBOT para los estados
  const k_line = "━━━━━━━━━━━━━━━━━━━━━━"
  const k_tag = "『 📦 SISTEMA BACKUP 』"

  try {
    let { key } = await conn.reply(m.chat, `${k_tag}\n${k_line}\n\n⏳ *PROCESANDO:* Copiando archivos del bot...\n\n${k_line}`, m)
    await copyTree(ROOT, exportDir, args.includes('--sessions'))

    await conn.sendMessage(m.chat, { text: `${k_tag}\n${k_line}\n\n🗜️ *COMPRIMIENDO:* Empaquetando respaldo...\n\n${k_line}`, edit: key })
    
    let artifact = await zipFolderUnix(exportDir, zipPath)
    const stat = await fsp.stat(artifact)
    const sizeMB = (stat.size / 1024 / 1024).toFixed(2)

    await conn.sendMessage(m.chat, { text: `${k_tag}\n${k_line}\n\n📤 *ENVIANDO:* Subiendo archivo (${sizeMB} MB)...\n\n${k_line}`, edit: key })
    
    const buffer = await fsp.readFile(artifact)
    const mt = artifact.endsWith('.zip') ? 'application/zip' : 'application/gzip'
    
    await conn.sendMessage(
      m.chat,
      { 
        document: buffer, 
        mimetype: mt, 
        fileName: path.basename(artifact),
        caption: `✅ *BACKUP COMPLETADO*\n\n📅 *Fecha:* ${new Date().toLocaleString()}\n📦 *Archivo:* ${path.basename(artifact)}\n⚖️ *Peso:* ${sizeMB} MB\n\n🛡️ _Respaldo de seguridad de KarBot._`
      },
      { quoted: m }
    )

    await m.react('✅')

  } catch (e) {
    console.error(e)
    await m.react('❌')
    await conn.reply(m.chat, `${k_tag}\n\n❌ *ERROR CRÍTICO*\nNo se pudo completar el backup. Revisa la terminal.`, m)
  } finally {
    try { await fsp.rm(exportDir, { recursive: true, force: true }) } catch {}
    try { await fsp.rm(zipPath, { force: true }) } catch {}
  }
}

handler.help = ['respaldo']
handler.tags = ['owner']
handler.command = ['backup', 'backupbot', 'export', 'respaldo']
handler.rowner = true

export default handler
