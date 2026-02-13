import { checkReg } from '../lib/checkReg.js'

const HOJITAS = ['🌿', '🍃', '🍀', '🌱', '☘️']
const REACCIONES = ['🗝️', '💀', '🔥', '🛡️', '🕯️', '👺', '🎭', '👁️', '⚰️', '🔮']

// Sistema de escenarios con profundidad
const LOCACIONES = [
  {
    nombre: "cripta sangrienta",
    desc: "una cripta antigua donde las paredes parecen sangrar",
    peligro: "alto",
    tesoro: "alto"
  },
  {
    nombre: "laboratorio alquímico",
    desc: "un lugar abandonado con frascos que contienen seres extraños",
    peligro: "medio",
    tesoro: "medio"
  },
  {
    nombre: "nido de hidra",
    desc: "una caverna húmeda llena de huevos brillantes",
    peligro: "muy alto",
    tesoro: "muy alto"
  },
  {
    nombre: "biblioteca maldita",
    desc: "estantes infinitos con libros que susurran secretos",
    peligro: "bajo",
    tesoro: "medio"
  },
  {
    nombre: "salón de espejos",
    desc: "donde cada reflejo muestra una versión distorsionada de ti",
    peligro: "medio",
    tesoro: "bajo"
  },
  {
    nombre: "templo oscuro",
    desc: "un lugar de culto a una entidad olvidada",
    peligro: "alto",
    tesoro: "alto"
  },
  {
    nombre: "jardín negro",
    desc: "flores que se retuercen y árboles con rostros",
    peligro: "bajo",
    tesoro: "bajo"
  }
]

// Eventos posibles en cada ubicación
const EVENTOS = {
  entrada: [
    "Un olor extraño llena el aire. ¿Qué haces?",
    "Escuchas un ruido a lo lejos. ¿Investigas?",
    "Ves dos caminos divergentes. ¿Cuál tomas?",
    "Encuentras marcas antiguas en el suelo. ¿Las sigues?",
    "Una puerta sellada bloquea el paso. ¿Intentas abrirla?"
  ],
  intermedio: [
    "Una criatura se acerca. ¿Luchas o huyes?",
    "Ves un objeto brillante en un pedestal. ¿Lo tomas?",
    "El piso cede bajo tus pies. ¿Saltas o te agarras?",
    "Oyes una voz que ofrece un trato. ¿Aceptas?",
    "Encuentras un prisionero. ¿Lo liberas?"
  ],
  final: [
    "El guardián del lugar aparece. ¿Negocias o atacas?",
    "El tesoro está protegido por un rompecabezas. ¿Lo resuelves?",
    "Debes elegir entre dos artefactos. ¿Cuál tomas?",
    "Una trampa final se activa. ¿Cómo escapas?",
    "La salida se cierra. ¿Encuentras otra salida?"
  ]
}

// Resultados posibles con diferentes niveles de éxito/fracaso
const RESULTADOS = {
  exitoGrande: [
    "¡Encuentras un tesoro legendario!",
    "Derrotas al guardián y tomas su botín",
    "Resuelves el antiguo mecanismo y obtienes recompensa",
    "El espíritu del lugar te bendice con riquezas"
  ],
  exito: [
    "Encuentas una bolsa de monedas olvidadas",
    "La criatura huye dejando algo valioso",
    "Superas el obstáculo y avanzas",
    "Obtienes información valiosa"
  ],
  neutral: [
    "Logras escapar sin ganar ni perder",
    "El camino se cierra, debes retroceder",
    "Nada importante ocurre",
    "Te mantienes a salvo"
  ],
  fracaso: [
    "Una trampa te hiere levemente",
    "Pierdes algunas provisiones",
    "La criatura te roba algo",
    "Te equivocas de camino"
  ],
  fracasoGrande: [
    "¡Caes en una trampa mortal!",
    "El guardián te deja al borde de la muerte",
    "Pierdes equipo valioso",
    "Una maldición se apega a ti"
  ]
}

function getLeaf() { return HOJITAS[Math.floor(Math.random() * HOJITAS.length)] }
function getRandom(arr) { return arr[Math.floor(Math.random() * arr.length)] }

let handler = async (m, { conn, usedPrefix, command }) => {
  conn.dungeon = conn.dungeon ? conn.dungeon : {}
  let id = m.sender
  let user = global.db.data.users[m.sender]

  if (await checkReg(m, user)) return

  // Cooldown de 5 minutos
  let cooldown = 300000
  let time = (user.lastdungeon || 0) + cooldown
  if (new Date() - (user.lastdungeon || 0) < cooldown) {
    await m.react('⏳')
    return m.reply(`> ⏳ Aún no recuperas el aliento, cielo. Vuelve en: *${msToTime(time - new Date())}*`)
  }

  if (conn.dungeon[id]) {
    return m.reply(`> 🎀 *Aviso:* Ya estás en una mazmorra. Responde con *1*, *2* o *3* según las opciones.`)
  }

  // Generar mazmorra única
  let locacion = getRandom(LOCACIONES)
  let etapa = "entrada"
  let decisionesTomadas = 0
  let puntajeSuerte = Math.random() * 100
  
  // Crear historia única basada en la locación
  let historiaBase = `${getLeaf()} *MAZMORRA: ${locacion.nombre.toUpperCase()}*\n\n`
  historiaBase += `> ${locacion.desc}. El aire es pesado y cada sombra parece moverse. 🕯️\n\n`
  
  // Generar primer evento
  let evento = getRandom(EVENTOS[etapa])
  let opciones = generarOpciones(etapa, locacion.peligro)
  
  conn.dungeon[id] = {
    locacion: locacion,
    etapa: etapa,
    decisiones: [],
    puntajeSuerte: puntajeSuerte,
    historia: historiaBase,
    eventoActual: evento,
    opcionesActuales: opciones,
    tesoroAcumulado: 0,
    danoAcumulado: 0,
    tiempoInicio: Date.now()
  }

  await m.react('🕯️')
  
  let mensaje = historiaBase
  mensaje += `> *${evento}*\n\n`
  mensaje += opciones.map((op, i) => `> ${i+1}️⃣ ${op.texto}`).join('\n')
  mensaje += `\n\n> 🫦 *Responde 1, 2 o 3*`
  
  await m.reply(mensaje)
}

handler.before = async (m, { conn }) => {
  conn.dungeon = conn.dungeon ? conn.dungeon : {}
  let id = m.sender
  if (!conn.dungeon[id] || m.isBaileys || !m.text) return false

  let user = global.db.data.users[m.sender]
  let choice = m.text.trim()
  let dungeon = conn.dungeon[id]
  
  // Validar elección
  if (!['1', '2', '3'].includes(choice)) return false
  
  let opcionIndex = parseInt(choice) - 1
  if (!dungeon.opcionesActuales[opcionIndex]) return false
  
  await m.react('⚙️')
  
  // Procesar decisión
  let opcion = dungeon.opcionesActuales[opcionIndex]
  dungeon.decisiones.push(opcion)
  
  // Calcular resultado
  let resultado = calcularResultado(opcion, dungeon.puntajeSuerte, dungeon.locacion.peligro)
  let recompensa = calcularRecompensa(resultado, dungeon.locacion.tesoro)
  
  // Aplicar efectos al usuario
  user.coin = Math.max(0, (user.coin || 0) + recompensa.coins)
  user.diamond = Math.max(0, (user.diamond || 0) + recompensa.diamonds)
  dungeon.tesoroAcumulado += recompensa.coins
  dungeon.danoAcumulado += recompensa.dano
  
  // Construir mensaje de resultado
  let mensajeResultado = `${getLeaf()} *DECISIÓN: ${dungeon.etapa.toUpperCase()}*\n\n`
  mensajeResultado += `> ${opcion.texto}\n\n`
  mensajeResultado += `> *Resultado:* ${resultado.descripcion}\n`
  
  if (recompensa.coins !== 0) {
    mensajeResultado += `> ${recompensa.coins > 0 ? '✨ Ganaste' : '💀 Perdiste'}: *${Math.abs(recompensa.coins).toLocaleString()} Coins*\n`
  }
  if (recompensa.diamonds !== 0) {
    mensajeResultado += `> 💎 Diamonds: *${recompensa.diamonds > 0 ? '+' : ''}${recompensa.diamonds}*\n`
  }
  if (recompensa.dano !== 0) {
    mensajeResultado += `> 🩸 Daño recibido: *${recompensa.dano}*\n`
  }
  
  // Avanzar etapa o finalizar
  if (dungeon.etapa === "entrada") {
    dungeon.etapa = "intermedio"
  } else if (dungeon.etapa === "intermedio") {
    dungeon.etapa = "final"
  } else {
    // FINALIZAR MAZMORRA
    user.lastdungeon = new Date() * 1
    
    let mensajeFinal = `${getLeaf()} *FIN DE LA EXPEDICIÓN*\n\n`
    mensajeFinal += `> Has sobrevivido a *${dungeon.locacion.nombre}*\n`
    mensajeFinal += `> Decisiones tomadas: *${dungeon.decisiones.length}*\n`
    mensajeFinal += `> Tesoro total: *+${dungeon.tesoroAcumulado.toLocaleString()} Coins*\n`
    mensajeFinal += `> Daño total: *${dungeon.danoAcumulado}*\n\n`
    
    // Recompensa por completar
    let bonusCompletar = Math.floor(dungeon.tesoroAcumulado * 0.3)
    user.coin += bonusCompletar
    mensajeFinal += `> 🎁 *Bonus de supervivencia:* +${bonusCompletar.toLocaleString()} Coins\n\n`
    
    if (dungeon.danoAcumulado > 50) {
      mensajeFinal += `> 💀 Estás gravemente herido. Descansa, soldado.\n`
    } else if (dungeon.tesoroAcumulado > 5000) {
      mensajeFinal += `> 👑 ¡Leyenda viviente! La mazmorra tembló ante ti.\n`
    } else {
      mensajeFinal += `> 🫦 Sobrevivir es un arte, y tú eres un artista.\n`
    }
    
    await m.reply(mensajeResultado + '\n' + mensajeFinal)
    delete conn.dungeon[id]
    return true
  }
  
  // Generar nuevo evento para la siguiente etapa
  let nuevoEvento = getRandom(EVENTOS[dungeon.etapa])
  let nuevasOpciones = generarOpciones(dungeon.etapa, dungeon.locacion.peligro)
  
  dungeon.eventoActual = nuevoEvento
  dungeon.opcionesActuales = nuevasOpciones
  
  mensajeResultado += `\n> *Continuas avanzando...*\n\n`
  mensajeResultado += `> *${nuevoEvento}*\n\n`
  mensajeResultado += nuevasOpciones.map((op, i) => `> ${i+1}️⃣ ${op.texto}`).join('\n')
  mensajeResultado += `\n\n> 🫦 *Responde 1, 2 o 3*`
  
  await m.reply(mensajeResultado)
  return true
}

// Funciones auxiliares
function generarOpciones(etapa, peligro) {
  let opciones = []
  
  switch(etapa) {
    case "entrada":
      opciones = [
        { texto: "Avanzar con cautela, observando cada detalle", riesgo: "bajo", recompensa: "baja" },
        { texto: "Correr hacia adelante, confiando en la velocidad", riesgo: "medio", recompensa: "media" },
        { texto: "Buscar atajos o pasadizos secretos", riesgo: "alto", recompensa: "alta" }
      ]
      break
    case "intermedio":
      opciones = [
        { texto: "Confrontar directamente el peligro", riesgo: "alto", recompensa: "alta" },
        { texto: "Usar astucia y engaños", riesgo: "medio", recompensa: "media" },
        { texto: "Buscar una ruta alternativa", riesgo: "bajo", recompensa: "baja" }
      ]
      break
    case "final":
      opciones = [
        { texto: "Reclamar el tesoro sin importar las consecuencias", riesgo: "muy alto", recompensa: "muy alta" },
        { texto: "Tomar solo lo seguro y escapar", riesgo: "bajo", recompensa: "baja" },
        { texto: "Intentar obtener todo, incluso lo oculto", riesgo: "alto", recompensa: "alta" }
      ]
      break
  }
  
  // Ajustar riesgo según peligro de locación
  opciones.forEach(op => {
    if (peligro === "muy alto") op.riesgo = aumentarRiesgo(op.riesgo)
    if (peligro === "bajo") op.riesgo = disminuirRiesgo(op.riesgo)
  })
  
  return opciones
}

function calcularResultado(opcion, suerte, peligroLocacion) {
  let resultadoBase = Math.random() * 100
  resultadoBase += (suerte - 50) / 10 // Influencia de suerte
  
  // Ajustar por riesgo de opción
  let multiplicadorRiesgo = {
    "bajo": 0.8,
    "medio": 1.0,
    "alto": 1.3,
    "muy alto": 1.7
  }[opcion.riesgo]
  
  // Ajustar por peligro de locación
  let multiplicadorPeligro = {
    "bajo": 0.7,
    "medio": 1.0,
    "alto": 1.4,
    "muy alto": 2.0
  }[peligroLocacion]
  
  resultadoBase *= multiplicadorRiesgo * multiplicadorPeligro
  
  // Determinar tipo de resultado
  if (resultadoBase > 90) {
    return {
      tipo: "exitoGrande",
      descripcion: getRandom(RESULTADOS.exitoGrande)
    }
  } else if (resultadoBase > 65) {
    return {
      tipo: "exito",
      descripcion: getRandom(RESULTADOS.exito)
    }
  } else if (resultadoBase > 35) {
    return {
      tipo: "neutral",
      descripcion: getRandom(RESULTADOS.neutral)
    }
  } else if (resultadoBase > 15) {
    return {
      tipo: "fracaso",
      descripcion: getRandom(RESULTADOS.fracaso)
    }
  } else {
    return {
      tipo: "fracasoGrande",
      descripcion: getRandom(RESULTADOS.fracasoGrande)
    }
  }
}

function calcularRecompensa(resultado, nivelTesoro) {
  let multiplicadorTesoro = {
    "bajo": 0.5,
    "medio": 1.0,
    "alto": 2.0,
    "muy alto": 3.0
  }[nivelTesoro]
  
  switch(resultado.tipo) {
    case "exitoGrande":
      return {
        coins: Math.floor((Math.random() * 3000 + 1500) * multiplicadorTesoro),
        diamonds: Math.random() > 0.7 ? Math.floor(Math.random() * 3) + 1 : 0,
        dano: Math.floor(Math.random() * 10)
      }
    case "exito":
      return {
        coins: Math.floor((Math.random() * 1500 + 500) * multiplicadorTesoro),
        diamonds: Math.random() > 0.9 ? 1 : 0,
        dano: Math.floor(Math.random() * 20)
      }
    case "neutral":
      return {
        coins: Math.floor((Math.random() * 500 - 250) * multiplicadorTesoro),
        diamonds: 0,
        dano: Math.floor(Math.random() * 30)
      }
    case "fracaso":
      return {
        coins: Math.floor((Math.random() * -800 - 200) * multiplicadorTesoro),
        diamonds: 0,
        dano: Math.floor(Math.random() * 40 + 10)
      }
    case "fracasoGrande":
      return {
        coins: Math.floor((Math.random() * -1500 - 500) * multiplicadorTesoro),
        diamonds: Math.random() > 0.8 ? -1 : 0,
        dano: Math.floor(Math.random() * 50 + 20)
      }
    default:
      return { coins: 0, diamonds: 0, dano: 0 }
  }
}

function aumentarRiesgo(nivel) {
  const niveles = ["bajo", "medio", "alto", "muy alto"]
  let index = niveles.indexOf(nivel)
  return niveles[Math.min(index + 1, niveles.length - 1)]
}

function disminuirRiesgo(nivel) {
  const niveles = ["bajo", "medio", "alto", "muy alto"]
  let index = niveles.indexOf(nivel)
  return niveles[Math.max(index - 1, 0)]
}

handler.help = ['dungeon']
handler.tags = ['game']
handler.command = ['dungeon', 'mazmorra', 'd', 'expedicion']
handler.register = true

export default handler

function msToTime(duration) {
  let minutes = Math.floor((duration / (1000 * 60)) % 60)
  let seconds = Math.floor((duration / 1000) % 60)
  return `${minutes}m ${seconds}s`
}