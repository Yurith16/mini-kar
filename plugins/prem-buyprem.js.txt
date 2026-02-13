import { premiumStyles } from '../lib/styles.js'

let handler = async (m, { conn, usedPrefix, command, text }) => {
    let user = global.db.data.users[m.sender]

    // Inicialización de variables de usuario
    if (user.kryons === undefined) user.kryons = 0
    if (user.premiumTime === undefined) user.premiumTime = 0
    if (user.premium === undefined) user.premium = false

    // Estilo visual (Solo si es premium según tus reglas de diseño)
    let s = premiumStyles[user.prefStyle] || (user.premium ? premiumStyles["luxury"] : null)
    let plan = (text || '').toLowerCase().trim()

    // --- PRECIOS ACTUALIZADOS (AUMENTADOS) ---
    const planes = {
        '1h': { tiempo: 60 * 60 * 1000, costo: 150, nombre: '1 HORA EXPRESS' },    // Queda igual
        '6h': { tiempo: 6 * 60 * 60 * 1000, costo: 1200, nombre: '6 HORAS BRONCE' }, // Antes 900
        '1d': { tiempo: 24 * 60 * 60 * 1000, costo: 4500, nombre: '1 DÍA PLATA' },    // Antes 3200
        '2d': { tiempo: 48 * 60 * 60 * 1000, costo: 8000, nombre: '2 DÍAS ORO (MAX)' } // Antes 5500
    }

    try {
        if (planes[plan]) {
            let p = planes[plan]

            if (user.kryons < p.costo) {
                let faltante = p.costo - user.kryons
                return await conn.sendMessage(m.chat, { 
                    text: `> ❌ *KRYONS INSUFICIENTES*\n\n> Te faltan **${faltante.toLocaleString()}** Kryons para el plan **${p.nombre}**.\n\n💡 _¡Participa en minijuegos para ganar más!_` 
                }, { quoted: m })
            }

            // Guardar saldo actual por si falla el proceso
            const oldKryons = user.kryons
            user.kryons -= p.costo

            let ahora = Date.now()
            const MAX_TIEMPO = 2 * 24 * 60 * 60 * 1000 

            if (user.premiumTime > ahora) {
                user.premiumTime += p.tiempo
            } else {
                user.premiumTime = ahora + p.tiempo
            }

            // Límite máximo de 48h
            if (user.premiumTime > (ahora + MAX_TIEMPO)) {
                user.premiumTime = ahora + MAX_TIEMPO
            }

            user.premium = true

            let fechaExpiracion = new Date(user.premiumTime).toLocaleString('es-HN', { 
                hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric'
            })

            let win = s ? `${s.top}\n\n` : ''
            win += `💎 *KARBOT ELITE ACTIVADO*\n\n`
            win += `> ✨ *Plan:* ${p.nombre}\n`
            win += `> 💰 *Costo:* ${p.costo.toLocaleString()} Kryons\n`
            win += `> ⏳ *Expira:* ${fechaExpiracion}\n\n`
            win += `_¡Disfruta tus beneficios Premium!_`
            if (s) win += `\n\n${s.footer}`

            return await conn.sendMessage(m.chat, { text: win }, { quoted: m })

        } else {
            // --- MOSTRAR MENÚ DE PRECIOS ---
            let txt = s ? `${s.top}\n\n` : ''
            txt += `🛒 *TIENDA PREMIUM KARBOT*\n`
            txt += `_Adquiere beneficios exclusivos con tus Kryons._\n\n`

            txt += `💠 *TUS KRYONS:* ${user.kryons.toLocaleString()}\n\n`

            txt += `> 🔹 *1h* — 150 Kryons\n`
            txt += `> 🔹 *6h* — 1,200 Kryons\n`
            txt += `> 🔹 *1d* — 4,500 Kryons\n`
            txt += `> 🔹 *2d* — 8,000 Kryons\n\n`

            txt += `💡 *Uso:* \`${usedPrefix + command} 1d\`\n`
            txt += `> _Límite de acumulación: 48 horas._`
            if (s) txt += `\n\n${s.footer}`

            return await conn.sendMessage(m.chat, { text: txt }, { quoted: m })
        }
    } catch (error) {
        console.error(error)
        // REVERTIR KRYONS EN CASO DE ERROR (Instrucción 2026-01-10)
        if (planes[plan] && user.kryons < (global.db.data.users[m.sender].kryons + planes[plan].costo)) {
            user.kryons += planes[plan].costo
        }
        return m.reply("❌ *Error al procesar la compra.* Tus Kryons han sido devueltos.")
    }
}

handler.help = ['buypremium']
handler.tags = ['premium']
handler.command = /^(buypremium|comprarpremium|pago|buyprem)$/i

export default handler