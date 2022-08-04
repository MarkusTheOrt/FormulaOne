import { Guild, Message, MessageButton, TextChannel, User } from "discord.js";
import { Constants } from "../utility/Constants";
import { StringUtil } from "../utility/StringUtil";
import { FilterService } from "./FilterService";
import ViolationService from "./ViolationService";

export class BotQueueService {
  public static async checkMessage(message: Message) {
    const result = await FilterService.checkInvites(message);
    if (result) {
      await ViolationService.checkViolations(message);
    }
  }

  public static async archiveLog(
    guild: Guild,
    targetUserId: string,
    moderator: User | null,
    message: Message,
    action: string
  ): Promise<Message | null> {
    const modQueueChannel = guild.channels.cache.get(
      Constants.CHANNELS.MOD_QUEUE
    ) as TextChannel;
    const messageEmbed = message.embeds[0];
    const archiveThread = modQueueChannel.threads.cache.get(
      Constants.CHANNELS.MOD_QUEUE_ARCHIVE
    );
    if (archiveThread == null) {
      return null;
    }

    const buttons = [
      [
        new MessageButton({
          customId: `userid-${targetUserId}`,
          label: `User ID`,
          style: "SECONDARY",
        }),
      ],
    ];

    const messageSent = await archiveThread.send({
      content: `${action}${
        moderator != null ? ` by ${StringUtil.boldify(moderator.tag)}` : ""
      }`,
      embeds: [messageEmbed],
      components: buttons.map((button) => ({
        type: "ACTION_ROW",
        components: button,
      })),
    });
    if (messageSent) {
      await message.delete();
    }
    return messageSent;
  }
}
