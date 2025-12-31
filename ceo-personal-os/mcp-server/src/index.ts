#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import { CoachingAgent } from "./agents/coaching-agent.js";
import { ReflectionAgent } from "./agents/reflection-agent.js";
import { PatternAgent } from "./agents/pattern-agent.js";
import { GoalAgent } from "./agents/goal-agent.js";
import { tools } from "./tools/index.js";
import { prompts } from "./prompts/index.js";

// Initialize agents
const coachingAgent = new CoachingAgent();
const reflectionAgent = new ReflectionAgent();
const patternAgent = new PatternAgent();
const goalAgent = new GoalAgent();

// Create MCP server
const server = new Server(
  {
    name: "ceo-productivity-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
      prompts: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      // Coaching Agent Tools
      case "coach_daily_checkin":
        return await coachingAgent.processDailyCheckIn(args as any);

      case "coach_weekly_reflection":
        return await coachingAgent.processWeeklyReflection(args as any);

      case "coach_ask_question":
        return await coachingAgent.askCoachingQuestion(args as any);

      case "coach_energy_advice":
        return await coachingAgent.getEnergyAdvice(args as any);

      // Reflection Agent Tools
      case "analyze_year":
        return await reflectionAgent.analyzeYear(args as any);

      case "generate_insights":
        return await reflectionAgent.generateInsights(args as any);

      case "summarize_period":
        return await reflectionAgent.summarizePeriod(args as any);

      // Pattern Agent Tools
      case "detect_patterns":
        return await patternAgent.detectPatterns(args as any);

      case "analyze_energy_patterns":
        return await patternAgent.analyzeEnergyPatterns(args as any);

      case "find_recurring_themes":
        return await patternAgent.findRecurringThemes(args as any);

      case "identify_blind_spots":
        return await patternAgent.identifyBlindSpots(args as any);

      // Goal Agent Tools
      case "evaluate_goal_alignment":
        return await goalAgent.evaluateAlignment(args as any);

      case "suggest_milestones":
        return await goalAgent.suggestMilestones(args as any);

      case "assess_progress":
        return await goalAgent.assessProgress(args as any);

      case "recommend_priorities":
        return await goalAgent.recommendPriorities(args as any);

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
        },
      ],
      isError: true,
    };
  }
});

// List available prompts
server.setRequestHandler(ListPromptsRequestSchema, async () => {
  return { prompts };
});

// Handle prompt requests
server.setRequestHandler(GetPromptRequestSchema, async (request) => {
  const prompt = prompts.find((p) => p.name === request.params.name);
  if (!prompt) {
    throw new Error(`Prompt not found: ${request.params.name}`);
  }

  // Generate prompt content based on arguments
  const args = request.params.arguments || {};
  let content = "";

  switch (prompt.name) {
    case "daily_coaching":
      content = generateDailyCoachingPrompt(args);
      break;
    case "weekly_review_guide":
      content = generateWeeklyReviewPrompt(args);
      break;
    case "quarterly_assessment":
      content = generateQuarterlyPrompt(args);
      break;
    case "annual_reflection":
      content = generateAnnualPrompt(args);
      break;
    case "goal_coaching":
      content = generateGoalCoachingPrompt(args);
      break;
    case "pattern_analysis":
      content = generatePatternAnalysisPrompt(args);
      break;
    default:
      content = `Prompt: ${prompt.name}`;
  }

  return {
    messages: [
      {
        role: "user",
        content: { type: "text", text: content },
      },
    ],
  };
});

// Prompt generators
function generateDailyCoachingPrompt(args: Record<string, string>): string {
  return `
You are a calm, insightful executive coach helping a CEO with their daily reflection.

Current energy level: ${args.energy || "Not specified"}
Today's win: ${args.win || "Not specified"}
Friction point: ${args.friction || "Not specified"}

Provide brief, actionable coaching feedback. Be direct but supportive. No hustle culture, no toxic positivity. Focus on:
1. Acknowledging what went well
2. One insight about the friction
3. One question to consider for tomorrow

Keep your response under 150 words.
`;
}

function generateWeeklyReviewPrompt(args: Record<string, string>): string {
  return `
You are an executive coach helping analyze a CEO's week.

What moved the needle: ${args.wins || "Not specified"}
What was noise: ${args.noise || "Not specified"}
Time leaks: ${args.leaks || "Not specified"}
Average energy: ${args.energy || "Not specified"}

Provide a strategic analysis:
1. Pattern you notice
2. One thing to amplify next week
3. One thing to eliminate
4. A question for reflection

Be concise and actionable. Executive-level insight only.
`;
}

function generateQuarterlyPrompt(args: Record<string, string>): string {
  return `
Conduct a quarterly review analysis for a CEO.

Goals progress: ${args.goals || "Not specified"}
Life map scores: ${args.lifeMap || "Not specified"}
Key highlights: ${args.highlights || "Not specified"}
Key lowlights: ${args.lowlights || "Not specified"}

Provide:
1. Overall quarter assessment
2. Alignment analysis (where actions match/don't match stated priorities)
3. Energy vs output analysis
4. Top 3 recommendations for next quarter
5. One hard question they might be avoiding

Be direct, strategic, and insight-focused.
`;
}

function generateAnnualPrompt(args: Record<string, string>): string {
  return `
Guide an annual life review for a CEO.

Year narrative: ${args.narrative || "Not specified"}
Major achievements: ${args.achievements || "Not specified"}
Major lessons: ${args.lessons || "Not specified"}
Life map evolution: ${args.lifeMapChange || "Not specified"}

Provide:
1. Year theme/narrative summary
2. Pattern analysis across the year
3. Strengths that emerged
4. Growth edges revealed
5. One key insight for the year ahead
6. The "10-year repeat test" - if this year repeated 10 times, would they be satisfied?

Be thoughtful, synthesizing, and forward-looking.
`;
}

function generateGoalCoachingPrompt(args: Record<string, string>): string {
  return `
Coach on goal alignment and progress.

Current goals: ${args.goals || "Not specified"}
North star: ${args.northStar || "Not specified"}
Recent progress: ${args.progress || "Not specified"}

Analyze:
1. Goal-North Star alignment
2. Progress assessment
3. Potential obstacles
4. Recommended focus for next period
5. One goal they might need to let go of

Be strategic and honest. Challenge assumptions where appropriate.
`;
}

function generatePatternAnalysisPrompt(args: Record<string, string>): string {
  return `
Analyze patterns from accumulated reflections.

Check-in history: ${args.checkIns || "Not specified"}
Review history: ${args.reviews || "Not specified"}
Goal history: ${args.goals || "Not specified"}

Identify:
1. Recurring energy patterns
2. Consistent friction sources
3. Repeated goal themes (achieved and not)
4. Blind spots suggested by the data
5. Strengths that appear consistently
6. Areas of potential self-deception

Be analytical and evidence-based. Reference specific patterns.
`;
}

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("CEO Productivity MCP Server running on stdio");
}

main().catch(console.error);
