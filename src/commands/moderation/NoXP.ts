import {
  ApplicationCommandRegistry,
  Awaitable,
  Command,
  CommandOptionsRunTypeEnum,
} from "@sapphire/framework";
import { CommandInteraction, GuildMember } from "discord.js";
import { Constants } from "../../utility/Constants";
import { CommandUtil } from "../../utility/CommandUtil";
import { modLog } from "../../services/ModerationService";
import {
  dm,
  replyInteractionError,
  replyInteractionPublic,
} from "../../utility/Sender";
import { StringUtil } from "../../utility/StringUtil";

export class NoXP extends Command {
  public constructor(context: Command.Context) {
    super(context, {
      runIn: CommandOptionsRunTypeEnum.GuildText,
      preconditions: ["Marshals", "MemberValidation", "NoModerator"],
    });
  }

  public override registerApplicationCommands(
    registry: ApplicationCommandRegistry
  ): Awaitable<void> {
    registry.registerChatInputCommand(
      {
        name: this.name,
        description: "Change a member's NoXP status.",
        options: [
          {
            name: "add",
            description: "Add the NoXP role to a member",
            type: "SUB_COMMAND",
            options: [
              {
                name: "member",
                description: "The member to banish",
                type: "USER",
                required: true,
              },
              {
                name: "reason",
                description: "The reason for the banish",
                type: "NUMBER",
                choices: CommandUtil.getRuleChoices(),
                required: true,
              },
            ],
          },
          {
            name: "remove",
            description: "Remove the NoXP role from a member",
            type: "SUB_COMMAND",
            options: [
              {
                name: "member",
                description: "The member to unbanish",
                type: "USER",
                required: true,
              },
              {
                name: "reason",
                description: "The reason for the unbanish",
                type: "STRING",
                required: true,
              },
            ],
          },
        ],
      },
      {
        guildIds: Constants.GUILD_IDS,
        idHints: ["987430208762159134"],
      }
    );
  }

  public async chatInputRun(interaction: CommandInteraction) {
    const subcommand = interaction.options.getSubcommand();
    const targetMember = interaction.options.getMember("member") as GuildMember;
    let reason;
    if (
      interaction.guild == null ||
      interaction.channel == null ||
      targetMember == null
    ) {
      return;
    }
    const role = await interaction.guild.roles.fetch(Constants.ROLES.NOXP);
    if (role == null) {
      return;
    }
    if (subcommand === "add") {
      const ruleNumber = interaction.options.getNumber("reason");
      if (ruleNumber == null) {
        return;
      }
      reason = `Rule ${ruleNumber + 1} - ${Constants.RULES[ruleNumber]}`;

      if (targetMember.roles.cache.has(Constants.ROLES.NOXP)) {
        await replyInteractionError(
          interaction,
          `${StringUtil.boldify(targetMember.user.tag)} already has the NoXP role.`
        );
        return;
      }

      await targetMember.roles.add(role);
      await dm(
        targetMember.user,
        "A moderator has given you the NoXP role. You are now unable to gain XP.",
        interaction.channel
      );
      await replyInteractionPublic(
        interaction,
        `Successfully added NoXP to ${StringUtil.boldify(targetMember.user.tag)}.`
      );
      await modLog(
        interaction.guild,
        interaction.user,
        [
          "Action",
          "Added NoXP",
          "Member",
          `${targetMember.user.tag} (${targetMember.id})`,
          "Reason",
          reason,
          "Channel",
          interaction.channel.toString(),
        ],
        Constants.BANISH_COLOR,
        targetMember.user
      );
    } else if (subcommand === "remove") {
      reason = interaction.options.getString("reason");
      if (reason == null) {
        return;
      }

      if (!targetMember.roles.cache.has(Constants.ROLES.NOXP)) {
        await replyInteractionError(
          interaction,
          `${StringUtil.boldify(targetMember.user.tag)} does not have the NoXP role.`
        );
        return;
      }

      await targetMember.roles.remove(role);
      await dm(
        targetMember.user,
        "A moderator has removed the NoXP role from you. You are now able to gain XP.",
        interaction.channel
      );
      await replyInteractionPublic(
        interaction,
        `Successfully removed NoXP from ${StringUtil.boldify(targetMember.user.tag)}.`
      );
      await modLog(
        interaction.guild,
        interaction.user,
        [
          "Action",
          "Removed NoXP",
          "Member",
          `${targetMember.user.tag} (${targetMember.id})`,
          "Reason",
          reason,
          "Channel",
          interaction.channel.toString(),
        ],
        Constants.UNMUTE_COLOR,
        targetMember.user
      );
    }
  }
}
