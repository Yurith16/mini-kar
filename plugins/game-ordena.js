import { saveDatabase } from '../lib/db.js'

let words = [
    "whatsapp", "karbot", "diamante", "moneda", "estrella", "usuario", "registro", 
    "premium", "sistema", "dinero", "perfil", "esencia", "elegancia", "bot", 
    "comando", "servidor", "juego", "victoria", "derrota", "esmeralda", "teclado",
    "mensaje", "archivo", "codigo", "diseño", "fortuna", "brillante", "lider"
]

let handler = async (m, { conn, text, usedPrefix, command }) => {
    conn.ordenar = conn.ordenar ? conn.ordenar : {}
    let id = m.sender 
    let user = global.db.data.users[m.sender]

    if (command === 'rendirse' || text === 'rendirse') {
        if (!conn.ordenar[id]) return m.reply("> 🎀 *Cariño:* No tienes ningún juego activo.")
        delete conn.ordenar[id]
        
        user.coin = Math.max(0, (user.coin || 0) - 500)
        user.diamond = Math.max(0, (user.diamond || 0) - 1)
        user.racha = 0 
        await m.react('🥀')
        return m.reply(`> 🥀 *COBARDÍA*\n\nTe has rendido. Penalización: *-500 Coins* y *-1 Diamante*. Racha reseteada.`)
    }

    if (conn.ordenar[id]) return m.reply(`> 🎀 *Aviso:* Ya tienes un juego en curso. Responde o usa \`${usedPrefix}rendirse\`.`)

    let word = words[Math.floor(Math.random() * words.length)]
    let scrambled = word.split('').sort(() => 0.5 - Math.random()).join('')
    
    if (scrambled === word) scrambled = word.split('').reverse().join('')

    conn.ordenar[id] = {
        word: word.toLowerCase().trim(),
        scrambled: scrambled.toUpperCase(),
        tries: 3,
        hint: false
    }

    await m.react('🧩')
    let txt = `🧩 *ORDENA LA PALABRA*\n\n`
    txt += `> *Palabra:* \`${conn.ordenar[id].scrambled}\`\n`
    txt += `> *Oportunidades:* 3 🤍\n\n`
    txt += `_Escribe la palabra correcta. Escribe *pista* si la necesitas o *${usedPrefix}rendirse* para salir._`

    await m.reply(txt)
}

handler.before = async (m, { conn }) => {
    conn.ordenar = conn.ordenar ? conn.ordenar : {}
    let id = m.sender
    if (!conn.ordenar[id] || m.isBaileys || !m.text) return false
    
    let game = conn.ordenar[id]
    let user = global.db.data.users[m.sender]
    let input = m.text.trim().toLowerCase()

    if (input === 'pista') {
        if (game.hint) {
            await m.react('⚠️')
            return m.reply("> ⚠️ Ya usaste tu pista.")
        }
        game.hint = true
        await m.react('💡')
        let hint = game.word.charAt(0) + game.word.charAt(1)
        return m.reply(`> 💡 *PISTA:* Comienza con: \`${hint.toUpperCase()}...\``)
    }

    if (input === game.word) {
        let rewardCoin = Math.floor(Math.random() * (1200 - 700 + 1)) + 700 
        let rewardDmd = Math.random() > 0.8 ? 1 : 0 
        
        user.coin = (user.coin || 0) + rewardCoin
        user.diamond = (user.diamond || 0) + rewardDmd
        user.racha = (user.racha || 0) + 1

        let bonusMsg = ""
        if (user.racha % 5 === 0) {
            user.diamond += 1
            user.hotpass = (user.hotpass || 0) + 1
            bonusMsg = `\n🔥 *BONUS:* +1 💎 y +1 🎫`
        }

        await m.react('🎉')
        let win = `✨ *¡LOGRADO, ID: ${m.sender.split('@')[0]}!*\n\n`
        win += `> *Palabra:* ${game.word.toUpperCase()}\n`
        win += `> *Ganancia:* ${rewardCoin.toLocaleString()} 🪙 ${rewardDmd > 0 ? `y ${rewardDmd} 💎` : ''}\n`
        win += `> *Racha:* ${user.racha} 🔥${bonusMsg}`

        await m.reply(win)
        delete conn.ordenar[id]
        await saveDatabase()
    } else {
        if (m.text.startsWith('.') || m.text.startsWith('/') || m.text.startsWith('#')) return false

        game.tries -= 1
        if (game.tries > 0) {
            await m.react('❌')
            return m.reply(`> ❌ *Incorrecto.* Te quedan *${game.tries}* intentos.`)
        } else {
            user.racha = 0
            await m.react('💀')
            let lose = `🥀 *JUEGO TERMINADO*\n\n`
            lose += `> La palabra era: *${game.word.toUpperCase()}*\n`
            lose += `> Tu racha ha vuelto a 0.`
            await m.reply(lose)
            delete conn.ordenar[id]
        }
    }
    return true
}

handler.help = ['ordenar']
handler.tags = ['game']
handler.command = /^(ordenar|word|palabra|rendirse)$/i

export default handler