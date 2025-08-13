const { Events, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const Jimp = require('jimp');
const { joinNotifyChannelId } = require('../config.json');

// Подключаем шрифт Floripa
// registerFont('./fonts/Floripa.ttf', { family: 'Floripa' });

// Если нужно использовать кастомный шрифт, раскомментируй и укажи путь
// registerFont('./fonts/YourFont.ttf', { family: 'YourFont' });

module.exports = (client) => {
  client.on(Events.GuildMemberAdd, async (member) => {
    try {
      // Размеры изображения
      const width = 700;
      const height = 250;
      // Создаём пустое изображение
      const image = await Jimp.create(width, height, '#23272A');

      // Загружаем аватар пользователя
      const avatarURL = member.user.displayAvatarURL({ extension: 'png', size: 128 });
      const avatar = await Jimp.read(avatarURL);
      avatar.circle(); // Обрезаем в круг
      const avatarSize = 150;
      const avatarX = (width - avatarSize) / 2;
      const avatarY = 30;
      avatar.resize(avatarSize, avatarSize);
      image.composite(avatar, avatarX, avatarY);

      // Загружаем шрифты поменьше
      const fontBig = await Jimp.loadFont(Jimp.FONT_SANS_32_WHITE);
      const fontSmall = await Jimp.loadFont(Jimp.FONT_SANS_16_WHITE);

      // Ник (по центру под аватаркой)
      image.print(
        fontBig,
        0, avatarY + avatarSize + 10,
        {
          text: `${member.user.username} joined`,
          alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
          alignmentY: Jimp.VERTICAL_ALIGN_TOP
        },
        width, 35
      );
      // Тег (по центру под ником)
      image.print(
        fontSmall,
        0, avatarY + avatarSize + 50,
        {
          text: `#${member.user.discriminator}`,
          alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
          alignmentY: Jimp.VERTICAL_ALIGN_TOP
        },
        width, 25
      );

      // Сохраняем в буфер
      const buffer = await image.getBufferAsync(Jimp.MIME_PNG);
      const attachment = new AttachmentBuilder(buffer, { name: 'welcome.png' });

      // Создаём Embed
      const embed = new EmbedBuilder()
        .setTitle('👋 Новый участник!')
        .setDescription(`Приветствуем <@${member.id}> на сервере!`)
        .setColor('#1D1D1E')
        .setImage('attachment://welcome.png')
        .setTimestamp();

      // Отправляем в нужный канал
      const channel = await member.guild.channels.fetch(joinNotifyChannelId).catch(() => null);
      if (channel && channel.isTextBased()) {
        await channel.send({ embeds: [embed], files: [attachment] });
      }

      // Отправляем приветственное сообщение в ЛС
      try {
        const dmEmbed = new EmbedBuilder()
          .setTitle('👋 Добро пожаловать на сервер!')
          .setDescription(
            'Рады видеть тебя! Вот несколько полезных каналов, которые стоит посетить:\n' +
            '• <#1019874048257298432> — подать заявку\n' +
            '• <#1377603548510162974> — при принятии заявки ожидать обзвон\n' +
            '• <#1299816898464190535> — глобальный чат\n' +
            '• <#1300957359971237950> — глобальный войс\n' +
            '\nЕсли возникнут вопросы — не стесняйся обращаться к администрации!'
          )
          .setColor('#1D1D1E');
        await member.send({ embeds: [dmEmbed] });
      } catch (e) {
        // Игнорируем ошибку, если ЛС закрыты
      }
    } catch (err) {
      console.error('Ошибка при отправке welcome-image:', err);
    }
  });
}; 