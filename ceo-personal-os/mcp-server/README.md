# CEO Productivity MCP Server

A Model Context Protocol (MCP) server providing AI-powered coaching, reflection, pattern analysis, and goal management for the CEO Personal Productivity System.

## Features

### AI Agents

#### 1. Coaching Agent
- **Daily Check-In Processing** - Analyzes energy, wins, frictions and provides personalized feedback
- **Weekly Reflection** - Strategic analysis of what moved the needle vs noise
- **Open Questions** - Ask any coaching question and receive thoughtful guidance
- **Energy Advice** - Personalized energy management recommendations

#### 2. Reflection Agent
- **Year Analysis** - Comprehensive annual review synthesis
- **Insight Generation** - Extract patterns from accumulated data
- **Period Summarization** - Week/month/quarter summaries

#### 3. Pattern Agent
- **Pattern Detection** - Find recurring patterns in behavior and results
- **Energy Analysis** - Deep dive into energy patterns by day, week, context
- **Theme Extraction** - Identify recurring themes in wins, frictions, reflections
- **Blind Spot Identification** - Find gaps between stated and actual priorities

#### 4. Goal Agent
- **Alignment Evaluation** - Check goals against North Star
- **Milestone Suggestions** - Break down goals into actionable milestones
- **Progress Assessment** - Evaluate progress across all goals
- **Priority Recommendations** - Leverage-based prioritization

## Hugging Face Models Used

Based on research of top-performing models for personal coaching and reasoning:

| Model | Use Case | Why |
|-------|----------|-----|
| **Qwen/Qwen2.5-72B-Instruct** | Primary coaching | Excellent reasoning, 119 languages, thinking modes |
| **mistralai/Mixtral-8x7B-Instruct** | Reflection analysis | Strong synthesis and pattern recognition |
| **meta-llama/Llama-3.3-70B-Instruct** | Pattern detection | Robust analytical capabilities |

All models have local fallback responses for offline operation.

## Installation

```bash
cd mcp-server
npm install
npm run build
```

## Configuration

Set your Hugging Face token:

```bash
export HF_TOKEN=your_hugging_face_token
```

## Usage

### With Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "ceo-productivity": {
      "command": "node",
      "args": ["/path/to/ceo-personal-os/mcp-server/dist/index.js"],
      "env": {
        "HF_TOKEN": "your_token_here"
      }
    }
  }
}
```

### Standalone

```bash
npm start
```

## Available Tools

### Coaching Tools
- `coach_daily_checkin` - Process daily check-in
- `coach_weekly_reflection` - Analyze weekly review
- `coach_ask_question` - Ask open coaching questions
- `coach_energy_advice` - Get energy management advice

### Reflection Tools
- `analyze_year` - Comprehensive year analysis
- `generate_insights` - Generate insights from data
- `summarize_period` - Summarize week/month/quarter

### Pattern Tools
- `detect_patterns` - Find behavioral patterns
- `analyze_energy_patterns` - Energy pattern analysis
- `find_recurring_themes` - Theme extraction
- `identify_blind_spots` - Blind spot detection

### Goal Tools
- `evaluate_goal_alignment` - Check North Star alignment
- `suggest_milestones` - Generate milestones
- `assess_progress` - Progress assessment
- `recommend_priorities` - Priority recommendations

## Available Prompts

- `daily_coaching` - Personalized daily coaching
- `weekly_review_guide` - Guided weekly review
- `quarterly_assessment` - Quarterly deep-dive
- `annual_reflection` - Annual reflection guide
- `goal_coaching` - Goal alignment coaching
- `pattern_analysis` - Pattern analysis
- `energy_optimization` - Energy optimization advice
- `decision_support` - Decision thinking framework
- `regret_minimization` - Jeff Bezos's regret minimization
- `blind_spot_check` - Blind spot examination

## Architecture

```
mcp-server/
├── src/
│   ├── index.ts           # MCP server entry point
│   ├── agents/
│   │   ├── coaching-agent.ts
│   │   ├── reflection-agent.ts
│   │   ├── pattern-agent.ts
│   │   └── goal-agent.ts
│   ├── tools/
│   │   └── index.ts       # Tool definitions
│   └── prompts/
│       └── index.ts       # Prompt templates
├── package.json
└── tsconfig.json
```

## Offline Operation

All agents include local fallback responses using rule-based analysis when Hugging Face API is unavailable. This ensures the system works without internet connectivity.

## Privacy

- All data processing happens locally or via API calls you control
- No data is stored by the MCP server
- Hugging Face Inference API is used only when available

## License

Private use only.
