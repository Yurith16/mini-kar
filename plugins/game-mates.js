import { saveDatabase } from '../lib/db.js'
import { checkReg } from '../lib/checkReg.js'

let handler = async (m, { conn, text, usedPrefix, command }) => {
    conn.math = conn.math ? conn.math : {}
    let id = m.sender 
    let user = global.db.data.users[m.sender]

    if (await checkReg(m, user)) return

    // --- OPCIÓN DE RENDIRSE ---
    if (command === 'rendirse' || text === 'rendirse') {
        if (!conn.math[id]) return m.reply("> *Cariño:* No tienes ningún desafío activo.")
        delete conn.math[id]
        user.coin = Math.max(0, (user.coin || 0) - 1000)
        user.racha = 0
        await m.react('🥀')
        return m.reply(`> 🥀 *DERROTA*\n\nTe has rendido. Perdiste *1,000 Coins* y tu racha de fueguito se apagó.`)
    }

    if (conn.math[id]) return m.reply(`> *Aviso:* Ya tienes un problema activo. Resuelve o usa \`${usedPrefix}rendirse\`.`)

    // --- SELECCIÓN DE DIFICULTAD ---
    let mode = text.toLowerCase().trim()
    if (!['normal', 'dificil', 'extremo'].includes(mode)) {
        return m.reply(`> ✨ *MODO DE JUEGO*\n\nElige una dificultad para empezar:\n> \`${usedPrefix + command} normal\`\n> \`${usedPrefix + command} dificil\`\n> \`${usedPrefix + command} extremo\``)
    }

    let n1, n2, op, time, rewardMult
    let ops = ['+', '-', '*']

    if (mode === 'normal') {
        n1 = Math.floor(Math.random() * 30) + 1
        n2 = Math.floor(Math.random() * 20) + 1
        op = ops[Math.floor(Math.random() * 2)]
        time = 30000 // 30 segundos
        rewardMult = 1
    } else if (mode === 'dificil') {
        n1 = Math.floor(Math.random() * 100) + 10
        n2 = Math.floor(Math.random() * 50) + 5
        op = ops[Math.floor(Math.random() * 3)]
        time = 20000 // 20 segundos
        rewardMult = 2
    } else { // Extremo
        n1 = Math.floor(Math.random() * 500) + 50
        n2 = Math.floor(Math.random() * 100) + 20
        op = ops[Math.floor(Math.random() * 3)]
        time = 12000 // 12 segundos
        rewardMult = 4
    }

    let result = eval(`${n1} ${op === '*' ? '*' : op} ${n2}`)
    
    conn.math[id] = {
        result: result.toString(),
        mode,
        rewardMult,
        time: Date.now() + time,
        timeout: setTimeout(() => {
            if (conn.math[id]) {
                user.racha = 0
                conn.reply(m.chat, `> ⌛ *TIEMPO AGOTADO*\n\nEl resultado era *${result}*. Perdiste tu racha 🔥.`, m)
                delete conn.math[id]
            }
        }, time)
    }

    await m.react('🔢')
    let txt = `🔢 *DESAFÍO ${mode.toUpperCase()}* 🔢\n\n`
    txt += `> *¿Cuánto es:* \`${n1} ${op.replace('*', 'x')} ${n2}\`?\n`
    txt += `> *Tiempo:* ${time / 1000} segundos ⏳\n\n`
    txt += `_¡No hay segundas oportunidades! Responde rápido._`

    await m.reply(txt)
}

handler.before = async (m, { conn }) => {
    conn.math = conn.math ? conn.math : {}
    let id = m.sender
    if (!conn.math[id] || m.isBaileys || !m.text) return false

    let game = conn.math[id]
    let user = global.db.data.users[m.sender]
    let input = m.text.trim()

    if (input === game.result) {
        clearTimeout(game.timeout)
        
        let baseCoin = Math.floor(Math.random() * (1500 - 1000 + 1)) + 1000
        let rewardCoin = baseCoin * game.rewardMult
        let rewardDmd = game.mode === 'extremo' ? 3 : (game.mode === 'dificil' ? 2 : 1)
        
        user.coin = (user.coin || 0) + rewardCoin
        user.diamond = (user.diamond || 0) + rewardDmd
        user.racha = (user.racha || 0) + 1

        let bonus = ""
        if (user.racha % 5 === 0) {
            user.hotpass = (user.hotpass || 0) + 1
            bonus = `\n🔥 *BONUS RACHA:* +1 🎫 HotPass`
        }

        await m.react('🎉')
        let winTxt = `✨ *¡LOGRADO, ID: ${m.sender.split('@')[0]}!* ✨\n\n`
        winTxt += `> *Modo:* ${game.mode.toUpperCase()}\n`
        winTxt += `> *Ganancia:* ${rewardCoin.toLocaleString()} 🪙 y ${rewardDmd} 💎\n`
        winTxt += `> *Racha:* ${user.racha} 🔥${bonus}`
        
        await m.reply(winTxt)
        delete conn.math[id]
        await saveDatabase()
    } else {
        if (m.text.startsWith('.') || m.text.startsWith('/') || m.text.startsWith('#')) return false
        
        // Error inmediato
        clearTimeout(game.timeout)
        user.racha = 0
        await m.react('💀')
        let lose = `💀 *ERROR CRÍTICO* 💀\n\n`
        lose += `> El resultado era: *${game.result}*\n`
        lose += `> Fallaste. Tu racha 🔥 se ha extinguido.`
        await m.reply(lose)
        delete conn.math[id]
    }
    return true
}

handler.help = ['mates']
handler.tags = ['game']
handler.command = /^(mates|math|calc|rendirse)$/i

export default handler