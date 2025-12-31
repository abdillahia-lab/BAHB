import { HfInference } from "@huggingface/inference";

interface AlignmentInput {
  goals: Array<{
    title: string;
    category: string;
    timeframe: string;
    progress: number;
  }>;
  northStar: {
    greatLife: string;
    optimizingFor: string;
    wouldRegret: string;
    unwillingToSacrifice: string;
  };
  lifeMapScores: Record<string, number>;
}

interface MilestoneInput {
  goal: {
    title: string;
    description: string;
    timeframe: string;
    category: string;
  };
  currentProgress: number;
  context?: string;
}

interface ProgressInput {
  goals: Array<{
    title: string;
    progress: number;
    startDate: string;
    targetDate: string;
    milestones: Array<{ title: string; completed: boolean }>;
  }>;
}

interface PriorityInput {
  goals: Array<{
    title: string;
    category: string;
    progress: number;
    importance: number;
    effort: number;
  }>;
  currentFocus: string[];
  energyLevel: number;
  availableHours: number;
}

export class GoalAgent {
  private hf: HfInference;
  private model = "Qwen/Qwen2.5-72B-Instruct";

  constructor() {
    this.hf = new HfInference(process.env.HF_TOKEN);
  }

  async evaluateAlignment(input: AlignmentInput) {
    // Calculate alignment scores
    const alignmentAnalysis = this.analyzeGoalAlignment(input);

    const prompt = `
You are a strategic advisor helping a CEO evaluate goal alignment.

**North Star:**
- Great life vision: "${input.northStar.greatLife}"
- Currently optimizing for: "${input.northStar.optimizingFor}"
- Would regret not: "${input.northStar.wouldRegret}"
- Won't sacrifice: "${input.northStar.unwillingToSacrifice}"

**Current Goals:**
${input.goals.map((g) => `- ${g.title} (${g.category}, ${g.timeframe}): ${g.progress}%`).join("\n")}

**Life Map Scores:**
${Object.entries(input.lifeMapScores).map(([k, v]) => `- ${k}: ${v}/10`).join("\n")}

Analyze alignment:

1. **Alignment Score:** Rate overall alignment 1-10
2. **Well-Aligned Goals:** Which goals directly serve the North Star?
3. **Misaligned Goals:** Which goals might be distractions?
4. **Missing Goals:** What's in the North Star but not in goals?
5. **Sacrifice Risk:** Do any goals threaten the "won't sacrifice" items?
6. **Life Map Gap:** Which low-scoring life areas lack supporting goals?
7. **Recommendation:** One primary adjustment to improve alignment

Be direct and strategic. Under 250 words.`;

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
      return this.generateAlignmentLocal(input, alignmentAnalysis);
    }
  }

  async suggestMilestones(input: MilestoneInput) {
    const timeLeft = this.calculateTimeRemaining(input.goal.timeframe);
    const progressNeeded = 100 - input.currentProgress;

    const prompt = `
Help a CEO break down a goal into milestones.

**Goal:** ${input.goal.title}
**Description:** ${input.goal.description}
**Category:** ${input.goal.category}
**Timeframe:** ${input.goal.timeframe}
**Current Progress:** ${input.currentProgress}%
**Time Remaining:** ~${timeLeft} months
${input.context ? `**Context:** ${input.context}` : ""}

Suggest 4-6 milestones:

For each milestone:
- **Title** (action-oriented, 3-7 words)
- **Target** (specific, measurable outcome)
- **Timing** (relative to goal end)
- **Dependencies** (what needs to happen first)

Make milestones:
- Progressively challenging
- Clearly measurable
- Actionable this week
- Building toward the end goal

End with one "quick win" they could complete this week.`;

    try {
      const response = await this.hf.textGeneration({
        model: this.model,
        inputs: prompt,
        parameters: {
          max_new_tokens: 500,
          temperature: 0.7,
        },
      });

      return {
        content: [{ type: "text", text: response.generated_text }],
      };
    } catch (error) {
      return this.generateMilestonesLocal(input, timeLeft, progressNeeded);
    }
  }

  async assessProgress(input: ProgressInput) {
    const assessments = input.goals.map((g) => this.assessSingleGoal(g));

    return {
      content: [
        {
          type: "text",
          text: `## Goal Progress Assessment

${assessments
  .map(
    (a) => `### ${a.title}
**Status:** ${a.status}
**Progress:** ${a.progress}% (${a.onTrack ? "On track" : "Behind schedule"})
**Pace Required:** ${a.requiredPace}
**Milestones:** ${a.milestonesCompleted}/${a.milestonesTotal} complete
**Risk Level:** ${a.riskLevel}
**Recommendation:** ${a.recommendation}
`
  )
  .join("\n")}

## Summary
- **On Track:** ${assessments.filter((a) => a.onTrack).length}/${assessments.length} goals
- **At Risk:** ${assessments.filter((a) => a.riskLevel === "High").length} goals
- **Top Priority:** ${assessments.sort((a, b) => (a.onTrack ? 1 : 0) - (b.onTrack ? 1 : 0))[0]?.title || "None"}`,
        },
      ],
    };
  }

  async recommendPriorities(input: PriorityInput) {
    // Calculate priority scores using Eisenhower + Leverage matrix
    const prioritized = this.calculatePriorities(input);

    const prompt = `
Help a CEO prioritize their goals.

**Current State:**
- Energy Level: ${input.energyLevel}/10
- Available Hours/Week: ${input.availableHours}
- Current Focus: ${input.currentFocus.join(", ")}

**Goals (scored by importance × inverse-effort = leverage):**
${prioritized.map((p) => `- ${p.title}: Importance ${p.importance}/10, Effort ${p.effort}/10, Leverage ${p.leverage.toFixed(1)}`).join("\n")}

Recommend:

1. **This Week's Focus** (1-2 goals for deep work)
2. **Maintenance Mode** (goals to maintain but not push)
3. **Pause Candidates** (goals to temporarily deprioritize)
4. **Quick Wins** (high-leverage, low-effort actions)
5. **Energy Match** (given current energy, which goals to prioritize)

Be decisive. CEOs need clarity, not options.`;

    try {
      const response = await this.hf.textGeneration({
        model: this.model,
        inputs: prompt,
        parameters: {
          max_new_tokens: 400,
          temperature: 0.6,
        },
      });

      return {
        content: [{ type: "text", text: response.generated_text }],
      };
    } catch (error) {
      return this.generatePrioritiesLocal(input, prioritized);
    }
  }

  // Helper methods
  private analyzeGoalAlignment(input: AlignmentInput) {
    const categoryDistribution: Record<string, number> = {};
    input.goals.forEach((g) => {
      categoryDistribution[g.category] = (categoryDistribution[g.category] || 0) + 1;
    });

    // Check life map coverage
    const lifeMapCategories = Object.entries(input.lifeMapScores)
      .filter(([, score]) => score < 6)
      .map(([category]) => category);

    const lowScoreCovered = lifeMapCategories.filter((cat) =>
      input.goals.some((g) => g.category.toLowerCase().includes(cat.toLowerCase()))
    );

    return {
      categoryDistribution,
      lowScoreCategories: lifeMapCategories,
      lowScoreCovered: lowScoreCovered.length,
      lowScoreGap: lifeMapCategories.length - lowScoreCovered.length,
    };
  }

  private calculateTimeRemaining(timeframe: string): number {
    switch (timeframe.toLowerCase()) {
      case "1 year":
        return 12;
      case "3 years":
        return 36;
      case "10 years":
        return 120;
      default:
        return 12;
    }
  }

  private assessSingleGoal(goal: {
    title: string;
    progress: number;
    startDate: string;
    targetDate: string;
    milestones: Array<{ title: string; completed: boolean }>;
  }) {
    const start = new Date(goal.startDate);
    const target = new Date(goal.targetDate);
    const now = new Date();

    const totalDays = (target.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    const elapsedDays = (now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    const expectedProgress = Math.min(100, (elapsedDays / totalDays) * 100);

    const onTrack = goal.progress >= expectedProgress - 10;
    const milestonesCompleted = goal.milestones.filter((m) => m.completed).length;

    let status: string;
    if (goal.progress >= 90) status = "Nearly Complete";
    else if (goal.progress >= 70) status = "Strong Progress";
    else if (goal.progress >= 50) status = "Moderate Progress";
    else if (goal.progress >= 25) status = "Early Stage";
    else status = "Just Started";

    let riskLevel: string;
    if (onTrack && goal.progress > 50) riskLevel = "Low";
    else if (onTrack || goal.progress > 30) riskLevel = "Medium";
    else riskLevel = "High";

    const remainingProgress = 100 - goal.progress;
    const remainingDays = Math.max(1, (target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const requiredPace = `${(remainingProgress / (remainingDays / 30)).toFixed(1)}% per month`;

    let recommendation: string;
    if (riskLevel === "High") {
      recommendation = "Requires immediate attention or scope reduction";
    } else if (riskLevel === "Medium") {
      recommendation = "Increase focus or adjust timeline";
    } else {
      recommendation = "Maintain current pace";
    }

    return {
      title: goal.title,
      status,
      progress: goal.progress,
      expectedProgress: Math.round(expectedProgress),
      onTrack,
      milestonesCompleted,
      milestonesTotal: goal.milestones.length,
      riskLevel,
      requiredPace,
      recommendation,
    };
  }

  private calculatePriorities(input: PriorityInput) {
    return input.goals
      .map((g) => ({
        ...g,
        leverage: (g.importance * (11 - g.effort)) / 10, // Higher is better
      }))
      .sort((a, b) => b.leverage - a.leverage);
  }

  private generateAlignmentLocal(input: AlignmentInput, analysis: any) {
    const lowestLifeMap = Object.entries(input.lifeMapScores).sort(
      ([, a], [, b]) => a - b
    )[0];

    return {
      content: [
        {
          type: "text",
          text: `## Goal Alignment Analysis

**Alignment Score:** ${analysis.lowScoreGap === 0 ? "8/10" : analysis.lowScoreGap === 1 ? "6/10" : "4/10"}

**Well-Aligned Goals:**
${input.goals.filter((g) => g.progress > 30).map((g) => `- ${g.title}`).join("\n") || "- None clearly advancing"}

**Potential Misalignment:**
Your North Star mentions optimizing for "${input.northStar.optimizingFor}" but goal distribution suggests different priorities.

**Missing Goals:**
${lowestLifeMap[0]} scores ${lowestLifeMap[1]}/10 in your Life Map but lacks supporting goals.

**Sacrifice Risk:**
Review if any current goals threaten: "${input.northStar.unwillingToSacrifice}"

**Recommendation:**
Add one goal supporting your ${lowestLifeMap[0]} domain, or reduce a goal that doesn't serve "${input.northStar.wouldRegret}"`,
        },
      ],
    };
  }

  private generateMilestonesLocal(input: MilestoneInput, timeLeft: number, progressNeeded: number) {
    const monthlyProgress = progressNeeded / timeLeft;

    return {
      content: [
        {
          type: "text",
          text: `## Suggested Milestones for: ${input.goal.title}

**Required Pace:** ${monthlyProgress.toFixed(1)}% progress per month

### Milestone 1: Foundation
- **Title:** Define success criteria and baseline
- **Target:** Clear metrics established
- **Timing:** Week 1-2
- **Dependencies:** None

### Milestone 2: First Win
- **Title:** Achieve first measurable progress
- **Target:** 10% of remaining goal
- **Timing:** Month 1
- **Dependencies:** Milestone 1

### Milestone 3: Momentum
- **Title:** Establish consistent progress rhythm
- **Target:** 30% of remaining goal
- **Timing:** 25% through timeframe
- **Dependencies:** Milestone 2

### Milestone 4: Midpoint Check
- **Title:** Assess and adjust approach
- **Target:** 50% of remaining goal
- **Timing:** Midpoint
- **Dependencies:** Milestone 3

### Milestone 5: Final Push
- **Title:** Complete remaining work
- **Target:** 100% of goal
- **Timing:** Final month
- **Dependencies:** Milestone 4

**Quick Win This Week:**
Break down Milestone 1 into three specific tasks and complete the first one today.`,
        },
      ],
    };
  }

  private generatePrioritiesLocal(input: PriorityInput, prioritized: any[]) {
    const topLeverage = prioritized.slice(0, 2);
    const lowLeverage = prioritized.slice(-2);

    return {
      content: [
        {
          type: "text",
          text: `## Priority Recommendations

**This Week's Focus:**
${topLeverage.map((g) => `- ${g.title} (Leverage: ${g.leverage.toFixed(1)})`).join("\n")}

**Maintenance Mode:**
${prioritized.slice(2, 4).map((g) => `- ${g.title}`).join("\n")}

**Pause Candidates:**
${lowLeverage.map((g) => `- ${g.title} (Low leverage: ${g.leverage.toFixed(1)})`).join("\n")}

**Energy Match:**
At ${input.energyLevel}/10 energy, focus on ${input.energyLevel >= 7 ? "high-complexity creative work" : input.energyLevel >= 5 ? "structured execution tasks" : "administrative and low-stakes items"}.

**With ${input.availableHours} Hours Available:**
Allocate ~${Math.round(input.availableHours * 0.6)} hours to top priorities, ~${Math.round(input.availableHours * 0.3)} hours to maintenance, reserve ${Math.round(input.availableHours * 0.1)} hours for unexpected.`,
        },
      ],
    };
  }
}
