import axios from "axios";
import { checkReg } from '../lib/checkReg.js';

let handler = async (m, { conn, text, usedPrefix, command }) => {
    const userId = m.sender
    const user = global.db.data.users[userId]
    
    // Verificación de registro
    if (await checkReg(m, user)) return
    
    const query = text || (m.quoted && m.quoted.text);

    if (!query) {
        await m.react('🌿')
        return conn.reply(m.chat, 
`> Escribe una pregunta.

> Ejemplo:
> ${usedPrefix}venice ¿Qué es la inteligencia artificial?`, m)
    }

    try {
        // Reacción de procesamiento
        await m.react('🍃')

        const { data } = await axios.request({
            method: "POST",
            url: "https://outerface.venice.ai/api/inference/chat",
            headers: {
                accept: "*/*",
                "content-type": "application/json",
                origin: "https://venice.ai",
                referer: "https://venice.ai/",
                "user-agent": "Mozilla/5.0 (Android 10; Mobile; rv:131.0) Gecko/131.0 Firefox/131.0",
                "x-venice-version": "interface@20250523.214528+393d253",
            },
            data: JSON.stringify({
                requestId: "mifinfinity",
                modelId: "dolphin-3.0-mistral-24b",
                prompt: [{ content: query, role: "user" }],
                systemPrompt: "",
                conversationType: "text",
                temperature: 0.8,
                webEnabled: true,
                topP: 0.9,
                isCharacter: false,
                clientProcessingTime: 15,
            }),
        });

        const chunks = data
            .split("\n")
            .filter((chunk) => chunk.trim() !== "")
            .map((chunk) => JSON.parse(chunk));

        const result = chunks.map((chunk) => chunk.content).join("");

        if (!result) {
            await m.react('❌')
            return conn.reply(m.chat, '> Lo siento, hubo un error.', m)
        }

        // Enviar respuesta con formato > en cada línea
        const lineas = result.split('\n')
        const respuestaFormateada = lineas.map(linea => `> ${linea}`).join('\n')
        
        await conn.reply(m.chat, respuestaFormateada, m)
        
        // El engranaje final de KarBot ⚙️
        await m.react('⚙️')

    } catch (err) {
        console.error("Error Venice:", err.message)
        await m.react('❌')
        await conn.reply(m.chat, '> Lo siento, hubo un error.', m)
    }
};

handler.command = ['venice', 'veniceai']
handler.help = ['venice']
handler.tags = ['ai',"bots"]

export default handler;