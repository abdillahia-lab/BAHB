import { HfInference } from "@huggingface/inference";

interface DailyCheckInInput {
  energyLevel: number;
  meaningfulWin: string;
  frictionPoint: string;
  thingToLetGo: string;
  tomorrowPriority: string;
  previousCheckIns?: Array<{
    date: string;
    energyLevel: number;
    win: string;
  }>;
}

interface WeeklyReflectionInput {
  movedTheNeedle: string[];
  wasNoise: string[];
  timeLeaks: string[];
  strategicInsight: string;
  dailyEnergies: number[];
}

interface CoachingQuestionInput {
  question: string;
  context?: string;
  currentChallenges?: string[];
}

interface EnergyAdviceInput {
  currentEnergy: number;
  recentPattern: number[];
  upcomingPriorities: string[];
}

export class CoachingAgent {
  private hf: HfInference;
  private model = "Qwen/Qwen2.5-72B-Instruct"; // Top reasoning model

  constructor() {
    this.hf = new HfInference(process.env.HF_TOKEN);
  }

  private readonly systemPrompt = `You are an executive coach for a CEO. Your style is:
- Calm, direct, and insightful
- No hustle culture or toxic positivity
- Psychologically safe but honest
- Focus on clarity over complexity
- Ask powerful questions rather than giving easy answers
- Reference patterns and data when available
- Keep responses concise and actionable`;

  async processDailyCheckIn(input: DailyCheckInInput) {
    const prompt = `
${this.systemPrompt}

A CEO just completed their daily check-in:

Energy Level: ${input.energyLevel}/10
Meaningful Win: "${input.meaningfulWin}"
Friction Point: "${input.frictionPoint}"
Letting Go Of: "${input.thingToLetGo}"
Tomorrow's Priority: "${input.tomorrowPriority}"

${input.previousCheckIns ? `Recent energy trend: ${input.previousCheckIns.map(c => c.energyLevel).join(", ")}` : ""}

Provide coaching feedback in this format:
1. **Acknowledgment** (one sentence on the win)
2. **Insight** (one observation about the friction/letting go connection)
3. **Energy Note** (brief comment on energy level/trend)
4. **Tomorrow** (one question about their stated priority)

Keep total response under 120 words.`;

    try {
      const response = await this.hf.textGeneration({
        model: this.model,
        inputs: prompt,
        parameters: {
          max_new_tokens: 300,
          temperature: 0.7,
          top_p: 0.9,
        },
      });

      return {
        content: [{ type: "text", text: response.generated_text }],
      };
    } catch (error) {
      return this.generateLocalResponse("dailyCheckIn", input);
    }
  }

  async processWeeklyReflection(input: WeeklyReflectionInput) {
    const avgEnergy = input.dailyEnergies.reduce((a, b) => a + b, 0) / input.dailyEnergies.length;

    const prompt = `
${this.systemPrompt}

Weekly Review Summary:

What Moved the Needle:
${input.movedTheNeedle.map(i => `- ${i}`).join("\n")}

What Was Noise:
${input.wasNoise.map(i => `- ${i}`).join("\n")}

Time Leaks:
${input.timeLeaks.map(i => `- ${i}`).join("\n")}

Strategic Insight: "${input.strategicInsight}"

Energy Pattern: ${input.dailyEnergies.join(", ")} (avg: ${avgEnergy.toFixed(1)})

Provide a strategic analysis:
1. **Pattern Observed** - What do you notice?
2. **Leverage Point** - What to amplify next week?
3. **Elimination Target** - What should stop?
4. **The Real Question** - What might they be avoiding?

Keep response under 150 words. Be direct.`;

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
      return this.generateLocalResponse("weeklyReflection", input);
    }
  }

  async askCoachingQuestion(input: CoachingQuestionInput) {
    const prompt = `
${this.systemPrompt}

The CEO asks: "${input.question}"

${input.context ? `Context: ${input.context}` : ""}
${input.currentChallenges ? `Current challenges: ${input.currentChallenges.join(", ")}` : ""}

Respond as their executive coach. Don't give easy answers. Help them think clearly.
If appropriate, respond with a question that gets to the heart of the matter.

Keep response under 100 words.`;

    try {
      const response = await this.hf.textGeneration({
        model: this.model,
        inputs: prompt,
        parameters: {
          max_new_tokens: 250,
          temperature: 0.8,
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
            text: `That's a meaningful question. Before I share my perspective, let me ask: What does your gut already tell you about this? Often the answer we seek is one we already know but haven't given ourselves permission to act on.`,
          },
        ],
      };
    }
  }

  async getEnergyAdvice(input: EnergyAdviceInput) {
    const trend = this.calculateTrend(input.recentPattern);

    const prompt = `
${this.systemPrompt}

Energy Check:
- Current: ${input.currentEnergy}/10
- Recent pattern: ${input.recentPattern.join(", ")}
- Trend: ${trend}
- Upcoming: ${input.upcomingPriorities.join(", ")}

Provide energy management advice:
1. What the pattern suggests
2. One tactical adjustment for today
3. One strategic consideration for the week

Under 80 words. Practical focus.`;

    try {
      const response = await this.hf.textGeneration({
        model: this.model,
        inputs: prompt,
        parameters: {
          max_new_tokens: 200,
          temperature: 0.6,
        },
      });

      return {
        content: [{ type: "text", text: response.generated_text }],
      };
    } catch (error) {
      return this.generateEnergyAdviceLocal(input, trend);
    }
  }

  private calculateTrend(pattern: number[]): string {
    if (pattern.length < 2) return "insufficient data";
    const recent = pattern.slice(-3);
    const earlier = pattern.slice(0, 3);
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const earlierAvg = earlier.reduce((a, b) => a + b, 0) / earlier.length;

    if (recentAvg > earlierAvg + 0.5) return "improving";
    if (recentAvg < earlierAvg - 0.5) return "declining";
    return "stable";
  }

  private generateLocalResponse(type: string, input: any) {
    // Fallback responses when API is unavailable
    const responses: Record<string, string> = {
      dailyCheckIn: `Your energy at ${input.energyLevel}/10 is noted. The win you described shows momentum. The friction you mentioned often connects to what you're trying to let go of—there may be a pattern worth exploring. For tomorrow, consider: Is your stated priority the most important thing, or the most urgent?`,
      weeklyReflection: `Looking at your week, I notice the gap between what moved the needle and what consumed your time. Your strategic insight suggests you already know what needs to change. The question isn't what to do—it's what's stopping you from doing it.`,
    };

    return {
      content: [{ type: "text", text: responses[type] || "Reflection noted." }],
    };
  }

  private generateEnergyAdviceLocal(input: EnergyAdviceInput, trend: string) {
    let advice = "";

    if (input.currentEnergy <= 4) {
      advice = `Your energy at ${input.currentEnergy}/10 signals a need for recovery, not productivity. Consider: What's the minimum viable output today? Protect tomorrow by not depleting further today.`;
    } else if (input.currentEnergy >= 8) {
      advice = `High energy (${input.currentEnergy}/10) is an asset—use it for your highest-leverage work. Don't waste peak state on administrative tasks.`;
    } else {
      advice = `Moderate energy (${input.currentEnergy}/10) with a ${trend} trend. Match task difficulty to energy. Save deep work for your next peak.`;
    }

    return {
      content: [{ type: "text", text: advice }],
    };
  }
}
