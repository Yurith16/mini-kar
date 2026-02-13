import makeWASocket from '@whiskeysockets/baileys';
import { useMultiFileAuthState, makeInMemoryStore } from '@whiskeysockets/baileys';
import pino from 'pino';
import qrcode from 'qrcode-terminal';
import { handler } from './handler.js';
import { config } from './config.js';

const store = makeInMemoryStore({});

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState(config.sessionName);
    
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        logger: pino({ level: 'silent' }),
        browser: ['Ubuntu', 'Chrome', '20.0.04']
    });

    store.bind(sock.ev);

    // Mostrar QR
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        
        if (qr) {
            console.log(`\n🔰 Escanea este QR para ${config.botName}:`);
            qrcode.generate(qr, { small: true });
        }
        
        if (connection === 'open') {
            console.log('✅ Bot conectado exitosamente!');
            console.log(`📱 Número del bot: ${config.botNumber}`);
            console.log(`👤 Creador: ${config.creatorNumber}`);
        }
        
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== 401;
            console.log('❌ Conexión cerrada, reconectando...');
            if (shouldReconnect) {
                startBot();
            }
        }
    });

    // Guardar credenciales
    sock.ev.on('creds.update', saveCreds);

    // Escuchar mensajes
    sock.ev.on('messages.upsert', async ({ messages }) => {
        const m = messages[0];
        
        if (!m.message || m.key.fromMe) return;
        
        await handler(sock, m, config);
    });

    return sock;
}

console.log(`🚀 Iniciando ${config.botName}...`);
startBot();