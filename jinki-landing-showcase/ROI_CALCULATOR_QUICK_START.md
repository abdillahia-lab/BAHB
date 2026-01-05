# ROI CALCULATOR - Quick Start Guide

## What Is It?

An interactive modal that lets prospects self-calculate their potential ROI by selecting:
1. Their industry (Data Center, Utility, Agriculture, Oil & Gas)
2. Their current inspection method
3. Real costs in their operation

Then displays: **Annual savings, Year 1 ROI %, Payback period**

**Result**: Prospect enters email to get PDF report + auto-enrolled in sales sequence

---

## User Flow (90 Seconds)

```
User clicks "💰 See Your ROI" in hero
  ↓
Selects industry (2 sec)
  ↓
Selects current method (2 sec)
  ↓
Reviews & calculates (30 sec)
  ↓
Sees ROI metrics (30 sec)
  ↓
Enters email for report (15 sec)
  ↓
Lead captured ✓
```

---

## What Happens When Lead Enters Email?

### For the Prospect
1. Confirmation modal appears ("Report Sent!")
2. Email delivered with:
   - Personalized ROI analysis PDF
   - Implementation roadmap
   - Case study from their industry
3. Sales team reaches out within 24 hours

### For the Sales Team
1. Lead appears in CRM with:
   - Name, company, email
   - **Industry**: Data Center / Utility / Agriculture / Oil & Gas
   - **ROI expectation**: $X savings, Y% return, Z month payback
   - **Motivation level**: HIGH (they calculated their own value)

2. Sales script becomes easier:
   - Instead of: "Tell me about your current inspections..."
   - Sales says: "I see you calculated $504K in annual savings. Let me show you how we achieve that and the 72-hour early warning system..."

---

## Expected Lead Quality

### Before ROI Calculator
```
Lead: "Clicked contact form"
Intent: Unknown
Qualification: Needs discovery call
Sales readiness: 20%
```

### After ROI Calculator
```
Lead: "Calculated $504K/yr savings, 8-month payback, Data Center industry"
Intent: Clear (ROI buyer)
Qualification: Pre-qualified
Sales readiness: 80%
```

---

## Industry Models & Assumptions

### Data Centers
- **Current method options:**
  - Manual thermal walk-throughs: $500/inspection × 12/year
  - External contractor: $2,500/inspection × 4/year
- **Jinki cost:** $85K/year
- **Outage savings assumption:** 65% reduction in cooling-related downtime
- **Avg outage cost:** $700K

### Electric Utilities
- **Current method options:**
  - Ground crew: $3K/inspection × 24/year
  - Helicopter surveys: $4K/inspection × 4/year
- **Jinki cost:** $95K/year
- **Defect savings:** 4.5x more defects found
- **Cost per defect:** $45K

### Precision Agriculture
- **Current method options:**
  - Manual scouting: $800/inspection × 12/year
  - Agricultural consultant: $2K/inspection × 6/year
- **Jinki cost:** $45K/year
- **Crop loss savings:** 14-day earlier detection = $150K/event prevented
- **Events/year:** 1-2

### Oil & Gas
- **Current method options:**
  - Monthly manual inspections: $5K × 12/year
  - Third-party service: $8K × 4/year
- **Jinki cost:** $120K/year
- **Methane incidents prevented:** Avg $500K per incident
- **EPA compliance:** Automation saves $24K/year

---

## Customization Options

### For Marketing Team

**A/B Test Variants:**
```
Variant A (Current): "💰 See Your ROI"
Variant B (Urgency): "⏱️ Calculate 48-Hour ROI"
Variant C (Benefit): "📊 See Your Savings"
Variant D (Social): "Join 200+ Companies Saving Millions"

Tracked in Google Analytics:
event.name = "roi_modal_opened"
event.variant = "A" | "B" | "C" | "D"
```

### For Sales Team

**Industries to Add:**
- If you have data for a new industry, let engineering know
- Model structure allows easy addition:
  ```javascript
  newIndustry: {
    name: 'Industry Name',
    methods: [...],
    equipment: {...},
    outageFrequency: {...},
    outageAvgCost: XXX,
    jinkiCostAnnual: XXX,
    benefits: [...]
  }
  ```

### For Product Team

**Metrics to Track:**
```
ga_event('roi_modal_opened')
ga_event('roi_industry_selected', { industry: 'dataCenter' })
ga_event('roi_method_selected', { method: 'contractor' })
ga_event('roi_calculated', { savings: 504000, roi: 495, payback: 8 })
ga_event('roi_email_submitted', { email_domain: 'company.com' })
ga_event('roi_report_sent')
```

---

## Troubleshooting

### "The button doesn't work"
- Check browser console for errors
- Verify JavaScript is enabled
- Try different browser

### "Email isn't being sent"
- Verify backend API endpoint is running
- Check SendGrid/Mailgun API keys
- Confirm email template exists

### "ROI numbers look wrong"
- Edit `INDUSTRY_MODELS` in ROICalculator.jsx
- Update `jinkiCostAnnual` based on current pricing
- Update `outageAvgCost` based on recent customer data

---

## Success Metrics (First 30 Days)

**Target:**
- Modal open rate: 15% of visitors = 300/month opens
- Email submission rate: 18% = 54 leads/month
- Sales demo rate: 55% = 30 demos/month
- Closed won: 22% = 6-7 customers/month

**Track in your CRM:**
- Leads tagged with "roi-calculator"
- Pipeline velocity (days from lead → demo)
- Win rate (roi-calculator vs. traditional leads)

---

## FAQ

### Q: Why are the ROI numbers so high?
A: They include prevented downtime costs. For example, a data center outage costs $700K on average. By detecting problems 72 hours early, Jinki prevents outages. This is based on industry data and customer case studies.

### Q: Can prospects edit the costs?
A: Currently no (prevents abuse). Future version could allow custom inputs after email capture.

### Q: What if their industry isn't listed?
A: Tell them to contact sales directly. We can create custom ROI models for new industries.

### Q: Can we gate the PDF report?
A: The PDF is automatically emailed. To also show report preview in the UI after email, engineering can add that feature.

### Q: How do we know if someone is genuine vs. fake email?
A: Standard email validation + domain verification. CRM can flag suspicious patterns (e.g., 10 test@test.com submissions).

---

## Engineering Implementation Notes

**For Backend Team:**

Create endpoint: `POST /api/leads/roi-report`

```javascript
// Request body
{
  name: "John Smith",
  email: "john@acme.com",
  company: "Acme Corp",
  industry: "dataCenter",
  roiData: {
    annualSavings: 504000,
    roi: 495,
    paybackMonths: 8,
    preventedDowntimeSavings: 456000
  }
}

// Response
{
  success: true,
  message: "Report sent to john@acme.com",
  leadId: "lead_12345"
}
```

**For Marketing Team:**

Create email template: `roi-report-{industry}.html`

Include:
- Personalized savings numbers
- Implementation timeline (default: 30 days)
- Case study from same industry
- Next steps: Sales call scheduling link

**For CRM Team:**

Create lead scoring rule:
```
If lead_source = "roi-calculator"
  base_score = 75 (vs. 30 for traditional form)
  assigned_to = "sales-enterprise"
  tag = "hot-lead"
  alert = "Send SMS to SDR immediately"
```

---

## Next Steps

1. **Backend**: Implement email delivery endpoint
2. **Marketing**: Create email templates
3. **CRM**: Configure lead routing
4. **QA**: Test end-to-end flow
5. **Analytics**: Set up GA tracking
6. **Launch**: Go live with landing page update

**Timeline**: 1-2 weeks to full integration

---

## Contact

- **Questions about ROI logic?** → Engineering
- **Issues with styling/UX?** → Product Design
- **Email delivery problems?** → Backend Team
- **Lead quality metrics?** → RevOps / Sales Operations

---

Last Updated: 2026-01-05
Status: Ready for Implementation
