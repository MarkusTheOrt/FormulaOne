import { GuildTextBasedChannel, Message } from "discord.js";
import { Constants } from "../utility/Constants.js";
import { ban } from "../utility/BanUtil.js";

export async function honeypotCheck(message: Message) {
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

  const botMember =
    message.guild.members.me !== null
      ? message.guild.members.me
      : await message.guild.members.fetchMe();

  await ban(
    message.guild,
    message.author,
    botMember,
    "Posted in the Honeypot Channel.",
    message.channel as GuildTextBasedChannel,
  );
}
