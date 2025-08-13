const fs = require('fs');
const path = require('path');
const { EmbedBuilder } = require('discord.js');

const data = {
  name: 'вход_сервер',
  description: 'Настроить приветственный модуль для сервера (только для администраторов)',
  options: [
    {
      name: 'канал',
      description: 'ID канала для приветственных сообщений',
      type: 3, // STRING
      required: true
    }
  ]
};

async function execute(interaction, client) {
  if (!interaction.member.permissions.has('Administrator')) {
    return interaction.reply({ content: '❌ Требуются права администратора.', ephemeral: true });
  }

  const channelId = interaction.options.getString('канал');
  if (!channelId.match(/^\d+$/)) {
    return interaction.reply({ content: '❌ Неверный формат ID канала. Укажите числовой ID.', ephemeral: true });
  }

  // Проверяем, что канал существует
  try {
    const channel = await interaction.guild.channels.fetch(channelId);
    if (!channel) {
      return interaction.reply({ content: '❌ Канал не найден на этом сервере.', ephemeral: true });
    }
  } catch (e) {
    return interaction.reply({ content: '❌ Не удалось найти канал с указанным ID.', ephemeral: true });
  }

  const configPath = path.join(__dirname, 'serverConfigs.json');
  let serverConfigs = {};
  try {
    if (fs.existsSync(configPath)) {
      serverConfigs = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }
  } catch (e) {
    console.error('Ошибка чтения serverConfigs.json:', e);
  }

  const guildId = interaction.guild.id;
  serverConfigs[guildId] = {
    ...serverConfigs[guildId],
    joinNotify: { channelId }
  };

  try {
    fs.writeFileSync(configPath, JSON.stringify(serverConfigs, null, 2), 'utf8');
  } catch (e) {
    console.error('Ошибка записи serverConfigs.json:', e);
    return interaction.reply({ content: '❌ Не удалось сохранить настройки.', ephemeral: true });
  }

  const embed = new EmbedBuilder()
    .setTitle('✅ Приветствия настроены')
    .setColor('#00FF00')
    .addFields(
      { name: 'Канал', value: `<#${channelId}>`, inline: true }
    )
    .setFooter({ text: `Настроил: ${interaction.user.tag}` })
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}

module.exports = { data, execute };