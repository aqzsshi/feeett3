const fs = require('fs');
const path = require('path');
const { Collection } = require('discord.js');

function loadCommands(client) {
  client.commands = new Collection();
  const commandFiles = fs.readdirSync(path.join(__dirname, 'handlers'))
    .filter(file => file.endsWith('Command.js') || file.endsWith('Handler.js'));

  for (const file of commandFiles) {
    const commandPath = path.join(__dirname, 'handlers', file);
    const commandModule = require(commandPath);
    if (commandModule.data && commandModule.execute) {
      client.commands.set(commandModule.data.name, commandModule);
    }
  }
}

async function registerCommands(client) {
  try {
    // Регистрируем команды глобально для всех серверов
    const commandsData = Array.from(client.commands.values()).map(cmd => cmd.data);
    await client.application.commands.set(commandsData);
    console.log('✅ Slash-команды зарегистрированы глобально для всех серверов!');
    console.log(`📋 Зарегистрировано команд: ${commandsData.length}`);
    
    // Показываем список зарегистрированных команд
    console.log('📝 Зарегистрированные команды:');
    commandsData.forEach(cmd => {
      console.log(`  • /${cmd.name} - ${cmd.description}`);
    });
    
  } catch (error) {
    console.error('❌ Ошибка при глобальной регистрации команд:', error);
    
    // Если глобальная регистрация не удалась, пробуем зарегистрировать на конкретном сервере
    console.log('🔄 Пробуем зарегистрировать команды на конкретном сервере...');
    const guildId = '973961679228502016';
    const guild = client.guilds.cache.get(guildId);
    if (guild) {
      try {
        const commandsData = Array.from(client.commands.values()).map(cmd => cmd.data);
        await guild.commands.set(commandsData);
        console.log('✅ Slash-команды зарегистрированы на сервере!');
      } catch (guildError) {
        console.error('❌ Ошибка при регистрации на сервере:', guildError);
      }
    }
  }
}

function handleInteractions(client) {
  client.on('interactionCreate', async (interaction) => {
    // Запретить вызов команд в ЛС, кроме /клубы
    if (interaction.isChatInputCommand()) {
      if (interaction.channel && interaction.channel.type === 1 && interaction.commandName !== 'клубы') {
        await interaction.reply({ content: '❌ Эту команду нельзя вызывать в личных сообщениях бота.', ephemeral: true });
        return;
      }
      const command = client.commands.get(interaction.commandName);
      if (!command) return;
      try {
        await command.execute(interaction, client);
      } catch (error) {
        console.error(error);
        await interaction.reply({ content: 'Произошла ошибка при выполнении команды.', ephemeral: true });
      }
    } else if (interaction.isButton() || interaction.isModalSubmit() || interaction.isStringSelectMenu()) {
      // Проверяем все команды на наличие обработчиков компонентов
      let handled = false;
      
      for (const cmd of client.commands.values()) {
        if (typeof cmd.handleComponent === 'function') {
          try {
            await cmd.handleComponent(interaction, client);
            handled = true;
            break;
          } catch (err) {
            console.error(`Ошибка в handleComponent команды ${cmd.data?.name}:`, err);
          }
        }
        
        // Проверяем обработчики модальных окон
        if (typeof cmd.handleModal === 'function' && interaction.isModalSubmit()) {
          try {
            await cmd.handleModal(interaction, client);
            handled = true;
            break;
          } catch (err) {
            console.error(`Ошибка в handleModal команды ${cmd.data?.name}:`, err);
          }
        }
      }
      
      // Если ни одна команда не обработала, пробуем модуль навыков
      if (!handled) {
        try {
          const { handleComponent } = require('./handlers/skillsHandler');
          await handleComponent(interaction, client);
        } catch (e) {
          // Игнорируем ошибки модуля навыков
        }
      }
    }
  });
}

// Функция для очистки всех команд (использовать только при необходимости)
async function clearAllCommands(client) {
  try {
    await client.application.commands.set([]);
    console.log('🗑️ Все глобальные команды очищены!');
  } catch (error) {
    console.error('❌ Ошибка при очистке команд:', error);
  }
}

module.exports = { loadCommands, registerCommands, handleInteractions, clearAllCommands }; 