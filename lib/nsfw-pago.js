/**
 * SISTEMA DE PAGOS EXCLUSIVO PARA NSFW - KARBOT 🔞
 * Aquí no existen rangos, solo el valor del HotPass.
 */

export const COSTOS_NSFW = {
    normal: { precio: 2, nombre: 'HotPass 🎫' },   
    fuerte: { precio: 5, nombre: '🔥 Pase Erótico' } 
};

const FRASES_HUMANAS = [
    "🔥 Aquí tienes algo para calmar la sed...",
    "🌿 Uff... esto se puso caliente de repente.",
    "🫦 Una dosis de placer directo a tu chat...",
    "🍀 Espero que estés solo viendo esto...",
    "🔥 No me hago responsable si te atrapan mirando."
];

/**
 * Verifica saldo estrictamente (Sin excepciones Premium)
 */
export function verificarSaldoNSFW(userId, modo = 'normal') {
    if (!global.db?.data?.users) return { success: true, costo: 0 };
    const user = global.db.data.users[userId];
    
    if (user.hotpass === undefined) user.hotpass = 5; // Regalo de bienvenida
    
    const costo = COSTOS_NSFW[modo]?.precio || 2;
    const saldo = user.hotpass || 0;

    if (saldo < costo) {
        return {
            success: false,
            mensajeError: `> ⚠️ *𝚂𝙸𝙽 𝙸𝙽𝙶𝚁𝙴𝚂𝙾𝚂*\n> 🎫 *𝙽𝚎𝚌𝚎𝚜𝚒𝚝𝚊𝚜:* ${costo} ${COSTOS_NSFW[modo].nombre}\n> 📉 *𝚃𝚒𝚎𝚗𝚎𝚜:* ${saldo} 🎫\n\n> 🥀 _El contenido exclusivo requiere HotPass. Consigue más en la tienda._`
        };
    }
    return { success: true, costo, saldoActual: saldo };
}

/**
 * Procesa el pago para todos los usuarios por igual
 */
export function procesarPagoNSFW(userId, modo = 'normal') {
    const user = global.db.data.users[userId];
    const costo = COSTOS_NSFW[modo]?.precio || 2;
    
    // El cobro es obligatorio para todos
    user.hotpass = Math.max(0, (user.hotpass || 0) - costo);
    
    const frase = FRASES_HUMANAS[Math.floor(Math.random() * FRASES_HUMANAS.length)];
    
    // Caption centralizado y democrático: todos ven su gasto y saldo
    let texto = `> ${frase}\n\n`;
    texto += `> 🔥 *𝙲𝚘𝚜𝚝𝚘:* ${costo} HotPass\n`;
    texto += `> 🎫 *𝚂𝚊𝚕𝚍𝚘:* ${user.hotpass} disponibles`;

    return { 
        success: true, 
        costo, 
        saldoNuevo: user.hotpass,
        caption: texto 
    };
}