export const commands = {
    menu: async (sock, message, args, config, sender, isGroup) => {
        const chat = message.key.remoteJid;
        
        const menuText = `╭━━❰ *${config.botName}* ❱━━
┃
┃ 📍 *Información*
┃ 👤 Creador: ${config.creatorNumber}
┃ 🤖 Bot: ${config.botNumber}
┃
┃ 📋 *Comandos*
┃ ${config.prefix}menu - Muestra este menú
┃ ${config.prefix}info - Información del bot
┃ ${config.prefix}ping - Estado del bot
┃
╰━━━━━━━━━━━━━━`;

        await sock.sendMessage(chat, { text: menuText });
    },
    
    info: async (sock, message, args, config, sender, isGroup) => {
        const chat = message.key.remoteJid;
        
        const infoText = `🤖 *${config.botName}*
        
📱 *Bot:* ${config.botNumber}
👤 *Creador:* ${config.creatorNumber}
⚡ *Estado:* Activo
🔰 *Prefijo:* ${config.prefix}`;

        await sock.sendMessage(chat, { text: infoText });
    },
    
    ping: async (sock, message, args, config, sender, isGroup) => {
        const chat = message.key.remoteJid;
        const start = Date.now();
        
        await sock.sendMessage(chat, { text: '🏓 Calculando ping...' });
        
        const end = Date.now();
        const ping = end - start;
        
        await sock.sendMessage(chat, { text: `📶 *Ping:* ${ping}ms` });
    }
};