// plugins/facebook2.js
import { gotScraping } from 'got-scraping';
import * as cheerio from 'cheerio';
import { checkReg } from '../lib/checkReg.js';
import fs from 'fs';
import path from 'path';
import axios from 'axios';

const TARGET_URL = 'https://fdownloader.net/es';

// Control de descargas activas por usuario
const activeDownloads = new Map();

let handler = async (m, { conn, text }) => {
    const userId = m.sender;
    const user = global.db.data.users[userId];

    if (await checkReg(m, user)) return;

    if (!text) {
        await m.react('🤔');
        return m.reply(`> ¿Qué video de Facebook desea descargar, corazón?\n> Envíe el enlace con: .fb2 <url>`);
    }

    // Validar URL de Facebook
    if (!text.includes('facebook.com') && !text.includes('fb.watch')) {
        await m.react('❌');
        return m.reply(`> ❌ *Eso no parece un enlace de Facebook válido.*`);
    }

    if (activeDownloads.has(userId)) {
        await m.react('⏳');
        return m.reply(`> ⏳ *Ya estoy procesando una descarga para ti, paciencia.*`);
    }

    const tmpDir = path.join(process.cwd(), 'tmp');
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);
    
    const tempVideo = path.join(tmpDir, `fb2_${Date.now()}.mp4`);

    try {
        activeDownloads.set(userId, true);
        
        // 🔍 REACCIÓN BÚSQUEDA
        await m.react('🔍');
        await conn.sendPresenceUpdate('composing', m.chat);
        await m.reply(`> 🔍 *Obteniendo información del video de Facebook...*`);

        // --- INICIO DEL SCRAPER ---
        // 1. Obtener la página principal y extraer tokens
        const response1 = await gotScraping({
            url: TARGET_URL,
            headerGeneratorOptions: {
                browsers: [{ name: 'chrome', minVersion: 120 }],
                devices: ['desktop'],
                operatingSystems: ['windows']
            }
        });

        // Extraer k_exp y k_token
        const kExp = response1.body.match(/k_exp\s*=\s*["']?(\d+)["']?/)?.[1] || '1770235762';
        const kToken = response1.body.match(/k_token\s*=\s*["']?([a-f0-9]+)["']?/)?.[1] || 'b549f6763739d512060f25e56f57d962121b88403fa64bab897802fa3759ceff';
        
        // Extraer cftoken (token de Cloudflare)
        const cfTokenMatch = response1.body.match(/name="cf_token"\s*value="([^"]+)"/);
        const cfToken = cfTokenMatch ? cfTokenMatch[1] : '';

        // 2. Llamar a la API de descarga
        const response2 = await gotScraping.post('https://v3.fdownloader.net/api/ajaxSearch', {
            headers: {
                'Referer': TARGET_URL,
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'Origin': 'https://fdownloader.net',
                'X-Requested-With': 'XMLHttpRequest',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            form: {
                k_exp: kExp,
                k_token: kToken,
                q: text.trim(),
                lang: 'es',
                web: 'fdownloader.net',
                v: 'v2',
                w: '',
                cftoken: cfToken
            },
            responseType: 'json'
        });

        // 3. Procesar la respuesta
        if (!response2.body || !response2.body.data) {
            throw new Error('No se pudo obtener información del video');
        }

        const $api = cheerio.load(response2.body.data);
        const results = [];
        
        $api('a.download-link-fb').each((i, el) => {
            const quality = $api(el).closest('tr').find('.video-quality').text().trim() || 'Desconocida';
            const url = $api(el).attr('href');
            if (url) {
                results.push({ quality, url });
            }
        });

        if (results.length === 0) {
            throw new Error('No se encontraron enlaces de descarga');
        }

        // --- FIN DEL SCRAPER ---

        // 📥 REACCIÓN DESCARGA
        await m.react('📥');

        // Mostrar todas las calidades disponibles
        let calidadMsg = `> 📥 *Calidades encontradas:*\n`;
        results.forEach((r, i) => {
            calidadMsg += `> ${i+1}. ${r.quality}\n`;
        });
        calidadMsg += `> ⏳ *Descargando la mejor calidad (${results[0].quality})...*`;
        
        await conn.sendMessage(m.chat, { text: calidadMsg }, { quoted: m });

        // Elegir la mejor calidad (Normalmente la primera es HD, segunda SD)
        const downloadUrl = results[0].url;
        const calidad = results[0].quality;

        // Descargar el video SIN LÍMITE DE TAMAÑO
        const response = await axios({
            url: downloadUrl,
            method: 'GET',
            responseType: 'stream',
            timeout: 600000, // 10 minutos
            maxContentLength: Infinity,
            maxBodyLength: Infinity,
            headers: {
                'Referer': 'https://fdownloader.net/',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });
        
        const writer = fs.createWriteStream(tempVideo);
        response.data.pipe(writer);
        
        await new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });

        // ⚙️ REACCIÓN PROCESANDO
        await m.react('⚙️');
        await m.react('📦');
        
        await conn.sendPresenceUpdate('composing', m.chat);
        await new Promise(r => setTimeout(r, 500));
        
        const videoBuffer = fs.readFileSync(tempVideo);
        const fileName = `facebook_video_${Date.now()}.mp4`;
        
        await conn.sendMessage(m.chat, {
            document: videoBuffer,
            mimetype: 'video/mp4',
            fileName: fileName,
            caption: `> ✅ *Video de Facebook descargado*\n> 📊 *Calidad:* ${calidad}\n> 🦊 Kari`
        }, { quoted: m });

        // ✅ REACCIÓN ÉXITO
        await m.react('✅');

    } catch (error) {
        console.error('[Facebook2 Error]:', error.message);
        await m.react('❌');
        
        let errorMsg = '> 🌪️ *Vaya drama...* ';
        if (error.message.includes('No se pudo obtener')) {
            errorMsg += 'No pude obtener información del video. El enlace puede ser privado o inválido.';
        } else if (error.message.includes('No se encontraron enlaces')) {
            errorMsg += 'No se encontraron enlaces de descarga para este video.';
        } else if (error.message.includes('404')) {
            errorMsg += 'El video no está disponible o ha sido eliminado.';
        } else if (error.message.includes('ECONNRESET') || error.message.includes('timeout')) {
            errorMsg += 'La conexión se interrumpió. El video es muy grande o el servidor está lento.';
        } else {
            errorMsg += 'Error al descargar el video de Facebook.';
        }
        
        await m.reply(errorMsg);
    } finally {
        activeDownloads.delete(userId);
        if (fs.existsSync(tempVideo)) fs.unlinkSync(tempVideo);
        await conn.sendPresenceUpdate('paused', m.chat);
    }
};

handler.help = ['fb2 <url>'];
handler.tags = ['downloader'];
handler.command = ['fb2'];
handler.group = true;

export default handler;