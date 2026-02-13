export const COSTOS = {
    descarga: { precio: 0 },          // Archivos estándar (< 150MB)
    descarga_pesada: { precio: 0 },  // Archivos grandes (> 150MB)
    ia: { precio: 80 },
    multimedia: { precio: 0 },
    nsfw: { precio: 0 },
    busqueda: { precio: 0 },
    reels: { precio: 0 },
    multidescarga: { precio: 0 },
    galeria: { precio: 0 }
};

/**
 * Determina el costo real según el peso del archivo
 */
export function obtenerCostoPorPeso(pesoMB) {
    if (pesoMB <= 150) return COSTOS.descarga.precio;
    if (pesoMB > 150 && pesoMB <= 500) return COSTOS.descarga_pesada.precio;
    
    // Para archivos de más de 500MB, cobramos 1500 + un extra por cada 100MB adicionales
    if (pesoMB > 500) {
        const extra = Math.floor((pesoMB - 500) / 100) * 200; 
        return COSTOS.descarga_pesada.precio + extra;
    }
    return COSTOS.descarga.precio;
}

/**
 * Verifica saldo considerando el peso dinámico
 */
export function verificarSaldo(userId, categoria, pesoMB = 0) {
    if (!global.db?.data?.users) return { success: true, costo: 0, saldoActual: 0 };
    
    if (!global.db.data.users[userId]) {
        global.db.data.users[userId] = { coin: 1000, premium: false };
    }
    
    const user = global.db.data.users[userId];
    if (user.premium) return { success: true, costo: 0, premium: true };

    // Si es una descarga y tenemos el peso, calculamos costo dinámico
    let costo = (categoria === 'descarga' && pesoMB > 0) 
        ? obtenerCostoPorPeso(pesoMB) 
        : (COSTOS[categoria]?.precio || 0);

    const saldo = user.coin || 0;

    return saldo >= costo 
        ? { success: true, costo, saldoActual: saldo, premium: false } 
        : { success: false, costo, saldoActual: saldo, premium: false };
}

/**
 * Procesa el pago considerando el peso dinámico
 */
export function procesarPago(userId, categoria, pesoMB = 0) {
    if (!global.db?.data?.users?.[userId]) return { success: true, costo: 0 };
    
    const user = global.db.data.users[userId];
    if (user.premium) return { success: true, costo: 0, saldoNuevo: user.coin, premium: true };

    let costo = (categoria === 'descarga' && pesoMB > 0) 
        ? obtenerCostoPorPeso(pesoMB) 
        : (COSTOS[categoria]?.precio || 0);

    user.coin = (user.coin || 0) - costo;
    
    return { success: true, costo, saldoNuevo: user.coin, premium: false };
}

/**
 * Función principal para usar en los comandos
 */
export const procesarCompleto = async (userId, categoria, pesoMB = 0) => {
    const v = verificarSaldo(userId, categoria, pesoMB);
    
    if (!v.success) {
        return { 
            success: false, 
            mensajeError: `❌ *𝚂𝙰𝙻𝙳𝙾 𝙸𝙽𝚂𝚄𝙵𝙸𝙲𝙸𝙴𝙽𝚃𝙴*\n\n` +
                          `⚖️ *𝙿𝚎𝚜𝚘:* ${pesoMB > 0 ? pesoMB.toFixed(2) + ' MB' : 'Estándar'}\n` +
                          `💰 *𝙲𝚘𝚜𝚝𝚘:* ${v.costo} Coins\n` +
                          `📉 *𝚃𝚒𝚎𝚗𝚎𝚜:* ${v.saldoActual} Coins`,
            ...v 
        };
    }
    return v;
};