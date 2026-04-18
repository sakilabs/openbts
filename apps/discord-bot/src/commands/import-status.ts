import type { ChatInputCommandInteraction } from "discord.js";
import { MessageFlags, SeparatorBuilder, TextDisplayBuilder } from "discord.js";
import type { RedisClientType } from "redis";

const V2 = MessageFlags.IsComponentsV2 as const;

const STEP_EMOJI: Record<string, string> = {
  success: "✅",
  skipped: "⏭️",
  running: "⏳",
  error: "❌",
  pending: "🔲",
};

interface ImportStep {
  key: string;
  status: string;
  startedAt?: string;
  finishedAt?: string;
}

interface ImportJobStatus {
  state: string;
  startedAt?: string;
  finishedAt?: string;
  steps: ImportStep[];
  error?: string;
}

function stepDuration(step: ImportStep): string {
  if (!step.startedAt || !step.finishedAt) return "";
  const ms = new Date(step.finishedAt).getTime() - new Date(step.startedAt).getTime();
  return ` (${(ms / 1000).toFixed(1)}s)`;
}

function getStateLabel(state: string): string {
  if (state === "idle") return "Oczekiwanie";
  if (state === "running") return "Trwa";
  if (state === "success") return "Sukces";
  if (state === "error") return "Błąd";
  return "Nieznany";
}

function getStateIcon(state: string): string {
  if (state === "success") return "✅";
  if (state === "error") return "❌";
  if (state === "running") return "⏳";
  return "🔲";
}

export async function handleImportStatusCommand(interaction: ChatInputCommandInteraction, redis: RedisClientType): Promise<void> {
  await interaction.deferReply({ ephemeral: true });

  const raw = await redis.get("uke:import:status");
  if (!raw) {
    await interaction.editReply({
      flags: V2,
      components: [new TextDisplayBuilder().setContent("Żaden import nie został uruchomiony.")],
    });
    return;
  }

  const status = JSON.parse(raw) as ImportJobStatus;
  const stateLabel = getStateLabel(status.state);
  const stateIcon = getStateIcon(status.state);

  const components = [];

  const headerLines = [`### ${stateIcon} UKE Import - ${stateLabel}`];
  if (status.startedAt) headerLines.push(`▶️ Rozpoczęto: <t:${Math.floor(new Date(status.startedAt).getTime() / 1000)}:R>`);
  if (status.finishedAt) headerLines.push(`🏁 Zakończono: <t:${Math.floor(new Date(status.finishedAt).getTime() / 1000)}:R>`);
  components.push(new TextDisplayBuilder().setContent(headerLines.join("\n")));

  const activeSteps = status.steps.filter((s) => s.status !== "pending");
  if (activeSteps.length > 0) {
    components.push(new SeparatorBuilder());
    const stepLines = activeSteps.map((s) => `${STEP_EMOJI[s.status] ?? "❓"} **${s.key}**${stepDuration(s)}`);
    components.push(new TextDisplayBuilder().setContent(stepLines.join("\n")));
  }

  if (status.error) {
    components.push(new SeparatorBuilder());
    components.push(new TextDisplayBuilder().setContent(`**Błąd**\n\`\`\`${status.error.slice(0, 500)}\`\`\``));
  }

  await interaction.editReply({ flags: V2, components });
}
