import { saveDatabase } from '../lib/db.js'
import { checkReg } from '../lib/checkReg.js'

let handler = async (m, { conn, text, usedPrefix, command }) => {
    let user = global.db.data.users[m.sender]
    
    if (await checkReg(m, user)) return

    let apuesta = parseInt(text)
    if (isNaN(apuesta) || apuesta < 100) {
        return m.reply(`> 🎀 *Uso correcto:*\n> \`${usedPrefix + command} <cantidad>\`\n\n_Mínimo: 100 Coins._`)
    }

    if (user.coin < apuesta) {
        return m.reply(`> 🥀 *Pobreza:* No tienes suficientes coins, corazón.`)
    }

    if (apuesta > 50000) {
        return m.reply(`> ⚠️ *Límite:* La apuesta máxima es de 50,000 coins.`)
    }

    // Emojis de la suerte
    const emojis = ["🍎", "🍋", "🍇", "🍒", "💎", "🎰"];
    
    // --- SISTEMA DE PROBABILIDAD (30% Win Rate) ---
    let ganar = Math.random() < 0.30 
    
    // Matriz 3x3
    let matrix = [
        [], // Fila 1
        [], // Fila 2
        []  // Fila 3
    ]

    if (ganar) {
        // GANAR: Asegurar al menos una línea ganadora
        let lineaGanadora = Math.floor(Math.random() * 3)
        let emojiGanador = emojis[Math.floor(Math.random() * emojis.length)]
        
        // Llenar la línea ganadora con el mismo emoji
        matrix[lineaGanadora] = [emojiGanador, emojiGanador, emojiGanador]
        
        // Llenar las otras líneas aleatoriamente
        for (let i = 0; i < 3; i++) {
            if (i !== lineaGanadora) {
                matrix[i] = [
                    emojis[Math.floor(Math.random() * emojis.length)],
                    emojis[Math.floor(Math.random() * emojis.length)],
                    emojis[Math.floor(Math.random() * emojis.length)]
                ]
            }
        }
    } else {
        // PERDER: No hay líneas ganadoras
        for (let i = 0; i < 3; i++) {
            let fila = []
            for (let j = 0; j < 3; j++) {
                let emoji
                do {
                    emoji = emojis[Math.floor(Math.random() * emojis.length)]
                } while (fila.includes(emoji))
                fila.push(emoji)
            }
            matrix[i] = fila
        }
    }

    user.coin -= apuesta
    await m.react('🎰')

    // 🎰 DISEÑO SIMPLE Y LIMPIO 🎰
    let spinning = `🎰 *SLOTS* 🎰\n\n`
    
    // Matriz 3x3 simple - solo emojis
    spinning += `   ${matrix[0][0]}  ${matrix[0][1]}  ${matrix[0][2]}\n`
    spinning += `   ${matrix[1][0]}  ${matrix[1][1]}  ${matrix[1][2]}\n`
    spinning += `   ${matrix[2][0]}  ${matrix[2][1]}  ${matrix[2][2]}\n\n`

    // Verificar líneas ganadoras
    let gano = false
    let premio = 0
    let diamantes = 0

    // Revisar filas
    for (let i = 0; i < 3; i++) {
        if (matrix[i][0] === matrix[i][1] && matrix[i][1] === matrix[i][2]) {
            gano = true
            let multiplicador = 0
            if (matrix[i][0] === "💎") multiplicador = 10
            else if (matrix[i][0] === "🎰") multiplicador = 15
            else multiplicador = 5
            premio += apuesta * multiplicador
            if (matrix[i][0] === "💎") diamantes += 5
            if (matrix[i][0] === "🎰") diamantes += 10
        }
    }

    // Revisar columnas
    for (let j = 0; j < 3; j++) {
        if (matrix[0][j] === matrix[1][j] && matrix[1][j] === matrix[2][j]) {
            gano = true
            let multiplicador = 0
            if (matrix[0][j] === "💎") multiplicador = 10
            else if (matrix[0][j] === "🎰") multiplicador = 15
            else multiplicador = 5
            premio += apuesta * multiplicador
            if (matrix[0][j] === "💎") diamantes += 5
            if (matrix[0][j] === "🎰") diamantes += 10
        }
    }

    // Revisar diagonales
    if (matrix[0][0] === matrix[1][1] && matrix[1][1] === matrix[2][2]) {
        gano = true
        let multiplicador = 0
        if (matrix[0][0] === "💎") multiplicador = 10
        else if (matrix[0][0] === "🎰") multiplicador = 15
        else multiplicador = 5
        premio += apuesta * multiplicador
        if (matrix[0][0] === "💎") diamantes += 5
        if (matrix[0][0] === "🎰") diamantes += 10
    }
    
    if (matrix[0][2] === matrix[1][1] && matrix[1][1] === matrix[2][0]) {
        gano = true
        let multiplicador = 0
        if (matrix[0][2] === "💎") multiplicador = 10
        else if (matrix[0][2] === "🎰") multiplicador = 15
        else multiplicador = 5
        premio += apuesta * multiplicador
        if (matrix[0][2] === "💎") diamantes += 5
        if (matrix[0][2] === "🎰") diamantes += 10
    }

    if (gano) {
        user.coin += premio
        user.diamond = (user.diamond || 0) + diamantes
        await m.react('🎉')
        
        spinning += `✨ *¡FELICIDADES, AMOR!* ✨\n`
        spinning += `> 🪙 *Premio:* +${premio.toLocaleString()} Coins\n`
        if (diamantes > 0) spinning += `> 💎 *Bono:* +${diamantes} Diamantes\n`
    } else {
        await m.react('❌')
        spinning += `🥀 *Perdiste...*\n`
        spinning += `> 💔 *-${apuesta.toLocaleString()} Coins*\n`
        spinning += `\n_La próxima será, cielo._`
    }

    await m.reply(spinning)
    await saveDatabase()
}

handler.help = ['slots']
handler.tags = ['game']
handler.command = /^(slots|slot|tragamonedas)$/i
handler.register = true

export default handler