const { EmbedBuilder } = require('discord.js');
const moment = require('moment-timezone');
const { images } = require('../config.json');

const clubSchedules = [
  {
    name: 'Реднеки',
    image: images.rednecksClubBanner,
    channelId: '1371862380471910440',
    roleId: '1367237509024710798',
    times: ['07:50', '10:50', '13:50', '16:50', '19:50', '21:50'],
  },
];

const sentMessages = [];

module.exports = (client) => {
  setInterval(async () => {
    const now = moment().tz('Europe/Moscow');
    const currentTime = now.format('HH:mm');

    for (const club of clubSchedules) {
      for (const meetingTime of club.times) {
        const meetingMoment = moment(meetingTime, 'HH:mm');
        const diff = meetingMoment.diff(now, 'minutes');

let isReminder = false;
let messageType = ''; // 'reminder' or 'start'

if (diff === 10) {
  isReminder = true;
  messageType = 'reminder';
} else if (meetingTime === currentTime) {
  messageType = 'start';
} else {
  continue;
}


        

        const alreadySent = sentMessages.some(
          msg => msg.club === club.name && msg.time === meetingTime && msg.type === messageType
        );

        if (alreadySent) continue;

        try {
          const channel = await client.channels.fetch(club.channelId);
          if (!channel || !channel.isTextBased()) continue;

          const embed = new EmbedBuilder()
            .setTitle(`Митинг клуба ${club.name}`)
            .setDescription(
                messageType === 'reminder'
                  ? `🔔 Напоминание! Через **10 минут** начнется митинг клуба **${club.name}**. Готовьтесь!`
                  : `✅ Митинг клуба **${club.name}** начинается прямо сейчас!`
              )
              
            .setColor('#1D1D1E')
            .setImage(club.image)
            .setTimestamp();

          const message = await channel.send({
            content: club.roleId ? `<@&${club.roleId}>` : null,
            embeds: [embed],
          });

          sentMessages.push({
            messageId: message.id,
            club: club.name,
            time: meetingTime,
            type: messageType,
            sentAt: Date.now(),
          });

        } catch (err) {
          console.error(`Ошибка при отправке митинга для ${club.name}:`, err);
        }
      }
    }

    // Удаление устаревших сообщений (старше 55 минут)
    for (const msg of [...sentMessages]) {
      const age = Date.now() - msg.sentAt;
      if (age > 55 * 60 * 1000) {
        try {
          const club = clubSchedules.find(c => c.name === msg.club);
          const channel = await client.channels.fetch(club.channelId);
          const m = await channel.messages.fetch(msg.messageId);
          await m.delete();
          sentMessages.splice(sentMessages.indexOf(msg), 1);
        } catch (err) {
          console.error(`Ошибка при удалении сообщения ${msg.messageId}:`, err);
        }
      }
    }

  }, 60 * 1000); // Проверка каждую минуту
};
