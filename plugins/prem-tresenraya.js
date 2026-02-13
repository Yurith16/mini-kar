import { saveDatabase } from '../lib/db.js'
import { checkReg } from '../lib/checkReg.js'

const emojis = {
    X: '❌',
    O: '⭕',
    numbers: ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣']
}

const recompensas = {
    victoria: { coin: 2500, diamond: 3, exp: 800 },
    empate: { coin: 500, exp: 200 }
}

let handler = async (m, { conn, text, usedPrefix, command }) => {
    conn.ttt = conn.ttt ? conn.ttt : {}
    let user = global.db.data.users[m.sender]
    let input = (text || '').trim().toLowerCase()

    if (await checkReg(m, user)) return

    // 1. ACEPTAR DESAFÍO
    if (input === 'aceptar') {
        let room = Object.values(conn.ttt).find(r => r.o === m.sender && r.state === 'WAITING')
        if (!room) return m.reply(`> *Cariño:* No tienes desafíos pendientes por aceptar ahora mismo.`)

        room.state = 'PLAYING'
        room.board = Array(9).fill('')
        room.turn = 'X' 
        clearTimeout(room.timeout)

        return renderBoard(conn, m.chat, room)
    }

    // 2. CREAR DESAFÍO (Ahora para todos)
    if (!input || isNaN(input.replace(/[^0-9]/g, ''))) {
        return m.reply(`✨ *DUELO DE TRES EN RAYA* ✨\n\n> *Menciona o escribe el ID del oponente.*\n> *Ejemplo:* ${usedPrefix + command} 504xxxxxx`)
    }

    let who = m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : input.replace(/[^0-9]/g, '') + '@s.whatsapp.net'
    
    if (!(who in global.db.data.users)) return m.reply(`> *Error:* Ese rival no parece estar en mi lista de contactos.`)
    if (who === m.sender) return m.reply(`> *Cariño:* No puedes jugar contigo mismo. ¿Tan sola te sientes? 🫦`)
    if (conn.ttt[m.chat]) return m.reply(`> *Aviso:* Ya hay un duelo intenso en este chat. ¡Espera tu turno!`)

    conn.ttt[m.chat] = {
        id: m.chat,
        x: m.sender, 
        o: who,      
        state: 'WAITING',
        timeout: setTimeout(() => {
            if (conn.ttt[m.chat]?.state === 'WAITING') {
                delete conn.ttt[m.chat]
                conn.reply(m.chat, `> ⏰ *EL TIEMPO SE AGOTÓ*\n\n@${who.split('@')[0]} no tuvo el valor de aceptar el duelo de @${m.sender.split('@')[0]}. ¡Qué cobardía! 💋`, null, { mentions: [m.sender, who] })
            }
        }, 60000)
    }

    let setupMsg = `⚔️ *DESAFÍO LANZADO* ⚔️\n\n`
    setupMsg += `> *Retador:* @${m.sender.split('@')[0]}\n`
    setupMsg += `> *Oponente:* @${who.split('@')[0]}\n\n`
    setupMsg += `*Para aceptar usa:* \`${usedPrefix + command} aceptar\`\n\n`
    setupMsg += `_¿Habrá amor o solo guerra en este tablero? Tienes 60 segundos._`

    return await conn.sendMessage(m.chat, { text: setupMsg, mentions: [m.sender, who] }, { quoted: m })
}

handler.before = async (m, { conn }) => {
    let id = m.chat
    if (!conn.ttt || !conn.ttt[id] || conn.ttt[id].state !== 'PLAYING') return 
    if (m.text.startsWith('.') || !/^[1-9]$/.test(m.text)) return 

    let room = conn.ttt[id]
    let move = parseInt(m.text.trim())

    let isX = m.sender === room.x
    let isO = m.sender === room.o
    if (!isX && !isO) return 

    if ((room.turn === 'X' && !isX) || (room.turn === 'O' && !isO)) return 

    let index = move - 1
    if (room.board[index] !== '') return m.reply(`> *Cariño:* Esa casilla ya está ocupada. Concéntrate. 🫦`)

    room.board[index] = room.turn
    let win = checkWinner(room.board)
    let tie = room.board.every(c => c !== '')

    if (win) {
        await finishGame(conn, id, room, win === 'X' ? room.x : room.o)
    } else if (tie) {
        await finishGame(conn, id, room, 'tie')
    } else {
        room.turn = room.turn === 'X' ? 'O' : 'X'
        await renderBoard(conn, id, room)
    }
    return true
}

async function renderBoard(conn, jid, room) {
    let boardTxt = room.board.map((v, i) => v === '' ? emojis.numbers[i] : (v === 'X' ? emojis.X : emojis.O))
    let txt = `🕹️ *TRES EN RAYA* 🕹️\n\n`
    txt += `     ${boardTxt[0]} ${boardTxt[1]} ${boardTxt[2]}\n`
    txt += `     ${boardTxt[3]} ${boardTxt[4]} ${boardTxt[5]}\n`
    txt += `     ${boardTxt[6]} ${boardTxt[7]} ${boardTxt[8]}\n\n`
    txt += `> *Turno de:* ${room.turn === 'X' ? '❌' : '⭕'}\n`
    txt += `> @${(room.turn === 'X' ? room.x : room.o).split('@')[0]}`

    return await conn.sendMessage(jid, { text: txt, mentions: [room.x, room.o] })
}

function checkWinner(b) {
    const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]]
    for (let [a, i, c] of lines) {
        if (b[a] && b[a] === b[i] && b[a] === b[c]) return b[a]
    }
    return null
}

async function finishGame(conn, jid, room, res) {
    let { x, o } = room
    delete conn.ttt[jid]
    let finalMsg = `🏁 *FIN DEL DUELO* 🏁\n\n`

    if (res === 'tie') {
        finalMsg += `🤝 *¡HA SIDO UN EMPATE!*\n`
        finalMsg += `Parece que sus mentes están conectadas... ¿O es que no quieren lastimarse? 🫦\n\n`
        finalMsg += `*Recompensa:* +500 Coins para cada uno.`
        updateUser(x, recompensas.empate); updateUser(o, recompensas.empate)
    } else {
        let winner = res
        let loser = winner === x ? o : x
        finalMsg += `🏆 *¡VICTORIA MAGISTRAL!* 🏆\n\n`
        finalMsg += `> *Ganador:* @${winner.split('@')[0]}\n`
        finalMsg += `> *Derrotado:* @${loser.split('@')[0]}\n\n`
        finalMsg += `🎁 *BOTÍN DE GUERRA:*\n`
        finalMsg += `> 🪙 +2,500 Coins | 💎 +3 Diamantes`
        updateUser(winner, recompensas.victoria)
    }

    await conn.sendMessage(jid, { text: finalMsg, mentions: [x, o] })
    await saveDatabase()
}

function updateUser(jid, rec) {
    let u = global.db.data.users[jid]
    if (u) {
        u.coin = (u.coin || 0) + (rec.coin || 0)
        u.diamond = (u.diamond || 0) + (rec.diamond || 0)
        u.exp = (u.exp || 0) + (rec.exp || 0)
    }
}

handler.help = ['ttt']
handler.tags = ['game']
handler.command = /^(ttt|tresenraya|duelo)$/i
handler.group = true

export default handler