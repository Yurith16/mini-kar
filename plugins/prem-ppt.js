import { saveDatabase } from '../lib/db.js'
import { checkReg } from '../lib/checkReg.js'

const opciones = {
    'piedra': { emoji: '🪨', vence: 'tijera' },
    'papel': { emoji: '📄', vence: 'piedra' },
    'tijera': { emoji: '✂️', vence: 'papel' }
}

const cooldowns = new Map()

let handler = async (m, { conn, text, usedPrefix, command }) => {
    let user = global.db.data.users[m.sender]
    let id = m.sender

    if (await checkReg(m, user)) return

    // --- SISTEMA DE COOLDOWN ---
    let time = cooldowns.get(id) || 0
    if (Date.now() - time < 30000) {
        let wait = Math.ceil((30000 - (Date.now() - time)) / 1000)
        return m.reply(`> ⏳ *DESPACIO:* Ya jugamos hace poco, cielo. Espera **${wait}s** para el siguiente duelo.`)
    }

    let input = text.trim().toLowerCase()

    if (!input || !opciones[input]) {
        return m.reply(`🎮 *DUELO CON KARBOT*\n\n> Elige tu arma: *Piedra, papel o tijera*.\n\n_Ejemplo: \`${usedPrefix + command} piedra\`_`)
    }

    const botMove = Object.keys(opciones)[Math.floor(Math.random() * 3)]
    let res = input === botMove ? 'tie' : (opciones[input].vence === botMove ? 'win' : 'lose')

    // Valores para la recompensa 📈
    let ganCoins = Math.floor(Math.random() * (1200 - 800 + 1)) + 800
    let ganExp = Math.floor(Math.random() * 300) + 200
    let lossExp = Math.floor(Math.random() * 150) + 100

    let txt = `🕹️ *𝗗𝗨𝗘𝗟𝗢 𝗗𝗘 𝗘𝗟𝗘𝗚𝗔𝗡𝗖𝗜𝗔* 🕹️\n\n`
    txt += `> 👤 *Tú:* ${opciones[input].emoji} (${input.toUpperCase()})\n`
    txt += `> 🫦 *KarBot:* ${opciones[botMove].emoji} (${botMove.toUpperCase()})\n\n`

    if (res === 'tie') {
        user.coin = (user.coin || 0) + 200
        txt += `🤝 *¡EMPATE!* \n`
        txt += `Casi me ganas, amor. Toma **200 Coins** por el esfuerzo.`
        await m.react('🤝')
    } else if (res === 'win') {
        user.coin = (user.coin || 0) + ganCoins
        user.exp = (user.exp || 0) + ganExp
        user.diamond = (user.diamond || 0) + 1
        
        txt += `🎉 *¡VAYA, ME HAS VENCIDO!* \n`
        txt += `Me has ganado con astucia. Disfruta tu botín, cielo.\n\n`
        txt += `🎁 *RECOMPENSAS:* \n`
        txt += `> 🪙 +${ganCoins.toLocaleString()} Coins\n`
        txt += `> ✨ +${ganExp} EXP\n`
        txt += `> 💎 +1 Diamante`
        await m.react('✨')
    } else {
        user.exp = Math.max(0, (user.exp || 0) - lossExp)
        txt += `💀 *¡TE HE DERROTADO!* \n`
        txt += `No deberías confiarte tanto frente a mí, corazón. 💋\n\n`
        txt += `📉 *PENALIZACIÓN:* \n`
        txt += `> -${lossExp} EXP`
        await m.react('❌')
    }

    // Activar cooldown y guardar
    cooldowns.set(id, Date.now())
    await m.reply(txt)
    await saveDatabase()
}

handler.help = ['ppt']
handler.tags = ['game']
handler.command = /^(ppt|juego)$/i

export default handler