import { saveDatabase } from '../lib/db.js'
import { checkReg } from '../lib/checkReg.js'

let words = [
    "estrella", "diamante", "corazon", "tecnologia", "esencia", "elegancia", 
    "karbot", "amistad", "fortuna", "brillante", "universo", "fantasia", 
    "pelicula", "aventura", "misterio", "romance", "silencio", "destino",
    "galaxia", "infinito", "prestigio", "victoria", "realeza", "magia"
]

let handler = async (m, { conn, text, usedPrefix, command }) => {
    conn.ahorcado = conn.ahorcado ? conn.ahorcado : {}
    let id = m.sender 
    let user = global.db.data.users[m.sender]

    if (await checkReg(m, user)) return

    if (command === 'rendirse' || text === 'rendirse') {
        if (!conn.ahorcado[id]) return m.reply("> 🎀 *Cariño:* No tienes ningún juego activo.")
        delete conn.ahorcado[id]
        user.coin = Math.max(0, (user.coin || 0) - 1000) // Penalización mayor
        user.racha = 0
        await m.react('🥀')
        return m.reply(`> 🥀 *DERROTA*\n\nTe has rendido ante la presión. Perdiste *1,000 Coins* y tu racha de fueguito.`)
    }

    if (conn.ahorcado[id]) return m.reply(`> 🎀 *Aviso:* Ya tienes un juego en curso. Responde o usa \`${usedPrefix}rendirse\`.`)

    let word = words[Math.floor(Math.random() * words.length)].toLowerCase()
    conn.ahorcado[id] = {
        word,
        letters: [],
        tries: 6,
        hint: false
    }

    await m.react('🪢')
    let display = word.replace(/./g, '_ ')
    let txt = `✨ *JUEGO DEL AHORCADO* ✨\n\n`
    txt += `> *Palabra:* \`${display}\`\n`
    txt += `> *Intentos:* 6 🤍\n\n`
    txt += `_Envía una letra. Escribe *pista* para ayuda o *${usedPrefix}rendirse* para salir._`

    await m.reply(txt)
}

handler.before = async (m, { conn }) => {
    conn.ahorcado = conn.ahorcado ? conn.ahorcado : {}
    let id = m.sender
    if (!conn.ahorcado[id] || m.isBaileys || !m.text) return false

    let game = conn.ahorcado[id]
    let user = global.db.data.users[m.sender]
    let input = m.text.trim().toLowerCase()

    if (input === 'pista') {
        if (game.hint) return m.reply("> ⚠️ Ya gastaste tu pista.")
        game.hint = true
        let filtered = game.word.split('').filter(l => !game.letters.includes(l))
        let randomLetter = filtered[Math.floor(Math.random() * filtered.length)]
        await m.react('💡')
        return m.reply(`> 💡 *PISTA:* Intenta con la letra: \`${randomLetter.toUpperCase()}\``)
    }

    // Validación de entrada
    if (input.length > 1 && input !== game.word) return false 
    if (game.letters.includes(input)) return m.reply(`> ⚠️ Ya intentaste con la *${input.toUpperCase()}*.`)

    game.letters.push(input)

    // LÓGICA DE ACIERTO
    if (game.word.includes(input) || input === game.word) {
        let isWin = input === game.word || game.word.split('').every(l => game.letters.includes(l))
        
        if (isWin) {
            // RECOMPENSAS MEJORADAS 📈
            let rewardCoin = Math.floor(Math.random() * (2500 - 1500 + 1)) + 1500
            let rewardDmd = Math.random() > 0.7 ? 2 : 1 // Mínimo 1 diamante siempre
            user.coin = (user.coin || 0) + rewardCoin
            user.diamond = (user.diamond || 0) + rewardDmd
            user.racha = (user.racha || 0) + 1

            let bonus = ""
            if (user.racha % 5 === 0) {
                user.hotpass = (user.hotpass || 0) + 2
                user.diamond += 3
                bonus = `\n🔥 *SUPER RACHA:* +3 💎 y +2 🎫 HotPass`
            }

            await m.react('🎉')
            let winTxt = `🎉 *¡BRILLANTE, LO LOGRASTE!*\n\n`
            winTxt += `> *Palabra:* ${game.word.toUpperCase()}\n`
            winTxt += `> *Ganancia:* ${rewardCoin.toLocaleString()} 🪙 y ${rewardDmd} 💎\n`
            winTxt += `> *Racha:* ${user.racha} 🔥${bonus}`
            
            await m.reply(winTxt)
            delete conn.ahorcado[id]
            await saveDatabase()
        } else {
            await m.react('✅')
            let display = game.word.split('').map(l => game.letters.includes(l) ? l : '_').join(' ')
            return m.reply(`> ✅ *¡Acierto!*\n\n> *Palabra:* \`${display.toUpperCase()}\`\n> *Vidas:* ${game.tries} 🤍`)
        }
    } else {
        // LÓGICA DE FALLO (Ahora descuenta vida siempre)
        game.tries -= 1
        
        if (game.tries <= 0) {
            user.racha = 0
            await m.react('💀')
            let lose = `💀 *¡AHORCADO!* 💀\n\n`
            lose += `> La palabra era: *${game.word.toUpperCase()}*\n`
            lose += `> Tu racha de fueguito se apagó.`
            await m.reply(lose)
            delete conn.ahorcado[id]
        } else {
            await m.react('❌')
            let display = game.word.split('').map(l => game.letters.includes(l) ? l : '_').join(' ')
            return m.reply(`> ❌ *Fallo.* Pierdes una vida.\n\n> *Palabra:* \`${display.toUpperCase()}\`\n> *Te quedan:* ${game.tries} 🤍`)
        }
    }
    return true
}

handler.help = ['ahorcado']
handler.tags = ['game']
handler.command = /^(ahorcado|hang|rendirse)$/i

export default handler