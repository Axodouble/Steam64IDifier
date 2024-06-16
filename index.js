const { EmbedBuilder } = require("@discordjs/builders");
const discord = require("discord.js");
/**
 * Represents a Discord client.
 * @type {discord.Client}
 */
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
const steam = new SteamAPI(process.env.STEAM_TOKEN);

client.on("ready", async () => {
  const commands = await client.application.commands.fetch();
  const existingCommand = commands.find((command) => command.name === "64id");

  if (!existingCommand) {
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

function login() {
  client.login(process.env.DISCORD_TOKEN).catch((error) => {
    console.error(error);
    setTimeout(() => {
      login();
    }, 60000);
  });
}

login();

client.on("interactionCreate", async (interaction) => {
  if (interaction.commandName === "64id" && interaction.isCommand()) {
    await interaction.deferReply(); 
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

  if (interaction.isButton()) {
    if (interaction.customId === "delete") {
      interaction.message.delete();
    }
  }
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  const steamLinkRegex = /https?:\/\/steamcommunity\.com\/id\/([^\s/]+)/gi;
  const matches = message.content.match(steamLinkRegex); 
  if (matches) {
    matches.forEach(async (match) => {
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
      })
    });
  }
});

process.on("uncaughtException", (error) => {
  console.error(error);
});
