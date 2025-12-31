import { Tool } from "@modelcontextprotocol/sdk/types.js";

export const tools: Tool[] = [
  // Coaching Agent Tools
  {
    name: "coach_daily_checkin",
    description: "Process a daily check-in and provide coaching feedback on energy, wins, frictions, and priorities",
    inputSchema: {
      type: "object",
      properties: {
        energyLevel: {
          type: "number",
          description: "Energy level from 1-10",
          minimum: 1,
          maximum: 10,
        },
        meaningfulWin: {
          type: "string",
          description: "One meaningful win or progress from today",
        },
        frictionPoint: {
          type: "string",
          description: "One friction point or challenge faced",
        },
        thingToLetGo: {
          type: "string",
          description: "One thing to release or let go of",
        },
        tomorrowPriority: {
          type: "string",
          description: "Top priority for tomorrow",
        },
        previousCheckIns: {
          type: "array",
          items: {
            type: "object",
            properties: {
              date: { type: "string" },
              energyLevel: { type: "number" },
              win: { type: "string" },
            },
          },
          description: "Previous check-ins for context (optional)",
        },
      },
      required: ["energyLevel", "meaningfulWin", "frictionPoint", "thingToLetGo", "tomorrowPriority"],
    },
  },
  {
    name: "coach_weekly_reflection",
    description: "Analyze a weekly review and provide strategic coaching insights",
    inputSchema: {
      type: "object",
      properties: {
        movedTheNeedle: {
          type: "array",
          items: { type: "string" },
          description: "Things that created real progress",
        },
        wasNoise: {
          type: "array",
          items: { type: "string" },
          description: "Activities that felt busy but didn't matter",
        },
        timeLeaks: {
          type: "array",
          items: { type: "string" },
          description: "Where time was lost unexpectedly",
        },
        strategicInsight: {
          type: "string",
          description: "Key insight from the week",
        },
        dailyEnergies: {
          type: "array",
          items: { type: "number" },
          description: "Energy levels for each day (7 values)",
        },
      },
      required: ["movedTheNeedle", "wasNoise", "strategicInsight", "dailyEnergies"],
    },
  },
  {
    name: "coach_ask_question",
    description: "Ask the AI coach a question and receive thoughtful guidance",
    inputSchema: {
      type: "object",
      properties: {
        question: {
          type: "string",
          description: "The question to ask the coach",
        },
        context: {
          type: "string",
          description: "Additional context (optional)",
        },
        currentChallenges: {
          type: "array",
          items: { type: "string" },
          description: "Current challenges for context (optional)",
        },
      },
      required: ["question"],
    },
  },
  {
    name: "coach_energy_advice",
    description: "Get personalized energy management advice based on patterns",
    inputSchema: {
      type: "object",
      properties: {
        currentEnergy: {
          type: "number",
          description: "Current energy level 1-10",
        },
        recentPattern: {
          type: "array",
          items: { type: "number" },
          description: "Recent energy levels (past 7-14 days)",
        },
        upcomingPriorities: {
          type: "array",
          items: { type: "string" },
          description: "Key priorities coming up",
        },
      },
      required: ["currentEnergy", "recentPattern"],
    },
  },

  // Reflection Agent Tools
  {
    name: "analyze_year",
    description: "Analyze an entire year's data and provide comprehensive insights",
    inputSchema: {
      type: "object",
      properties: {
        narrative: {
          type: "string",
          description: "Written narrative of the year",
        },
        highlights: {
          type: "array",
          items: { type: "string" },
          description: "Year's highlights",
        },
        lowlights: {
          type: "array",
          items: { type: "string" },
          description: "Year's lowlights",
        },
        goalsAchieved: {
          type: "array",
          items: { type: "string" },
          description: "Goals that were achieved",
        },
        goalsNotAchieved: {
          type: "array",
          items: { type: "string" },
          description: "Goals not achieved",
        },
        lifeMapScores: {
          type: "object",
          description: "Life map domain scores",
          properties: {
            career: { type: "number" },
            relationships: { type: "number" },
            health: { type: "number" },
            meaning: { type: "number" },
            finances: { type: "number" },
            fun: { type: "number" },
          },
        },
      },
      required: ["narrative", "highlights", "lowlights", "lifeMapScores"],
    },
  },
  {
    name: "generate_insights",
    description: "Generate insights from accumulated check-ins and reviews",
    inputSchema: {
      type: "object",
      properties: {
        checkIns: {
          type: "array",
          items: {
            type: "object",
            properties: {
              date: { type: "string" },
              energy: { type: "number" },
              win: { type: "string" },
              friction: { type: "string" },
            },
          },
        },
        reviews: {
          type: "array",
          items: {
            type: "object",
            properties: {
              type: { type: "string" },
              date: { type: "string" },
              keyInsight: { type: "string" },
            },
          },
        },
      },
      required: ["checkIns"],
    },
  },
  {
    name: "summarize_period",
    description: "Summarize a time period (week, month, quarter)",
    inputSchema: {
      type: "object",
      properties: {
        period: {
          type: "string",
          enum: ["week", "month", "quarter"],
        },
        data: {
          type: "object",
          properties: {
            checkIns: { type: "number" },
            avgEnergy: { type: "number" },
            topWins: { type: "array", items: { type: "string" } },
            topFrictions: { type: "array", items: { type: "string" } },
            goalsProgress: { type: "object" },
          },
        },
      },
      required: ["period", "data"],
    },
  },

  // Pattern Agent Tools
  {
    name: "detect_patterns",
    description: "Detect patterns in check-in data over time",
    inputSchema: {
      type: "object",
      properties: {
        checkIns: {
          type: "array",
          items: {
            type: "object",
            properties: {
              date: { type: "string" },
              dayOfWeek: { type: "number" },
              energy: { type: "number" },
              win: { type: "string" },
              friction: { type: "string" },
              letGo: { type: "string" },
              priority: { type: "string" },
            },
          },
        },
        timeRange: {
          type: "string",
          enum: ["week", "month", "quarter", "year"],
        },
      },
      required: ["checkIns", "timeRange"],
    },
  },
  {
    name: "analyze_energy_patterns",
    description: "Deep analysis of energy patterns over time",
    inputSchema: {
      type: "object",
      properties: {
        dailyEnergies: {
          type: "array",
          items: {
            type: "object",
            properties: {
              date: { type: "string" },
              dayOfWeek: { type: "number" },
              hour: { type: "number" },
              energy: { type: "number" },
              context: { type: "string" },
            },
          },
        },
      },
      required: ["dailyEnergies"],
    },
  },
  {
    name: "find_recurring_themes",
    description: "Identify recurring themes in wins, frictions, or reflections",
    inputSchema: {
      type: "object",
      properties: {
        items: {
          type: "array",
          items: { type: "string" },
        },
        source: {
          type: "string",
          enum: ["wins", "frictions", "priorities", "reflections"],
        },
      },
      required: ["items", "source"],
    },
  },
  {
    name: "identify_blind_spots",
    description: "Identify potential blind spots based on stated vs actual behavior",
    inputSchema: {
      type: "object",
      properties: {
        statedPriorities: {
          type: "array",
          items: { type: "string" },
        },
        actualTimeSpent: {
          type: "object",
          description: "Map of activity to percentage of time",
        },
        goalsSet: {
          type: "array",
          items: { type: "string" },
        },
        goalsAchieved: {
          type: "array",
          items: { type: "string" },
        },
        frequentFrictions: {
          type: "array",
          items: { type: "string" },
        },
      },
      required: ["statedPriorities", "actualTimeSpent", "goalsSet", "goalsAchieved"],
    },
  },

  // Goal Agent Tools
  {
    name: "evaluate_goal_alignment",
    description: "Evaluate how well current goals align with North Star and life priorities",
    inputSchema: {
      type: "object",
      properties: {
        goals: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              category: { type: "string" },
              timeframe: { type: "string" },
              progress: { type: "number" },
            },
          },
        },
        northStar: {
          type: "object",
          properties: {
            greatLife: { type: "string" },
            optimizingFor: { type: "string" },
            wouldRegret: { type: "string" },
            unwillingToSacrifice: { type: "string" },
          },
        },
        lifeMapScores: {
          type: "object",
        },
      },
      required: ["goals", "northStar", "lifeMapScores"],
    },
  },
  {
    name: "suggest_milestones",
    description: "Suggest milestones for breaking down a goal",
    inputSchema: {
      type: "object",
      properties: {
        goal: {
          type: "object",
          properties: {
            title: { type: "string" },
            description: { type: "string" },
            timeframe: { type: "string" },
            category: { type: "string" },
          },
        },
        currentProgress: { type: "number" },
        context: { type: "string" },
      },
      required: ["goal", "currentProgress"],
    },
  },
  {
    name: "assess_progress",
    description: "Assess progress across all goals",
    inputSchema: {
      type: "object",
      properties: {
        goals: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              progress: { type: "number" },
              startDate: { type: "string" },
              targetDate: { type: "string" },
              milestones: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    completed: { type: "boolean" },
                  },
                },
              },
            },
          },
        },
      },
      required: ["goals"],
    },
  },
  {
    name: "recommend_priorities",
    description: "Recommend goal priorities based on leverage, energy, and available time",
    inputSchema: {
      type: "object",
      properties: {
        goals: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              category: { type: "string" },
              progress: { type: "number" },
              importance: { type: "number" },
              effort: { type: "number" },
            },
          },
        },
        currentFocus: {
          type: "array",
          items: { type: "string" },
        },
        energyLevel: { type: "number" },
        availableHours: { type: "number" },
      },
      required: ["goals", "energyLevel", "availableHours"],
    },
  },
];
