import { HfInference } from "@huggingface/inference";

interface PatternDetectionInput {
  checkIns: Array<{
    date: string;
    dayOfWeek: number;
    energy: number;
    win: string;
    friction: string;
    letGo: string;
    priority: string;
  }>;
  timeRange: "week" | "month" | "quarter" | "year";
}

interface EnergyPatternInput {
  dailyEnergies: Array<{
    date: string;
    dayOfWeek: number;
    hour?: number;
    energy: number;
    context?: string;
  }>;
}

interface ThemeInput {
  items: string[];
  source: "wins" | "frictions" | "priorities" | "reflections";
}

interface BlindSpotInput {
  statedPriorities: string[];
  actualTimeSpent: Record<string, number>;
  goalsSet: string[];
  goalsAchieved: string[];
  frequentFrictions: string[];
}

export class PatternAgent {
  private hf: HfInference;
  private model = "meta-llama/Llama-3.3-70B-Instruct";

  constructor() {
    this.hf = new HfInference(process.env.HF_TOKEN);
  }

  async detectPatterns(input: PatternDetectionInput) {
    // Day of week analysis
    const dayPatterns = this.analyzeDayPatterns(input.checkIns);

    // Energy patterns
    const energyPatterns = this.analyzeEnergyPatterns(input.checkIns);

    // Word frequency in wins vs frictions
    const winThemes = this.extractThemes(input.checkIns.map((c) => c.win));
    const frictionThemes = this.extractThemes(
      input.checkIns.map((c) => c.friction)
    );

    const prompt = `
You are an analytical AI helping a CEO understand patterns in their behavior.

Data from ${input.checkIns.length} check-ins over ${input.timeRange}:

**Day of Week Patterns:**
${Object.entries(dayPatterns)
  .map(([day, data]) => `- ${day}: avg energy ${data.avgEnergy.toFixed(1)}, ${data.count} entries`)
  .join("\n")}

**Energy Analysis:**
- Overall average: ${energyPatterns.average.toFixed(1)}/10
- Best days: ${energyPatterns.bestDays.join(", ")}
- Worst days: ${energyPatterns.worstDays.join(", ")}
- Trend: ${energyPatterns.trend}

**Win Themes:** ${winThemes.join(", ")}
**Friction Themes:** ${frictionThemes.join(", ")}

Identify 3-4 actionable patterns:

For each pattern:
1. **Pattern Name** (2-3 words)
2. **Evidence** (what the data shows)
3. **Hypothesis** (why this might be happening)
4. **Action** (what to do about it)

Be specific and data-driven. Under 250 words.`;

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
      return this.generatePatternsLocal(dayPatterns, energyPatterns, winThemes, frictionThemes);
    }
  }

  async analyzeEnergyPatterns(input: EnergyPatternInput) {
    const patterns = this.computeEnergyPatterns(input.dailyEnergies);

    return {
      content: [
        {
          type: "text",
          text: `## Energy Pattern Analysis

**Overall Statistics:**
- Average: ${patterns.average.toFixed(1)}/10
- Range: ${patterns.min} to ${patterns.max}
- Volatility: ${patterns.volatility}

**Day of Week:**
${patterns.byDayOfWeek
  .map((d) => `- ${d.day}: ${d.average.toFixed(1)}/10 (${d.trend})`)
  .join("\n")}

**Best Performing Days:** ${patterns.bestDays.join(", ")}
**Worst Performing Days:** ${patterns.worstDays.join(", ")}

**Trend:** ${patterns.overallTrend}

**Recommendations:**
${patterns.recommendations.map((r) => `- ${r}`).join("\n")}`,
        },
      ],
    };
  }

  async findRecurringThemes(input: ThemeInput) {
    const themes = this.extractThemes(input.items);
    const ngrams = this.extractNgrams(input.items, 2);

    return {
      content: [
        {
          type: "text",
          text: `## Recurring Themes in ${input.source}

**Top Single-Word Themes:**
${themes.slice(0, 10).map((t, i) => `${i + 1}. ${t}`).join("\n")}

**Top Phrase Patterns:**
${ngrams.slice(0, 5).map((n, i) => `${i + 1}. "${n}"`).join("\n")}

**Insight:**
The recurring presence of "${themes[0]}" and "${themes[1]}" suggests these are central to your experience. Consider whether these represent:
- Strengths to leverage
- Challenges to address
- Patterns to interrupt`,
        },
      ],
    };
  }

  async identifyBlindSpots(input: BlindSpotInput) {
    // Calculate alignment gaps
    const priorityTimeGaps = this.calculatePriorityGaps(
      input.statedPriorities,
      input.actualTimeSpent
    );

    // Goal achievement patterns
    const goalPatterns = this.analyzeGoalPatterns(
      input.goalsSet,
      input.goalsAchieved
    );

    // Friction analysis
    const persistentFrictions = input.frequentFrictions.slice(0, 3);

    const prompt = `
Analyze potential blind spots for a CEO:

**Priority vs Time Gap:**
${priorityTimeGaps.map((g) => `- "${g.priority}": stated importance high, actual time ${g.timeSpent}%`).join("\n")}

**Goal Patterns:**
- Set: ${input.goalsSet.length}
- Achieved: ${input.goalsAchieved.length}
- Pattern: ${goalPatterns.pattern}
- Recurring unachieved themes: ${goalPatterns.recurringUnachieved.join(", ")}

**Persistent Frictions:**
${persistentFrictions.map((f) => `- ${f}`).join("\n")}

Identify 2-3 potential blind spots:

For each:
1. **Blind Spot** (name it directly)
2. **Evidence** (what suggests this)
3. **Cost** (what it might be costing them)
4. **Question** (to prompt self-reflection)

Be direct but compassionate. Under 200 words.`;

    try {
      const response = await this.hf.textGeneration({
        model: this.model,
        inputs: prompt,
        parameters: {
          max_new_tokens: 400,
          temperature: 0.7,
        },
      });

      return {
        content: [{ type: "text", text: response.generated_text }],
      };
    } catch (error) {
      return this.generateBlindSpotsLocal(priorityTimeGaps, goalPatterns, persistentFrictions);
    }
  }

  // Helper methods
  private analyzeDayPatterns(
    checkIns: Array<{ dayOfWeek: number; energy: number }>
  ) {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const dayData: Record<string, { total: number; count: number; avgEnergy: number }> = {};

    days.forEach((day) => {
      dayData[day] = { total: 0, count: 0, avgEnergy: 0 };
    });

    checkIns.forEach((c) => {
      const day = days[c.dayOfWeek];
      dayData[day].total += c.energy;
      dayData[day].count += 1;
    });

    Object.keys(dayData).forEach((day) => {
      if (dayData[day].count > 0) {
        dayData[day].avgEnergy = dayData[day].total / dayData[day].count;
      }
    });

    return dayData;
  }

  private analyzeEnergyPatterns(checkIns: Array<{ energy: number; date: string }>) {
    const energies = checkIns.map((c) => c.energy);
    const average = energies.reduce((a, b) => a + b, 0) / energies.length;

    // Find best and worst days
    const sorted = [...checkIns].sort((a, b) => b.energy - a.energy);
    const bestDays = sorted.slice(0, 3).map((c) => c.date);
    const worstDays = sorted.slice(-3).map((c) => c.date);

    // Determine trend
    const firstHalf = energies.slice(0, Math.floor(energies.length / 2));
    const secondHalf = energies.slice(Math.floor(energies.length / 2));
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

    let trend: string;
    if (secondAvg > firstAvg + 0.5) trend = "improving";
    else if (secondAvg < firstAvg - 0.5) trend = "declining";
    else trend = "stable";

    return { average, bestDays, worstDays, trend };
  }

  private extractThemes(items: string[]): string[] {
    const wordCounts: Record<string, number> = {};
    const stopWords = new Set([
      "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
      "of", "with", "by", "i", "my", "was", "is", "are", "been", "have",
      "had", "it", "this", "that", "about", "from", "some", "very", "just",
      "more", "also", "than", "then", "when", "which", "what", "where",
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
      .slice(0, 10)
      .map(([word]) => word);
  }

  private extractNgrams(items: string[], n: number): string[] {
    const ngramCounts: Record<string, number> = {};

    items.forEach((item) => {
      const words = item.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
      for (let i = 0; i <= words.length - n; i++) {
        const ngram = words.slice(i, i + n).join(" ");
        ngramCounts[ngram] = (ngramCounts[ngram] || 0) + 1;
      }
    });

    return Object.entries(ngramCounts)
      .filter(([, count]) => count > 1)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([ngram]) => ngram);
  }

  private computeEnergyPatterns(energies: EnergyPatternInput["dailyEnergies"]) {
    const values = energies.map((e) => e.energy);
    const average = values.reduce((a, b) => a + b, 0) / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);

    // Standard deviation for volatility
    const squaredDiffs = values.map((v) => Math.pow(v - average, 2));
    const stdDev = Math.sqrt(
      squaredDiffs.reduce((a, b) => a + b, 0) / values.length
    );

    let volatility: string;
    if (stdDev < 1) volatility = "very stable";
    else if (stdDev < 1.5) volatility = "stable";
    else if (stdDev < 2.5) volatility = "moderate";
    else volatility = "high";

    // By day of week
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const byDay = days.map((day, index) => {
      const dayEnergies = energies.filter((e) => e.dayOfWeek === index);
      const avg =
        dayEnergies.length > 0
          ? dayEnergies.reduce((a, b) => a + b.energy, 0) / dayEnergies.length
          : 0;
      return {
        day,
        average: avg,
        trend: avg > average ? "above average" : "below average",
      };
    });

    const sortedDays = [...byDay].sort((a, b) => b.average - a.average);
    const bestDays = sortedDays.slice(0, 2).map((d) => d.day);
    const worstDays = sortedDays.slice(-2).map((d) => d.day);

    // Overall trend
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

    let overallTrend: string;
    if (secondAvg > firstAvg + 0.5) overallTrend = "Improving over time";
    else if (secondAvg < firstAvg - 0.5) overallTrend = "Declining - needs attention";
    else overallTrend = "Stable";

    const recommendations: string[] = [];
    if (average < 6) recommendations.push("Focus on recovery and energy restoration");
    if (volatility === "high") recommendations.push("Investigate sources of energy volatility");
    if (worstDays.includes("Mon")) recommendations.push("Consider adjusting Monday routines");
    if (bestDays.includes("Sat") || bestDays.includes("Sun"))
      recommendations.push("Your weekend energy is highest - consider what makes weekdays different");

    return {
      average,
      min,
      max,
      volatility,
      byDayOfWeek: byDay,
      bestDays,
      worstDays,
      overallTrend,
      recommendations,
    };
  }

  private calculatePriorityGaps(
    priorities: string[],
    timeSpent: Record<string, number>
  ) {
    return priorities.map((p) => ({
      priority: p,
      timeSpent: timeSpent[p] || 0,
      gap: 100 - (timeSpent[p] || 0),
    }));
  }

  private analyzeGoalPatterns(goalsSet: string[], goalsAchieved: string[]) {
    const rate = goalsAchieved.length / goalsSet.length;
    const unachieved = goalsSet.filter((g) => !goalsAchieved.includes(g));

    return {
      pattern: rate > 0.7 ? "High achiever" : rate > 0.4 ? "Selective achiever" : "Ambitious setter",
      recurringUnachieved: unachieved.slice(0, 3),
    };
  }

  private generatePatternsLocal(
    dayPatterns: any,
    energyPatterns: any,
    winThemes: string[],
    frictionThemes: string[]
  ) {
    return {
      content: [
        {
          type: "text",
          text: `## Detected Patterns

**Pattern 1: Energy Cycle**
Evidence: Average ${energyPatterns.average.toFixed(1)}/10, ${energyPatterns.trend} trend
Hypothesis: Your energy follows a predictable rhythm influenced by day of week
Action: Schedule high-stakes work on ${energyPatterns.bestDays[0]}, recovery on ${energyPatterns.worstDays[0]}

**Pattern 2: Win Themes**
Evidence: Common themes in wins: ${winThemes.slice(0, 3).join(", ")}
Hypothesis: These represent your natural strengths and leverage points
Action: Allocate more time to activities involving these themes

**Pattern 3: Friction Sources**
Evidence: Recurring frictions: ${frictionThemes.slice(0, 3).join(", ")}
Hypothesis: These may be systemic issues rather than one-off problems
Action: Address root causes rather than managing symptoms repeatedly`,
        },
      ],
    };
  }

  private generateBlindSpotsLocal(
    priorityGaps: any[],
    goalPatterns: any,
    frictions: string[]
  ) {
    return {
      content: [
        {
          type: "text",
          text: `## Potential Blind Spots

**Blind Spot 1: Priority-Action Gap**
Evidence: Your stated priorities don't fully match where time goes
Cost: Energy spent on lower-priority work, important goals drift
Question: What would change if you audited one week's calendar against your stated priorities?

**Blind Spot 2: Recurring Goal Patterns**
Evidence: ${goalPatterns.pattern} pattern - some goal types consistently unachieved
Cost: Accumulated intention debt creates background stress
Question: Are these unachieved goals truly wanted, or should they be released?

**Blind Spot 3: Persistent Frictions**
Evidence: Same friction themes appear repeatedly: ${frictions.join(", ")}
Cost: Energy drain from fighting the same battles
Question: What systemic change would make these frictions disappear?`,
        },
      ],
    };
  }
}
