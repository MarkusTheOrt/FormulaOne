import { ApplicationCommandRegistry, Awaitable, Command } from "@sapphire/framework";
import { CommandInteraction, MessageButton, TextBasedChannel } from "discord.js";
import {
  replyInteractionError,
  replyInteractionPublic,
  send,
} from "../../utility/Sender";
import { Constants } from "../../utility/Constants";
import { StringUtil } from "../../utility/StringUtil";

export class NewsCommand extends Command {
  public constructor(context: Command.Context) {
    super(context, {
      preconditions: ["F2"],
    });
  }

  public override registerApplicationCommands(
    registry: ApplicationCommandRegistry
  ): Awaitable<void> {
    registry.registerChatInputCommand(
      {
        name: this.name,
        description: "Post a URL to #news.",
        options: [
          {
            name: "url",
            description: "The URL to send.",
            type: "STRING",
            required: true,
          },
        ],
        defaultPermission: false,
      },
      {
        guildIds: Constants.GUILD_IDS,
        idHints: ["959532806986420285"],
      }
    );
  }

  public async chatInputRun(interaction: CommandInteraction) {
    const url = interaction.options.getString("url");
    if (interaction.guild == null || url == null) {
      return;
    }
    if (!Constants.REGEXES.URL.test(url)) {
      await replyInteractionError(interaction, "That is not a valid URL.");
      return;
    }

    const newsChannel = interaction.guild.channels.cache.get(Constants.CHANNELS.NEWS);
    if (newsChannel == null) {
      return;
    }

    const buttons: Array<Array<MessageButton>> = [
      [
        new MessageButton({
          customId: `publish-${interaction.user.id}`,
          label: "Publish",
          style: "SECONDARY",
        }),
      ],
    ];
    await send(
      newsChannel as TextBasedChannel,
      `${url} sent by ${StringUtil.boldify(interaction.user.tag)}`,
      {},
      {
        components: buttons.map((button) => ({
          type: "ACTION_ROW",
          components: button,
        })),
      }
    );
    await replyInteractionPublic(
      interaction,
      `Successfully posted to ${newsChannel.toString()}`
    );
  }
}
