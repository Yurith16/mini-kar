let handler = m => m 

handler.before = async function (m, { conn }) {
    if (m.isBaileys || !m.text) return false
    
    let chat = global.db.data.chats?.[m.chat]
    if (chat && chat.interaccion === false) return false 

    let text = m.text.toLowerCase()
    let name2 = conn.getName(m.sender)
    let who = m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : (m.quoted ? m.quoted.sender : m.sender)
    let name = conn.getName(who)

    // Diccionario de interacciones con sus URLs y lógica
    const dic_interaccion = {
        'enojado|enojada|molesto|molesta|😤': {
            emoji: '😤',
            urls: [
                'https://image2url.com/r2/default/videos/1768346964896-f45affc4-9eb1-469e-956f-4b57781cee13.mp4',
                'https://image2url.com/r2/default/videos/1768347085246-f35eb835-048c-4dea-ab10-4353b8fa4040.mp4',
                'https://image2url.com/r2/default/videos/1768347126940-e6b06ac9-6b95-4548-81f5-19637190d28a.mp4',
                'https://image2url.com/r2/default/videos/1768347159822-3633338c-bb38-448e-8d65-3b0753920fbf.mp4',
                'https://image2url.com/r2/default/videos/1768347190804-3f8eb74f-7b6c-481a-aeb3-06a3d10f47ae.mp4',
                'https://image2url.com/r2/default/videos/1768347229441-d1a62558-8727-4caa-a8c3-6742c7a15e75.mp4',
                'https://image2url.com/r2/default/videos/1768347280859-260c1965-d9d6-4d4b-bf51-4afb49d5c113.mp4',
                'https://image2url.com/r2/default/videos/1768347346868-93757b23-5748-4aa8-a962-d2a983d439ef.mp4'
            ],
            frases: [
                `*${name2}* está perdiendo los estribos... mejor guarden distancia.`,
                `¡Vaya carácter! *${name2}* no está para juegos hoy.`,
                `Esa mirada de *${name2}* lo dice todo, alguien va a pagar los platos rotos.`
            ]
        },
        'morder|mordida|mordisco|😋': {
            emoji: '😋',
            urls: [
                'https://image2url.com/r2/default/videos/1768431707039-6bc7c5f9-34c6-426b-b256-25853e5c0688.mp4',
                'https://image2url.com/r2/default/videos/1768431775949-77f2d206-c7dd-4248-b118-b564f0095b96.mp4',
                'https://image2url.com/r2/default/videos/1768431803295-6dca3478-0035-4633-affc-f2564fcbe853.mp4',
                'https://image2url.com/r2/default/videos/1768431830502-d92a2a2f-320b-41a9-b6b3-589bf4dbb843.mp4',
                'https://image2url.com/r2/default/videos/1768431898724-9527fae7-c266-4236-8ef9-f217df59034f.mp4',
                'https://image2url.com/r2/default/videos/1768431968484-99e1cddd-2762-4285-b893-f40e6db52780.mp4',
                'https://image2url.com/r2/default/videos/1768432003693-9e009651-5406-439d-9d89-48881bbc25c2.mp4',
                'https://image2url.com/r2/default/videos/1768433653993-3a8fa61a-79ec-490b-ace8-bf95df088f3b.mp4',
                'https://image2url.com/r2/default/videos/1768432104357-4faefc23-0970-4f59-88fb-79a289c0c5f8.mp4'
                
            ],
            frases: [
                `*${name2}* dio un mordisco muy atrevido... hay tensión en el aire.`,
                `Un pequeño mordisco de *${name2}* para marcar territorio.`,
                `*${name2}* no pudo resistirse y hincó el diente. ¡Qué intenso!`
            ]
        },
        'rico|ven|cosita|preciosa|lengua|bleh|carita|😜': {
            emoji: '😜',
            urls: [
                'https://image2url.com/r2/default/videos/1768433555340-860141e3-90e6-40c0-9165-2ad270b8a187.mp4', 'https://image2url.com/r2/default/videos/1768433611509-3854fccf-75d1-4ed1-a9b2-f7e96dd0ee5e.mp4',
                'https://image2url.com/r2/default/videos/1768433653993-3a8fa61a-79ec-490b-ace8-bf95df088f3b.mp4', 'https://image2url.com/r2/default/videos/1768433756022-81515290-df14-4d6b-8dd4-604c423049d4.mp4',
                'https://image2url.com/r2/default/videos/1768434039967-bb9a4e0e-6b56-4b2c-afff-00deb729f197.mp4', 'https://image2url.com/r2/default/videos/1768434091137-f7e94174-3ee1-42a6-8677-7c01bbabc5bb.mp4',
                'https://files.catbox.moe/3wozf1.mp4', 'https://files.catbox.moe/zze793.mp4'
            ],
            frases: [
                `*${name2}* está de un humor muy travieso provocando a todos.`,
                `¡Esa lengüita! *${name2}* sabe cómo llamar la atención.`,
                `*${name2}* te está retando con esa carita, ¿vas a hacer algo?`
            ]
        },
        'apenado|pena|sonrojarse|sonrojada|rubor|blush|😊': {
            emoji: '😊',
            urls: [
                'https://image2url.com/r2/default/videos/1768434298836-ab516f1d-7dee-4b7a-870e-7c8c22cdf969.mp4',
                'https://image2url.com/r2/default/videos/1768434414162-4ea754d7-f480-41fd-8a4c-a2abe801349d.mp4',
                'https://image2url.com/r2/default/videos/1768434467044-4ae3f906-bdcc-4495-8189-76b731dcb063.mp4',

                'https://image2url.com/r2/default/videos/1768434333805-28f3c49e-6944-40da-b146-2d8cf45cbd03.mp4'
            ],
            frases: [
                `Miren a *${name2}*, se puso como un tomate. ¡Qué ternura!`,
                `Alguien logró poner nervioso a *${name2}*... ya sabemos quién.`,
                `*${name2}* no puede ocultar lo que siente, ese brillo en su cara lo dice todo.`
            ]
        },
        'aburridos|aburridas|aburrida|aburrido|aburrimiento|😑': {
            emoji: '😑',
            urls: [
                'https://image2url.com/r2/default/videos/1768434603026-7ec29796-f916-4979-8ddc-c097a1907658.mp4', 'https://files.catbox.moe/7z9kxo.mp4',
                'https://image2url.com/r2/default/videos/1768434629416-db85e69e-5503-4f9e-bbee-4cb05faf05e0.mp4', 'https://files.catbox.moe/084jy7.mp4',
                'https://image2url.com/r2/default/videos/1768434665305-ae55e174-26a5-4970-b4a3-4d872f7382ae.mp4', 'https://files.catbox.moe/muaqx4.mp4',
                'https://image2url.com/r2/default/videos/1768434696584-ae757d9e-d151-412b-8963-2f6430d60a42.mp4', 'https://files.catbox.moe/zdrv27.mp4'
            ],
            frases: [
                `*${name2}* está a punto de quedarse dormido de tanto aburrimiento.`,
                `Parece que a *${name2}* no le interesa nada de esto ahora mismo.`,
                `¿Alguien puede entretener a *${name2}*? Se está desesperando.`
            ]
        },
        'aplaudamos|aplaudan|aplausos|aplaudamos|aplaudieron|aplauso|aplaudir|👏': {
            emoji: '👏',
            urls: [
                'https://image2url.com/r2/default/videos/1768434807153-6424d8fc-022a-44d6-8078-252f4513d3f9.mp4', 'https://image2url.com/r2/default/videos/1768434924930-912c01ad-59ef-4d26-9c33-d40ef54a5edc.mp4',
                'https://image2url.com/r2/default/videos/1768434832172-62da2145-3be2-4a6a-a60f-40f84c1759db.mp4', 'https://image2url.com/r2/default/videos/1768434957594-38b7833a-ab20-498c-904f-462b72c857cb.mp4',
                'https://image2url.com/r2/default/videos/1768434862940-c3615288-053a-4ffc-a8a2-b9699edf4bd0.mp4', 'https://image2url.com/r2/default/videos/1768434989098-9b79c14e-d290-44ff-b9e4-43407a2c998b.mp4',
                'https://image2url.com/r2/default/videos/1768434889721-3a33b416-3b74-4255-ae33-96c7b66814fd.mp4', 'https://image2url.com/r2/default/videos/1768435030947-e0b74571-4dc0-47d2-9de7-4c7b96e23629.mp4'
            ],
            frases: [
                `¡Bravo! *${name2}* reconoce el talento cuando lo ve.`,
                `Esos aplausos de *${name2}* son de puro corazón.`,
                `*${name2}* está celebrando este momento con ganas.`
            ]
        },
        'tecito|cafecito|coffe|cafe|café|☕': {
            emoji: '☕',
            urls: [
                'https://image2url.com/r2/default/videos/1768435263885-6c8d97a3-5c42-48a4-bd88-36c9e258b0cd.mp4',
                'https://image2url.com/r2/default/videos/1768435309233-14aec182-1fef-4aa0-a531-b6bd55ba0a70.mp4',
                'https://image2url.com/r2/default/videos/1768435350579-0e460a71-7f85-4665-b9a4-df46b0143b74.mp4',
                'https://image2url.com/r2/default/videos/1768435420194-e62fdf76-7f1d-42f8-af63-1866e4a4d203.mp4'
            ],
            frases: [
                `*${name2}* se está tomando un descanso con un buen café.`,
                `Nada como un cafecito para que *${name2}* recupere energías.`,
                `Acompañen a *${name2}* en su momento de paz con esta taza.`
            ]
        },
        'lloro|lloron|llorando|llorona|lloras|triste|tristeza|debil|llorar|lagrimas|😢': {
            emoji: '😢',
            urls: [
                'https://image2url.com/r2/default/videos/1768435610630-b37192a7-40e2-4a3a-ba27-43646270ac00.mp4',
                'https://image2url.com/r2/default/videos/1768435634963-adfd5bbc-6fb2-4ec0-a636-cb89ac6329b1.mp4',
                'https://image2url.com/r2/default/videos/1768435663113-507f8f0f-cfc4-4a41-97d3-d2b1ece01ee6.mp4',
                'https://image2url.com/r2/default/videos/1768435696496-0aa9079d-ab4e-44e8-8b22-0bb4c64fa372.mp4',
                'https://image2url.com/r2/default/videos/1768435739446-fb7cf0f9-a0e8-4e3e-b423-c2f7af35bf32.mp4'
            ],
            frases: [
                `Mi cielo, *${name2}* está llorando... ¿quién le hizo daño?`,
                `Esas lágrimas de *${name2}* me rompen el alma. ¡Drama total!`,
                `*${name2}* no pudo contener la tristeza esta vez.`
            ]
        },
        'abrazo|abasho|abrasito|abrasame|abrasar|extraño|cariño|apapacho|acurrucarse|cuddle': {
            emoji: '🫂',
            urls: [
                'https://image2url.com/r2/default/videos/1768435954207-d8421730-a790-4769-a7ad-75a5ab1d636a.mp4', 'https://image2url.com/r2/default/videos/1768436292177-7958e981-9247-4a53-b991-16b638e792e6.mp4',
                'https://image2url.com/r2/default/videos/1768435978933-2e7ef8ad-3550-455e-bbcf-165253756bd7.mp4',
                'https://image2url.com/r2/default/videos/1768435978933-2e7ef8ad-3550-455e-bbcf-165253756bd7.mp4',
                'https://image2url.com/r2/default/videos/1768436075964-06529717-1471-4f79-b90d-a5779b89de87.mp4'
            ],
            frases: [
                `*${name2}* solo quiere un poquito de calor humano.`,
                `Miren qué cómodo se siente *${name2}* acurrucado así.`,
                `Un momento lleno de amor para *${name2}*. ¡Qué envidia!`
            ]
        },
        'bailar|dance|💃': {
            emoji: '💃',
            urls: [
                'https://image2url.com/r2/default/videos/1768436249326-8955e189-ef97-4943-84f6-187e54c23c60.mp4',
                'https://image2url.com/r2/default/videos/1768436387922-fdbfbbbe-e417-425a-a6e6-25d3218aa911.mp4'
            ],
            frases: [
                `¡Eso! *${name2}* tiene el ritmo en las venas.`,
                `Nadie baila con tanto estilo como *${name2}*.`,
                `*${name2}* está brillando en la pista ahora mismo.`
            ]
        },
        'feliz|happy|😊': {
            emoji: '😊',
            urls: [
                'https://image2url.com/r2/default/videos/1768436543914-b95c1be5-004e-4649-a518-3d8e1dd72c15.mp4', 'https://image2url.com/r2/default/videos/1768436589195-14f0e376-8c87-4f56-884d-4edf11ec64da.mp4'
            ],
            frases: [
                `¡Miren esa sonrisa! *${name2}* está radiante hoy.`,
                `La felicidad de *${name2}* es contagiosa. ¡Qué alegría!`,
                `Nada puede arruinar el día de *${name2}* ahora mismo.`
            ]
        },
        'que tal|soy nuevo|hola|hello|👋': {
            emoji: '👋',
            urls: [
                'https://image2url.com/r2/default/videos/1768436633449-7e9a569b-4ef9-44da-b125-fd83296363f3.mp4', 'https://image2url.com/r2/default/videos/1768436673949-41b181f5-0d7c-45ba-96a4-2c0915d2a654.mp4',
                'https://image2url.com/r2/default/videos/1768436700612-9beb4e41-0348-43f5-be01-8426be2b2ee7.mp4'
            ],
            frases: [
                `*${name2}* saluda a todos con mucha energía. ¡Hola, bellezas!`,
                `Un saludo especial de *${name2}* para iluminar el grupo.`,
                `*${name2}* acaba de llegar para ponerle orden a esto. ¡Hola!`
            ]
        }
    }

    for (let key in dic_interaccion) {
        let regex = new RegExp(`\\b(${key})\\b`, 'gi')
        
        if (regex.test(text)) {
            try {
                const data = dic_interaccion[key]
                let videoUrl = data.urls[Math.floor(Math.random() * data.urls.length)]
                let caption = data.frases[Math.floor(Math.random() * data.frases.length)]

                await m.react(data.emoji)

                await conn.sendMessage(m.chat, { 
                    video: { url: videoUrl }, 
                    gifPlayback: true, 
                    caption: caption,
                    mentions: [m.sender, who] 
                }, { quoted: m })

                return true 
            } catch (e) {
                console.error(`> ❌ Error en auto-interacción: ${e}`)
            }
        }
    }
    return true
}

export default handler