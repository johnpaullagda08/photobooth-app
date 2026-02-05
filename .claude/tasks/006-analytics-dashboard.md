# Task: Analytics Dashboard

**Priority**: Medium
**Category**: Feature
**Estimated Complexity**: Medium

## Description

Build an analytics dashboard to help event organizers track photobooth usage, popular times, and generate reports.

## Requirements

1. **Event Analytics**
   - Total photos captured
   - Photos per hour/time chart
   - Peak usage times
   - Session duration averages

2. **Print Analytics**
   - Total prints
   - Prints by paper size
   - Print failures/retries
   - Paper usage tracking

3. **Guest Analytics**
   - Unique sessions
   - Average photos per session
   - Retake percentage
   - Download vs print ratio

4. **Export & Reports**
   - PDF report generation
   - CSV data export
   - Email scheduled reports

## Files to Modify/Create

- `app/dashboard/page.tsx` - Dashboard page
- `components/analytics/` - Analytics components
  - `StatCard.tsx`
  - `UsageChart.tsx`
  - `TimelineChart.tsx`
  - `ReportGenerator.tsx`
- `lib/analytics/` - Analytics utilities
  - `data-aggregation.ts`
  - `report-generator.ts`
  - `chart-helpers.ts`

## Dependencies

```json
{
  "recharts": "^2.x",
  "jspdf": "^2.x"
}
```

## Acceptance Criteria

- [ ] Dashboard shows key metrics
- [ ] Charts render usage over time
- [ ] PDF reports generate correctly
- [ ] Data exports to CSV
- [ ] Real-time updates during event

## Related Spec Sections

- Section 3: Data Models (extend for analytics)
- Section 7: State Management
