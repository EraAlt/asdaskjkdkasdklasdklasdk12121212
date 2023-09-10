const { Client, Events, GatewayIntentBits, SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const limites = {
  ["Titulo"]: 240,
  ["Descripcion"]: 1500,
  ["Pago"]: 100,
  ["Tipo de Pago"]: 100,
  ["Portafolio"]: 100,
  ["Trabajos"]: 500,
  ["Contacto"]: 200,
}

function limitarTexto(texto, limite) {
  if (texto.length > limite) {
    return texto.substring(0, limite) + "...";
  }
  return texto;
}

client.on('ready', () => {
  console.log(`Bot conectado como ${client.user.tag}`);

  const crearEmbed = new SlashCommandBuilder()
  .setName("crear_embed")
  .setDescription("Crea un embed")

  const modificarEmbed = new SlashCommandBuilder()
  .setName("modificar_embed")
  .setDescription("Modifica el contenido de un embed")
  for (let campo in limites) {
    modificarEmbed.addStringOption(option =>
      option.setName(campo.replace(/\s/g, "_").toLowerCase())
      .setDescription(`Modifica el valor del campo '${campo}'`)
      .setRequired(true)
    )
  }
  
  const enviarEmbed = new SlashCommandBuilder()
  .setName("enviar_embed")
  .setDescription("Envía un embed")

  client.application.commands.create(crearEmbed)
  client.application.commands.create(modificarEmbed)
  client.application.commands.create(enviarEmbed)
});

let embeds = {}
client.on('interactionCreate', async (interaction) => {
  if (interaction.isButton()) {
    const { customId } = interaction
    if (customId == "AceptarTrabajo") {
      if (interaction.member.roles.cache.some(role => role.name === 'Moderador')) {
        const embed = interaction.message.embeds[0]
        const botonBorrar = new ButtonBuilder()
        .setCustomId("BorrarTrabajo")
        .setLabel("Borrar")
        .setStyle(ButtonStyle.Danger)
  
        const actionRow = new ActionRowBuilder()
  			.addComponents(botonBorrar)

        const channel = interaction.member.guild.channels.cache.find(channel => channel.name === "trabajos")
        if (channel) {
          channel.send({embeds: [embed], components: [actionRow]})
        }
        
        await interaction.message.delete()
        await interaction.reply({content: `Has **aceptado** el trabajo del usuario **${embed.author.name}**.`, ephemeral: true})
      } else {
        await interaction.reply({content: 'No tienes permiso para usar este botón.', ephemeral: true});
      }
    } else if (customId == "RechazarTrabajo") {
      if (interaction.member.roles.cache.some(role => role.name === 'Moderador')) {
        let embed = interaction.message.embeds[0]
        await interaction.message.delete()
        await interaction.reply({content: `Has **rechazado** el trabajo del usuario **${embed.author.name}**.`, ephemeral: true})
      } else {
        await interaction.reply({content: 'No tienes permiso para usar este botón.', ephemeral: true});
      }
    } else if (customId == "BorrarTrabajo") {
      if (interaction.member.roles.cache.some(role => role.name === 'Moderador')) {
        let embed = interaction.message.embeds[0]
        await interaction.message.delete()
        await interaction.reply({content: `Has **borrado** el trabajo del usuario **${embed.author.name}**.`, ephemeral: true})
      } else {
        await interaction.reply({content: 'No tienes permiso para usar este botón.', ephemeral: true});
      }
    }
  }
  
  if (!interaction.isCommand()) return;

  const { commandName, options } = interaction;

  if (commandName === 'crear_embed') {
    // Verifica que el autor de la interacción sea un moderador
    if (interaction.member.roles.cache.some(role => role.name === 'Usuarios')) {
      // Lógica para crear el embed
      const ajustesEmbed = {
        Titulo: "Titulo",
        Descripcion: "Descripción",
        Pago: "Por añadir",
        ["Tipo de Pago"]: "Por añadir",
        Portafolio: "Por añadir",
        Trabajos: "Por añadir",
        Contacto: `Discord - <@${interaction.member.user.id}>`,
      }

      let textoLimites = ""
      for (let [opcion, valor] of Object.entries(ajustesEmbed)) {
        textoLimites += `${opcion}: \`${valor.length}/${limites[opcion]}\`\n`
      }

      const embed = new EmbedBuilder()
      .setTitle(ajustesEmbed["Titulo"])
      .setDescription(ajustesEmbed["Descripcion"])
      .addFields(
        {name: "Pago", value: ajustesEmbed["Pago"], inline: true},
        {name: "Tipo de Pago", value: ajustesEmbed["Tipo de Pago"], inline: true},
        {name: "Portafolio", value: ajustesEmbed["Portafolio"]},
        {name: "Trabajos Pasados", value: ajustesEmbed["Trabajos"]},
        {name: "Contacto", value: ajustesEmbed["Contacto"]},
        {name: "Limites de caracteres", value: textoLimites},
      )
      .setAuthor({name: interaction.member.user.username, iconURL: interaction.member.user.displayAvatarURL()})
      .setColor("#FFFFFF")
      .setTimestamp()

      embeds[interaction.member.user.id] = ajustesEmbed
      await interaction.reply({content: 'Embed creado. Puedes usar /modificar_embed para editarlo.', embeds: [embed], ephemeral: true});
    } else {
      await interaction.reply({content: 'No tienes permiso para crear un embed.', ephemeral: true});
    }
  }

  if (commandName === 'modificar_embed') {
    // Verifica que el autor de la interacción sea un moderador
    if (interaction.member.roles.cache.some(role => role.name === 'Usuarios')) {
      // Lógica para modificar el embed
      const ajustesEmbed = embeds[interaction.member.user.id]
      if (!ajustesEmbed) {
        return await interaction.reply({content: 'No has creado un embed todavía, utiliza  /crear_embed para crear uno.', ephemeral: true})
      }

      for (let campo in limites) {
        let nombreOpcion = campo.replace(/\s/g, "_").toLowerCase()
        let valorCampo = options.getString(nombreOpcion)
        if (valorCampo) {
          ajustesEmbed[campo] = valorCampo
        }
      }
      
      let textoLimites = ""
      for (let [opcion, valor] of Object.entries(ajustesEmbed)) {
        textoLimites += `${opcion}: \`${valor.length}/${limites[opcion]}\`\n`
      }

      const embed = new EmbedBuilder()
      .setTitle(limitarTexto(ajustesEmbed["Titulo"], 240))
      .setDescription(limitarTexto(ajustesEmbed["Descripcion"], 1500))
      .addFields(
        {name: "Pago", value: limitarTexto(ajustesEmbed["Pago"], 100), inline: true},
        {name: "Tipo de Pago", value: limitarTexto(ajustesEmbed["Tipo de Pago"], 100), inline: true},
        {name: "Portafolio", value: limitarTexto(ajustesEmbed["Portafolio"], 100)},
        {name: "Trabajos Pasados", value: limitarTexto(ajustesEmbed["Trabajos"], 500)},
        {name: "Contacto", value: limitarTexto(ajustesEmbed["Contacto"], 200)},
        {name: "Limites de caracteres", value: textoLimites},
      )
      .setAuthor({name: interaction.member.user.username, iconURL: interaction.member.user.displayAvatarURL()})
      .setColor("#FFFFFF")
      .setTimestamp()
      
      await interaction.reply({content: '¡Embed actualizado!', embeds: [embed], ephemeral: true});
    } else {
      await interaction.reply({content: 'No tienes permiso para modificar el embed.', ephemeral: true});
    }
  }

  if (commandName === 'enviar_embed') {
    // Verifica que el autor de la interacción sea un moderador
    if (interaction.member.roles.cache.some(role => role.name === 'Usuarios')) {
      // Lógica para enviar el embed
      const ajustesEmbed = embeds[interaction.member.user.id]
      if (!ajustesEmbed) {
        return await interaction.reply({content: 'No has creado un embed todavía, utiliza  /crear_embed para crear uno.', ephemeral: true})
      }

      for (let [opcion, valor] of Object.entries(ajustesEmbed)) {
        if (valor == "Por añadir") {
          ajustesEmbed[opcion] = "No añadido"
        }
      }

      const embed = new EmbedBuilder()
      .setTitle(limitarTexto(ajustesEmbed["Titulo"], 240))
      .setDescription(limitarTexto(ajustesEmbed["Descripcion"], 1500))
      .addFields(
        {name: "Pago", value: limitarTexto(ajustesEmbed["Pago"], 100), inline: true},
        {name: "Tipo de Pago", value: limitarTexto(ajustesEmbed["Tipo de Pago"], 100), inline: true},
        {name: "Portafolio", value: limitarTexto(ajustesEmbed["Portafolio"], 100)},
        {name: "Trabajos Pasados", value: limitarTexto(ajustesEmbed["Trabajos"], 500)},
        {name: "Contacto", value: limitarTexto(ajustesEmbed["Contacto"], 200)},
      )
      .setAuthor({name: interaction.member.user.username, iconURL: interaction.member.user.displayAvatarURL()})
      .setColor("#FFFFFF")
      .setTimestamp()

      const botonAceptar = new ButtonBuilder()
      .setCustomId("AceptarTrabajo")
      .setLabel("Aceptar")
      .setStyle(ButtonStyle.Success)

      const botonRechazar = new ButtonBuilder()
      .setCustomId("RechazarTrabajo")
      .setLabel("Rechazar")
      .setStyle(ButtonStyle.Danger)

      const actionRow = new ActionRowBuilder()
			.addComponents(botonAceptar, botonRechazar)

      const channel = interaction.member.guild.channels.cache.find(channel => channel.name === "verificar-trabajos")
      if (channel) {
        channel.send({content: "Trabajo recibido", embeds: [embed], components: [actionRow]})
      }

      delete embeds[interaction.member.user.id]
      await interaction.reply({content: '¡Embed enviado!', ephemeral: true});
    } else {
      await interaction.reply({content: 'No tienes permiso para enviar el embed.', ephemeral: true});
    }
  }
});

client.login(process.env.TOKEN);