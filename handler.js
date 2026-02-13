import { readFileSync } from 'fs';
import { join } from 'path';

export async function handler(sock, message, config) {
    try {
        const messageContent = message.message?.conversation || 
                              message.message?.extendedTextMessage?.text || 
                              '';
        
        const sender = message.key.remoteJid;
        const isGroup = sender.endsWith('@g.us');
        const senderNumber = sender.split('@')[0];
        
        // Verificar si es comando
        if (!messageContent.startsWith(config.prefix)) return;
        
        const args = messageContent.slice(1).trim().split(/ +/);
        const command = args.shift().toLowerCase();
        
        // Cargar plugins
        const plugins = await loadPlugins();
        
        // Buscar y ejecutar comando
        if (plugins[command]) {
            await plugins[command](sock, message, args, config, sender, isGroup);
        }
        
    } catch (error) {
        console.error('Error en handler:', error);
    }
}

async function loadPlugins() {
    const plugins = {};
    const pluginFiles = ['menu.js']; // Agregar más plugins aquí
    
    for (const file of pluginFiles) {
        try {
            const plugin = await import(`./plugins/${file}`);
            Object.assign(plugins, plugin.commands);
        } catch (error) {
            console.error(`Error cargando plugin ${file}:`, error);
        }
    }
    
    return plugins;
}