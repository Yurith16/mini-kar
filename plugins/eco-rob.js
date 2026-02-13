import { checkReg } from '../lib/checkReg.js'

let handler = async (m, { conn, args, usedPrefix, command }) => {
    let user = global.db.data.users[m.sender]
    if (await checkReg(m, user)) return

    // --- COOLDOWN (3 MINUTOS) ---
    let cooldown = 180000 
    let lastRob = user.lastrob || 0
    if (new Date() - lastRob < cooldown) {
        let tiempo = new Date(lastRob + cooldown - new Date())
        return m.reply(`> ⏳ *SISTEMA:* Debes esperar *${tiempo.getMinutes()}m ${tiempo.getSeconds()}s* para una nueva operación.`)
    }

    // --- IDENTIFICACIÓN ---
    let who = m.quoted ? m.quoted.sender : args[0] ? (args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net') : null
    if (!who) return m.reply(`> ⚠️ *AVISO:* Responde a un mensaje o ingresa el ID del usuario.`)
    
    let victim = global.db.data.users[who]
    if (!victim || !victim.registered) return m.reply(`> 🥀 *ERROR:* Objetivo no localizado o no registrado.`)
    if (who === m.sender) return m.reply(`> 🙄 Operación inválida: No puedes robarte a ti mismo.`)

    // --- CARTERA MÍNIMA ---
    if (victim.coin < 500) {
        return m.reply(`> 💨 *AVISO:* La víctima no posee suficientes recursos en cartera.`)
    }

    // --- REACCIÓN DE INICIO (TENSIÓN) ---
    await m.react('🕵️')

    // --- LÓGICA DE ROBO ---
    let exito = Math.random() > 0.6 
    user.lastrob = new Date() * 1

    // Pequeña pausa para simular el robo
    await new Promise(resolve => setTimeout(resolve, 1500))

    if (exito) {
        let robo = Math.floor(Math.random() * (victim.coin * 0.25)) 
        victim.coin -= robo
        user.coin += robo

        await m.react('👥') // Reacción de banda/ladrones
        let txt = `✨ *OPERACIÓN EXITOSA* ✨\n\n`
        txt += `> *Objetivo:* ${victim.registeredName || conn.getName(who)}\n`
        txt += `> *Monto:* ${robo.toLocaleString()} 🪙 Coins\n`
        txt += `> *Estado:* Recursos extraídos con éxito.`
        return m.reply(txt)
        
    } else {
        let multa = 2000
        user.coin = Math.max(0, user.coin - multa)
        
        await m.react('🚔') // Reacción de captura
        let txt = `🚨 *OPERACIÓN FALLIDA* 🚨\n\n`
        txt += `> *Objetivo:* ${victim.registeredName || conn.getName(who)}\n`
        txt += `> *Penalización:* ${multa.toLocaleString()} 🪙 Coins\n`
        txt += `> *Estado:* Fuiste detectado por las autoridades.`
        return m.reply(txt)
    }
}

handler.help = ['rob']
handler.tags = ['economy']
handler.command = /^(rob|robar)$/i
handler.register = true
handler.group = true

export default handler