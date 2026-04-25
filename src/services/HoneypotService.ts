import { GuildTextBasedChannel, Message } from "discord.js";
import { Constants } from "../utility/Constants.js";
import { ban } from "../utility/BanUtil.js";

export async function checkHoneypot(message: Message) {
  if (message.channelId !== Constants.CHANNELS.HONEYPOT) {
    return;
  }
  if (message.member === null || message.guild === null) {
    return;
  }

  const modRoleIds = Constants.MOD_ROLES.map(({ id }) => id);
  if (message.member.roles.cache.hasAny(...modRoleIds)) {
    return;
  }

  await ban(
    message.guild,
    message.author,
    message.member, // @TODO: Markus Need to make this the bot itself.
    "Posted in the Honeypot Channel.",
    message.channel as GuildTextBasedChannel,
  );
}
