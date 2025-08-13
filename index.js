const { Client, GatewayIntentBits, Partials } = require('discord.js');
const { token } = require('./config.json');
const { loadCommands, registerCommands, handleInteractions } = require('./slashCommands');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildInvites,
    GatewayIntentBits.GuildMembers,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

loadCommands(client);
handleInteractions(client);

client.once('ready', async () => {
  console.log(`Бот запущен как ${client.user.tag}`);
  await registerCommands(client);
});

require('./handlers/scheduleClubHandler')(client);
require('./handlers/joinNotifyHandler')(client);

client.login(token);
