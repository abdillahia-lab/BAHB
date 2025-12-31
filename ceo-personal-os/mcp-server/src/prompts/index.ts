import { Prompt } from "@modelcontextprotocol/sdk/types.js";

export const prompts: Prompt[] = [
  {
    name: "daily_coaching",
    description: "Get personalized coaching based on your daily check-in",
    arguments: [
      {
        name: "energy",
        description: "Your energy level (1-10)",
        required: true,
      },
      {
        name: "win",
        description: "Your meaningful win today",
        required: true,
      },
      {
        name: "friction",
        description: "Your friction point today",
        required: true,
      },
    ],
  },
  {
    name: "weekly_review_guide",
    description: "Guided weekly review with AI insights",
    arguments: [
      {
        name: "wins",
        description: "What moved the needle this week",
        required: true,
      },
      {
        name: "noise",
        description: "What was noise this week",
        required: true,
      },
      {
        name: "leaks",
        description: "Where time leaked",
        required: false,
      },
      {
        name: "energy",
        description: "Average energy this week",
        required: false,
      },
    ],
  },
  {
    name: "quarterly_assessment",
    description: "Comprehensive quarterly goal and life assessment",
    arguments: [
      {
        name: "goals",
        description: "Goal progress summary",
        required: true,
      },
      {
        name: "lifeMap",
        description: "Life map scores (JSON)",
        required: true,
      },
      {
        name: "highlights",
        description: "Quarter highlights",
        required: false,
      },
      {
        name: "lowlights",
        description: "Quarter lowlights",
        required: false,
      },
    ],
  },
  {
    name: "annual_reflection",
    description: "Deep annual reflection and year-ahead planning",
    arguments: [
      {
        name: "narrative",
        description: "Year narrative summary",
        required: true,
      },
      {
        name: "achievements",
        description: "Key achievements",
        required: true,
      },
      {
        name: "lessons",
        description: "Key lessons learned",
        required: true,
      },
      {
        name: "lifeMapChange",
        description: "How life map changed over the year",
        required: false,
      },
    ],
  },
  {
    name: "goal_coaching",
    description: "Strategic coaching on goals and alignment",
    arguments: [
      {
        name: "goals",
        description: "Current goals summary",
        required: true,
      },
      {
        name: "northStar",
        description: "North Star summary",
        required: true,
      },
      {
        name: "progress",
        description: "Recent progress notes",
        required: false,
      },
    ],
  },
  {
    name: "pattern_analysis",
    description: "Analyze patterns from your accumulated data",
    arguments: [
      {
        name: "checkIns",
        description: "Check-in summary or count",
        required: true,
      },
      {
        name: "reviews",
        description: "Review summary",
        required: false,
      },
      {
        name: "goals",
        description: "Goal history summary",
        required: false,
      },
    ],
  },
  {
    name: "energy_optimization",
    description: "Get advice on optimizing your energy",
    arguments: [
      {
        name: "current",
        description: "Current energy level",
        required: true,
      },
      {
        name: "pattern",
        description: "Recent energy pattern (e.g., '7,6,5,6,8,7,5')",
        required: true,
      },
      {
        name: "schedule",
        description: "Upcoming schedule/priorities",
        required: false,
      },
    ],
  },
  {
    name: "decision_support",
    description: "Help thinking through a decision",
    arguments: [
      {
        name: "decision",
        description: "The decision you're facing",
        required: true,
      },
      {
        name: "options",
        description: "Options you're considering",
        required: false,
      },
      {
        name: "stakes",
        description: "What's at stake",
        required: false,
      },
      {
        name: "northStar",
        description: "Your North Star for reference",
        required: false,
      },
    ],
  },
  {
    name: "regret_minimization",
    description: "Apply the regret minimization framework to a decision",
    arguments: [
      {
        name: "decision",
        description: "The decision you're considering",
        required: true,
      },
      {
        name: "age",
        description: "Your current age",
        required: false,
      },
    ],
  },
  {
    name: "blind_spot_check",
    description: "Check for potential blind spots in your thinking",
    arguments: [
      {
        name: "topic",
        description: "Topic or area to examine",
        required: true,
      },
      {
        name: "currentThinking",
        description: "Your current thinking/assumptions",
        required: true,
      },
    ],
  },
];
