import { HfInference } from "@huggingface/inference";

interface YearAnalysisInput {
  narrative: string;
  highlights: string[];
  lowlights: string[];
  goalsAchieved: string[];
  goalsNotAchieved: string[];
  lifeMapScores: {
    career: number;
    relationships: number;
    health: number;
    meaning: number;
    finances: number;
    fun: number;
  };
}

interface InsightGenerationInput {
  checkIns: Array<{
    date: string;
    energy: number;
    win: string;
    friction: string;
  }>;
  reviews: Array<{
    type: string;
    date: string;
    keyInsight: string;
  }>;
}

interface PeriodSummaryInput {
  period: "week" | "month" | "quarter";
  data: {
    checkIns: number;
    avgEnergy: number;
    topWins: string[];
    topFrictions: string[];
    goalsProgress: Record<string, number>;
  };
}

export class ReflectionAgent {
  private hf: HfInference;
  private model = "mistralai/Mixtral-8x7B-Instruct-v0.1";

  constructor() {
    this.hf = new HfInference(process.env.HF_TOKEN);
  }

  private readonly systemPrompt = `You are an analytical reflection partner for a CEO. Your role is to:
- Synthesize information into clear insights
- Identify patterns that might not be obvious
- Ask questions that promote deeper reflection
- Maintain a calm, non-judgmental tone
- Focus on growth and learning, not criticism
- Be concise and strategic`;

  async analyzeYear(input: YearAnalysisInput) {
    const lifeMapAvg =
      Object.values(input.lifeMapScores).reduce((a, b) => a + b, 0) / 6;

    const lowestDomain = Object.entries(input.lifeMapScores).sort(
      ([, a], [, b]) => a - b
    )[0];
    const highestDomain = Object.entries(input.lifeMapScores).sort(
      ([, a], [, b]) => b - a
    )[0];

    const prompt = `
${this.systemPrompt}

Analyze this CEO's year:

**Narrative:** "${input.narrative}"

**Highlights:** ${input.highlights.join("; ")}
**Lowlights:** ${input.lowlights.join("; ")}

**Goals Achieved:** ${input.goalsAchieved.join("; ")}
**Goals Not Achieved:** ${input.goalsNotAchieved.join("; ")}

**Life Map:** Avg ${lifeMapAvg.toFixed(1)}/10
- Strongest: ${highestDomain[0]} (${highestDomain[1]})
- Weakest: ${lowestDomain[0]} (${lowestDomain[1]})

Provide:

## Year Theme
A 2-3 word theme that captures this year.

## The Story
2-3 sentences synthesizing what this year was really about.

## Key Strength Revealed
What capability or character trait showed up consistently?

## Growth Edge Exposed
What area needs attention based on the evidence?

## The Pattern
What does the gap between achieved/unachieved goals reveal?

## The Question
One powerful question for year-end reflection.

## Ten-Year Test
"If this year repeated ten times..." - would that be satisfying? Why or why not?

Be direct and insightful. Under 300 words total.`;

    try {
      const response = await this.hf.textGeneration({
        model: this.model,
        inputs: prompt,
        parameters: {
          max_new_tokens: 600,
          temperature: 0.7,
        },
      });

      return {
        content: [{ type: "text", text: response.generated_text }],
      };
    } catch (error) {
      return this.generateYearAnalysisLocal(input, lifeMapAvg, lowestDomain, highestDomain);
    }
  }

  async generateInsights(input: InsightGenerationInput) {
    // Analyze patterns in check-ins
    const energyTrend = this.analyzeEnergyTrend(input.checkIns);
    const topFrictions = this.extractTopThemes(
      input.checkIns.map((c) => c.friction)
    );
    const topWins = this.extractTopThemes(input.checkIns.map((c) => c.win));

    const prompt = `
${this.systemPrompt}

Analyze patterns from ${input.checkIns.length} check-ins:

**Energy Trend:** ${energyTrend.description}
- Average: ${energyTrend.average.toFixed(1)}/10
- Volatility: ${energyTrend.volatility}

**Common Wins:**
${topWins.map((w) => `- ${w}`).join("\n")}

**Common Frictions:**
${topFrictions.map((f) => `- ${f}`).join("\n")}

**Review Insights:**
${input.reviews.map((r) => `- ${r.type} (${r.date}): ${r.keyInsight}`).join("\n")}

Generate 3-5 actionable insights in this format:

**Insight 1: [Title]**
Category: [Pattern/Strength/Blind Spot/Opportunity]
Observation: [What the data shows]
Implication: [What this means]
Action: [What to do about it]

Keep each insight under 50 words. Be specific and evidence-based.`;

    try {
      const response = await this.hf.textGeneration({
        model: this.model,
        inputs: prompt,
        parameters: {
          max_new_tokens: 500,
          temperature: 0.6,
        },
      });

      return {
        content: [{ type: "text", text: response.generated_text }],
      };
    } catch (error) {
      return this.generateInsightsLocal(energyTrend, topWins, topFrictions);
    }
  }

  async summarizePeriod(input: PeriodSummaryInput) {
    const prompt = `
${this.systemPrompt}

Summarize this ${input.period}:

- Check-ins completed: ${input.data.checkIns}
- Average energy: ${input.data.avgEnergy.toFixed(1)}/10
- Top wins: ${input.data.topWins.join(", ")}
- Top frictions: ${input.data.topFrictions.join(", ")}
- Goal progress: ${Object.entries(input.data.goalsProgress)
      .map(([g, p]) => `${g}: ${p}%`)
      .join(", ")}

Provide:
1. **One-line summary** of the ${input.period}
2. **What worked** (one thing to continue)
3. **What didn't** (one thing to change)
4. **Energy observation** (pattern or concern)
5. **Next ${input.period} focus** (one recommendation)

Under 100 words. Be direct.`;

    try {
      const response = await this.hf.textGeneration({
        model: this.model,
        inputs: prompt,
        parameters: {
          max_new_tokens: 250,
          temperature: 0.6,
        },
      });

      return {
        content: [{ type: "text", text: response.generated_text }],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `**${input.period.charAt(0).toUpperCase() + input.period.slice(1)} Summary**

You completed ${input.data.checkIns} check-ins with ${input.data.avgEnergy.toFixed(1)}/10 average energy.

Top win theme: ${input.data.topWins[0] || "Varied accomplishments"}
Recurring friction: ${input.data.topFrictions[0] || "Multiple challenges"}

Recommendation: Focus on maintaining energy while addressing your primary friction point.`,
          },
        ],
      };
    }
  }

  private analyzeEnergyTrend(
    checkIns: Array<{ energy: number }>
  ): { average: number; volatility: string; description: string } {
    if (checkIns.length === 0) {
      return { average: 0, volatility: "unknown", description: "No data" };
    }

    const energies = checkIns.map((c) => c.energy);
    const average = energies.reduce((a, b) => a + b, 0) / energies.length;

    // Calculate standard deviation
    const squaredDiffs = energies.map((e) => Math.pow(e - average, 2));
    const avgSquaredDiff =
      squaredDiffs.reduce((a, b) => a + b, 0) / squaredDiffs.length;
    const stdDev = Math.sqrt(avgSquaredDiff);

    let volatility: string;
    if (stdDev < 1) volatility = "very stable";
    else if (stdDev < 1.5) volatility = "stable";
    else if (stdDev < 2.5) volatility = "moderate";
    else volatility = "high";

    // Determine trend
    const firstHalf = energies.slice(0, Math.floor(energies.length / 2));
    const secondHalf = energies.slice(Math.floor(energies.length / 2));
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

    let trend: string;
    if (secondAvg > firstAvg + 0.5) trend = "improving";
    else if (secondAvg < firstAvg - 0.5) trend = "declining";
    else trend = "steady";

    return {
      average,
      volatility,
      description: `${trend} trend with ${volatility} volatility`,
    };
  }

  private extractTopThemes(items: string[]): string[] {
    // Simple word frequency analysis
    const wordCounts: Record<string, number> = {};
    const stopWords = new Set([
      "the",
      "a",
      "an",
      "and",
      "or",
      "but",
      "in",
      "on",
      "at",
      "to",
      "for",
      "of",
      "with",
      "by",
      "i",
      "my",
      "was",
      "is",
      "are",
      "been",
      "have",
      "had",
      "it",
      "this",
      "that",
    ]);

    items.forEach((item) => {
      const words = item.toLowerCase().split(/\s+/);
      words.forEach((word) => {
        const cleaned = word.replace(/[^a-z]/g, "");
        if (cleaned.length > 3 && !stopWords.has(cleaned)) {
          wordCounts[cleaned] = (wordCounts[cleaned] || 0) + 1;
        }
      });
    });

    return Object.entries(wordCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([word]) => word);
  }

  private generateYearAnalysisLocal(
    input: YearAnalysisInput,
    avgScore: number,
    lowest: [string, number],
    highest: [string, number]
  ) {
    const achievementRate =
      input.goalsAchieved.length /
      (input.goalsAchieved.length + input.goalsNotAchieved.length);

    return {
      content: [
        {
          type: "text",
          text: `## Year Theme
**${achievementRate > 0.6 ? "Momentum" : achievementRate > 0.4 ? "Transition" : "Foundation"}**

## The Story
This was a year of ${input.highlights.length > input.lowlights.length ? "progress with challenges" : "challenges with progress"}. Your strength in ${highest[0]} (${highest[1]}/10) carried you, while ${lowest[0]} (${lowest[1]}/10) continued to ask for attention.

## Key Strength Revealed
Your ability to recognize wins and articulate them suggests strong self-awareness and momentum-building capacity.

## Growth Edge Exposed
The ${lowest[0]} domain at ${lowest[1]}/10 represents your most significant opportunity for next year.

## The Pattern
${achievementRate > 0.5 ? "You achieved more than you missed" : "Several goals remain unfinished"}—this suggests ${achievementRate > 0.5 ? "realistic goal-setting" : "either overcommitment or shifting priorities"}.

## The Question
If your ${lowest[0]} score matched your ${highest[0]} score, what would be different about your life?

## Ten-Year Test
With a ${avgScore.toFixed(1)}/10 life map average, repeating this year would result in ${avgScore >= 7 ? "a good life" : avgScore >= 5 ? "a mixed life needing adjustment" : "accumulating regret"}. Consider what would make next year score higher.`,
        },
      ],
    };
  }

  private generateInsightsLocal(
    energyTrend: { average: number; volatility: string; description: string },
    topWins: string[],
    topFrictions: string[]
  ) {
    return {
      content: [
        {
          type: "text",
          text: `**Insight 1: Energy Management**
Category: Pattern
Observation: ${energyTrend.description} (avg ${energyTrend.average.toFixed(1)}/10)
Implication: ${energyTrend.volatility === "high" ? "Inconsistent energy affects decision quality" : "Stable energy supports consistent performance"}
Action: ${energyTrend.average < 6 ? "Audit your recovery practices" : "Maintain current approach"}

**Insight 2: Win Patterns**
Category: Strength
Observation: Wins cluster around: ${topWins.slice(0, 3).join(", ")}
Implication: These represent your leverage areas
Action: Allocate more time to activities in these domains

**Insight 3: Friction Sources**
Category: Blind Spot
Observation: Recurring frictions involve: ${topFrictions.slice(0, 3).join(", ")}
Implication: Unresolved systemic issues
Action: Address root cause rather than symptoms`,
        },
      ],
    };
  }
}
