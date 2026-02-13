// Handler simple que llama a hcdecryptor
let simpleHandler = async (m, { conn }) => {
  if (!m.quoted?.document) return m.reply('Responde a .hc')
  
  await m.react('🔓')
  
  try {
    // Guardar archivo
    const buf = await m.quoted.download()
    await fsp.writeFile('/tmp/config.hc', buf)
    
    // Ejecutar hcdecryptor
    const { exec } = await import('child_process')
    exec('python3 /root/hcdecryptor/decrypt.py /tmp/config.hc /tmp/output.txt', 
      async (error, stdout, stderr) => {
        if (error) {
          await m.reply('❌ Error con hcdecryptor')
          return
        }
        
        // Leer resultado
        const result = await fsp.readFile('/tmp/output.txt', 'utf-8')
        
        // Enviar
        await conn.sendMessage(m.chat, {
          text: `✅ Decodificado:\n\n${result.substring(0, 1500)}...`
        })
        
        await m.react('✅')
      }
    )
    
  } catch (e) {
    await m.react('❌')
    m.reply(`Error: ${e.message}`)
  }
}

simpleHandler.command = ['hc', 'decrypt']
export default simpleHandler