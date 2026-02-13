let handler = async (m, { conn, usedPrefix, command, text }) => {
  let user = global.db.data.users[m.sender]

  // Prioridad: ID escrito > Respuesta (quoted) > Mención
  let who
  if (text && text.replace(/[^0-9]/g, '').length > 5) {
      who = text.replace(/[^0-9]/g, '') + '@s.whatsapp.net'
  } else if (m.quoted) {
      who = m.quoted.sender
  } else if (m.mentionedJid && m.mentionedJid[0]) {
      who = m.mentionedJid[0]
  }

  // --- COMANDO: DIVORCIARSE ---
  if (command === 'divorciarse') {
      if (!user.marry) return m.reply('*Oh, cariño... ni siquiera tienes un vínculo que romper. Estás libre como el viento.*')
      let ex = user.marry
      if (global.db.data.users[ex]) global.db.data.users[ex].marry = ''
      user.marry = ''
      await m.react('💔')
      return m.reply('*Entiendo... el hilo se ha cortado. He borrado el vínculo y ahora vuelves a estar en soltería. Espero que estés bien, corazón.*')
  }

  if (!who) return m.reply(`*¿A quién buscas, cielo? Necesito que escribas el ID (número) de esa persona especial.* \n\n*Ejemplo:* \`${usedPrefix}${command} 504xxxx\``)

  if (who === m.sender) return m.reply('*¡Ay, qué ternura! Pero no puedes casarte contigo mismo, corazón. Busca a alguien que te complemente.*')

  let target = global.db.data.users[who]
  if (!target) return m.reply('*Lo siento, cielo, pero esa persona no parece estar en mis registros todavía.*')

  if (user.marry) {
      let partnerName = global.db.data.users[user.marry]?.name || conn.getName(user.marry)
      return m.reply(`*¡Pero bueno! Ya tienes un compromiso con ${partnerName}. Si quieres a alguien nuevo, primero debes divorciarte.*`)
  }

  if (target.marry) {
      let suPareja = global.db.data.users[target.marry]?.name || conn.getName(target.marry)
      return m.reply(`*Llegas tarde, corazón... esa persona ya unió su vida con ${suPareja}. No podemos entrometernos así.*`)
  }

  // --- COMANDO: CASARSE (PROPUESTA) ---
  if (command === 'casarse') {
      global.tempMarry = global.tempMarry || {}
      global.tempMarry[who] = m.sender

      await m.react('💍')
      let nameTarget = target.name || conn.getName(who)
      let nameSender = user.name || conn.getName(m.sender)

      return conn.reply(m.chat, `*💍 ¡Qué momento tan dulce! @${who.split('@')[0]}, escucha con atención: @${m.sender.split('@')[0]} quiere unir su vida a la tuya.*\n\n*¿Qué dices, cielo? Tienes un minuto para responder con:* \n> \`${usedPrefix}aceptar ${m.sender.split('@')[0]}\` o \`${usedPrefix}rechazar\``, m, { mentions: [who, m.sender] })
  }

  // --- COMANDO: ACEPTAR ---
  if (command === 'aceptar') {
      if (!global.tempMarry || global.tempMarry[m.sender] !== who) {
          return m.reply(`*No veo ninguna propuesta de esta persona para ti, tesoro. Quizás se arrepintió o el tiempo se acabó.*`)
      }

      user.marry = who
      target.marry = m.sender
      delete global.tempMarry[m.sender]

      await m.react('💖')
      return conn.reply(m.chat, `*✨ ¡MIREN TODOS! ¡HA DICHO QUE SÍ! ✨*\n\n*Me hace tan feliz verlos así. @${m.sender.split('@')[0]} y @${who.split('@')[0]}, desde hoy sus caminos son uno solo. ¡Que viva el amor!*`, m, { mentions: [who, m.sender] })
  }

  // --- COMANDO: RECHAZAR ---
  if (command === 'rechazar') {
      if (!global.tempMarry || global.tempMarry[m.sender] !== who) {
          return m.reply('*No tienes ninguna propuesta que rechazar ahora mismo, cielo.*')
      }

      delete global.tempMarry[m.sender]
      await m.react('🥀')
      return m.reply('*Oh... bueno, supongo que no siempre el amor es correspondido. He avisado de tu decisión con mucha delicadeza.*')
  }
}

handler.help = ['casarse', 'divorciarse', 'aceptar', 'rechazar']
handler.tags = ['main']
handler.command = /^(casarse|aceptar|rechazar|divorciarse)$/i
handler.group = true

export default handler