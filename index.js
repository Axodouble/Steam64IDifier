const { EmbedBuilder } = require("@discordjs/builders");
const discord = require("discord.js");
const client = new discord.Client({
  intents: [
    discord.IntentsBitField.Flags.Guilds,
    discord.IntentsBitField.Flags.GuildMembers,
    discord.IntentsBitField.Flags.GuildMessages,
    discord.IntentsBitField.Flags.MessageContent,
  ],
});
require("dotenv").config();

const SteamAPI = require("steamapi");
const steam = new SteamAPI(process.env.steam_api);

client.on("ready", async () => {
  // Check if the bot has a command with the name 64id
  const commands = await client.application.commands.fetch();
  const existingCommand = commands.find((command) => command.name === "64id");

  if (!existingCommand) {
    // If not, register it
    await client.application.commands.create(
      new discord.SlashCommandBuilder()
        .setName("64id")
        .setDescription("Fetch a user's 64ID")
        .addStringOption((option) =>
          option
            .setName("steamlink")
            .setDescription("The steam link of the user.")
            .setRequired(true)
        )
    );

    console.log("Registered 64ID command!");
  }

  console.log("Bot is ready!");
});

client.login(process.env.token); // Login

client.on("interactionCreate", async (interaction) => {
  await interaction.deferReply(); // Defer the reply so we can edit it later
  // Slash command got run
  if (interaction.commandName === "64id" && interaction.isCommand()) {
    const steamLink = interaction.options.getString("steamlink");
    steam
      .resolve(steamLink)
      .then((id64) => {
        interaction.editReply({
          content: `64ID: [${id64}](https://steamcommunity.com/profiles/${id64})`,
        });
      })
      .catch(() => {
        interaction.editReply({
          content: `Invalid steam link.`,
        });
      });
  }

  // Hide the message / delete it
  if (interaction.isButton()) {
    if (interaction.customId === "delete") {
      interaction.message.delete();
    }
  }
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return; // Check if the user is a bot
  const steamLinkRegex = /https?:\/\/steamcommunity\.com\/id\/([^\s/]+)/gi; // Regex to findd the steam link
  const matches = message.content.match(steamLinkRegex); // Still the regex
  if (matches) {
    // If there are matches
    matches.forEach(async (match) => {
      // Go through all matches
      const id64 = await steam.resolve(match);
      message.reply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `64ID: [${id64}](https://steamcommunity.com/profiles/${id64})`
            )
            .setFooter({
              text: "This was an automated action, we detected a steam profile link with a custom id in your message.",
              iconURL: client.application.iconURL(),
            }),
        ],
        components: [
          new discord.ActionRowBuilder().addComponents([
            new discord.ButtonBuilder()
              .setLabel("Hide")
              .setStyle(discord.ButtonStyle.Secondary)
              .setEmoji("👁️")
              .setCustomId("delete"),
          ]),
        ],
        allowedMentions: { repliedUser: false },
      }); // Reply with the 64ID and a button to hide the message
    });
  }
});

process.on("uncaughtException", (error) => {
  console.error(error); // Prevent the bot from crashing
});
