import {
  InteractionHandler,
  InteractionHandlerTypes,
  PieceContext,
} from "@sapphire/framework";
import {
  ButtonInteraction,
  GuildMember,
  MessageSelectMenu,
  MessageSelectOptionData,
} from "discord.js";
import { getDBUser } from "../../utility/DatabaseUtil.js";
import { replyInteractionError } from "../../utility/Sender.js";
import TryVal from "../../utility/TryVal.js";
import { getPunishmentDisplay } from "../../utility/PunishUtil.js";
import { Constants } from "../../utility/Constants.js";
import { boldify } from "../../utility/StringUtil.js";

export class ShowAmountSelect extends InteractionHandler {
  public constructor(context: PieceContext) {
    super(context, {
      interactionHandlerType: InteractionHandlerTypes.Button,
    });
  }

  public async run(
    interaction: ButtonInteraction,
    parsedData: InteractionHandler.ParseResult<this>
  ) {
    if (interaction.guild == null) {
      return;
    }
    const targetMember = (await TryVal(
      interaction.guild.members.fetch(parsedData.targetMemberId)
    )) as GuildMember;
    if (targetMember == null) {
      await replyInteractionError(interaction, "Member not found.");
      return;
    }
    const dbUser = await getDBUser(targetMember.id, interaction.guild.id);
    if (dbUser == null) {
      return;
    }
    if (dbUser.currentPunishment > 4) {
      await replyInteractionError(
        interaction,
        `${boldify(
          targetMember.user.tag
        )} has exceeded 5 punishments in the last 30 days, escalate their punishment manually.`
      );
      return;
    }

    const amounts = [];
    for (let i = 1; i <= 5 - dbUser.currentPunishment; i += 1) {
      amounts.push(i.toString());
    }
    const options: Array<MessageSelectOptionData> = [];
    amounts.forEach((amount) => {
      const punishment = Constants.PUNISHMENTS.at(
        dbUser.currentPunishment + parseInt(amount, 10) - 1
      );
      if (punishment != null) {
        options.push({
          label: `${amount} punishment${parseInt(amount, 10) !== 1 ? "s" : ""} (${
            getPunishmentDisplay(punishment).displayLog
          })`,
          value: amount,
        });
      }
    });

    const amountSelect = [
      [
        new MessageSelectMenu({
          customId: `amountselect-${parsedData.targetMemberId}-${parsedData.channelId}-${parsedData.messageId}-${interaction.message.id}`,
          placeholder: "Select amount",
          options,
        }),
      ],
    ];
    await interaction.reply({
      content: "Please select a punishment amount.",
      components: amountSelect.map((selectmenu) => ({
        type: "ACTION_ROW",
        components: selectmenu,
      })),
      ephemeral: true,
    });
  }

  public parse(interaction: ButtonInteraction) {
    if (!interaction.customId.startsWith("showamountselect-")) {
      return this.none();
    }
    const split = interaction.customId.split("-");
    split.shift();
    const [targetMemberId, channelId, messageId] = split;
    return this.some({
      targetMemberId,
      channelId,
      messageId,
    });
  }
}
