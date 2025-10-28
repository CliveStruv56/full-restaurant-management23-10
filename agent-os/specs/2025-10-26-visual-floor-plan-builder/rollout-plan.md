# Visual Floor Plan Builder - Rollout Plan

**Feature**: Visual Floor Plan Builder (Table Management Module Add-On)
**Priority**: HIGH - Beta Customer Launch Blocker
**Target Launch Date**: October 27, 2025
**Pricing**: £29/month (Table Management Module)

---

## Rollout Strategy

### Phase 1: Beta Customer Deployment (Week 1)
**Target**: Marcus's Restaurant (8 tables, 30-seat capacity)
**Timeline**: October 27 - November 3, 2025

**Objectives**:
- Validate feature in real production environment
- Gather usage metrics and feedback
- Identify any edge cases or issues
- Refine UX based on daily operations

**Deployment Steps**:
1. Enable `floorPlanEnabled` for Marcus's tenant
2. Provide onboarding session (30 minutes)
3. Monitor usage daily for first week
4. Collect feedback after 7 days
5. Make minor adjustments if needed

---

### Phase 2: Controlled Expansion (Weeks 2-4)
**Target**: 5-10 additional restaurants
**Timeline**: November 4-25, 2025

**Selection Criteria**:
- Restaurants with 5-20 tables
- Active engagement with platform
- Diverse layouts (square, L-shape, multi-floor)
- Mix of café, fine dining, casual dining

**Deployment**:
- Enable feature per tenant upon request
- Provide setup documentation
- Weekly check-ins
- Build case studies

---

### Phase 3: General Availability (Month 2+)
**Target**: All Table Management Module subscribers
**Timeline**: December 2025 onwards

**Rollout**:
- Feature available to all tenants who subscribe to Table Management Module
- Self-service enablement via Settings
- Video tutorials and documentation
- Customer support trained
- Marketing materials prepared

---

## Default Configuration

### For Existing Tenants
**Setting**: `floorPlanEnabled: false` (default)

**Rationale**:
- Non-breaking change
- Opt-in model
- Allows gradual adoption
- No disruption to existing workflows

**How to Enable**:
```typescript
// Firestore update for specific tenant
{
  "settings": {
    "floorPlanEnabled": true,
    "floorPlanCanvas": {
      "width": 800,
      "height": 600
    }
  }
}
```

### For New Tenants
**Setting**: `floorPlanEnabled: false` (default)

**Enablement**: Self-service via Settings page after subscribing to Table Management Module

---

## Manual Enablement Script

### For Beta Customer (Marcus's Restaurant)

**Script**: `scripts/enable-floor-plan.js`

```javascript
/**
 * Enable Floor Plan for Specific Tenant
 *
 * Usage: node scripts/enable-floor-plan.js <tenantId>
 * Example: node scripts/enable-floor-plan.js marcus-restaurant
 */

const admin = require('firebase-admin');
const serviceAccount = require('../service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function enableFloorPlan(tenantId) {
  try {
    // Get current settings
    const settingsRef = db.collection('tenants').doc(tenantId).collection('settings').doc('appSettings');
    const settingsDoc = await settingsRef.get();

    if (!settingsDoc.exists) {
      console.error(`Settings not found for tenant: ${tenantId}`);
      return;
    }

    // Update settings
    await settingsRef.update({
      floorPlanEnabled: true,
      floorPlanCanvas: {
        width: 800,
        height: 600
      }
    });

    console.log(`✅ Floor plan enabled for tenant: ${tenantId}`);
    console.log(`   - floorPlanEnabled: true`);
    console.log(`   - floorPlanCanvas: 800x600`);
  } catch (error) {
    console.error(`❌ Error enabling floor plan:`, error);
  } finally {
    process.exit();
  }
}

const tenantId = process.argv[2];

if (!tenantId) {
  console.error('❌ Please provide tenant ID');
  console.log('Usage: node scripts/enable-floor-plan.js <tenantId>');
  process.exit(1);
}

enableFloorPlan(tenantId);
```

**Execution for Marcus**:
```bash
node scripts/enable-floor-plan.js marcus-restaurant
```

---

## Rollback Procedure

### Immediate Rollback (If Critical Issues Found)

**Step 1: Disable Module for Affected Tenant(s)**
```javascript
// Firestore Console or Script
tenants/{tenantId}/settings/appSettings
{
  "floorPlanEnabled": false
}
```

**Step 2: Verify Fallback Behavior**
- Admin: Floor Plan tab hidden in TableManager
- Admin: List view remains fully functional
- Customer: Floor plan buttons hidden in ReservationForm and CartModal
- Customer: Dropdown table selection still works

**Step 3: Communicate with Customer**
- Notify via email/phone
- Explain issue and timeline for fix
- Assure data is preserved (table positions saved)
- Provide workaround (use List view)

**Step 4: Investigate & Fix**
- Review error logs in Firebase Console
- Check Firestore operations for failures
- Test fix in staging environment
- Re-enable for beta customer once validated

**Rollback Time**: < 5 minutes (simple settings toggle)

**Data Impact**: Zero (table positions preserved in database)

---

### Partial Rollback (Specific Feature Disabled)

If specific sub-feature causes issues (e.g., touch drag on certain devices):

**Option**: Temporarily hide problematic feature while keeping core functionality:
- Keep floor plan visible
- Disable drag-and-drop (read-only for admins)
- Allow position editing via form inputs
- Fix issue and re-enable drag

---

## Monitoring Checklist

### Week 1 (Beta Launch - Daily Monitoring)

**Metrics to Track**:
- [ ] Firestore read/write counts (floor plan queries)
- [ ] Error logs (Firebase Console → Functions Logs)
- [ ] Performance metrics (page load times)
- [ ] Real-time sync latency (monitor streamTables)
- [ ] Customer support tickets (feature-related)
- [ ] Feature usage analytics (floor plan views vs list views)

**Thresholds for Concern**:
- Firestore read/write > 10,000/day per tenant (cost concern)
- Error rate > 1% (reliability concern)
- Page load > 3 seconds (performance concern)
- Real-time sync latency > 500ms (UX concern)
- Support tickets > 3/day (usability concern)

**Daily Check-In**:
- Morning: Review overnight logs
- Afternoon: Check with Marcus for feedback
- Evening: Analyze usage metrics

---

### Week 2-4 (Controlled Expansion - Weekly Monitoring)

**Metrics to Track**:
- [ ] Aggregate Firestore operations across all beta tenants
- [ ] Feature adoption rate (% of Table Module subscribers)
- [ ] Customer satisfaction scores
- [ ] Average setup time (admin floor plan configuration)
- [ ] Customer floor plan usage rate (vs dropdown)

**Weekly Review**:
- Monday: Review previous week's metrics
- Wednesday: Stakeholder update
- Friday: Prepare next week's expansion targets

---

### Month 2+ (General Availability - Monthly Monitoring)

**Metrics to Track**:
- [ ] Monthly Active Users (floor plan feature)
- [ ] Conversion rate (trial → paid Table Management Module)
- [ ] Feature retention (% still using after 30 days)
- [ ] Performance trends (scaling with user growth)
- [ ] Cost efficiency (Firestore operations vs revenue)

**Monthly Review**:
- Financial: Revenue from Table Management Module
- Technical: Performance and reliability trends
- Product: Feature requests and enhancement priorities
- Support: Common issues and documentation gaps

---

## Support Documentation

### Admin Quick Start Guide

**Title**: "Setting Up Your Restaurant Floor Plan"

**Content**:
1. Enable floor plan in Settings
2. Navigate to Tables → Floor Plan View
3. Drag tables to match your restaurant layout
4. Use grid snapping for alignment
5. Save and refresh to verify

**Format**: PDF + video (2-minute walkthrough)

**Distribution**: Email to Table Management Module subscribers

---

### Customer-Facing Help

**Title**: "How to Select Your Table Visually"

**Content**:
1. Look for "View Floor Plan" button
2. Click to see restaurant layout
3. Available tables are green
4. Click your preferred table
5. Confirm selection

**Format**: Tooltip + in-app hints

**Location**: Reservation and order pages

---

### Troubleshooting Guide

**For Support Team**:

**Issue**: Floor plan not loading
- Check: Is floorPlanEnabled true?
- Check: Are tables created?
- Check: Network tab for errors
- Fix: Refresh page, check Firestore rules

**Issue**: Tables not draggable
- Check: Is user admin?
- Check: Is editable=true passed to FloorPlanCanvas?
- Check: Browser console for errors
- Fix: Clear cache, verify permissions

**Issue**: Real-time updates not working
- Check: Firestore connection status
- Check: streamTables() subscription active
- Check: Network latency
- Fix: Refresh page, check Firestore security rules

---

## Release Notes

### Version 2.1.0 - Visual Floor Plan Builder

**Release Date**: October 27, 2025

**New Features**:
- 🎯 Visual floor plan editor for restaurant managers
- 👥 Customer table selection with visual floor plan
- 🔄 Real-time table status synchronization
- 📱 Mobile-responsive design (admin and customer)
- 🔗 Merged table visualization for large parties
- ⚙️ Module toggle for optional enablement

**How to Enable**:
1. Admin Panel → Settings
2. Check "Enable Floor Plan Module"
3. Choose canvas size (Small/Medium/Large)
4. Navigate to Tables → Floor Plan View
5. Arrange your tables by dragging

**Pricing**:
- Part of Table Management Module: £29/month
- Existing Table Management subscribers: Included
- New feature, no additional cost

**Known Limitations**:
- Recommended max 50 tables per floor plan for optimal performance
- Table rotation not available (coming soon)
- Background floor plan images not supported yet (coming soon)

**Support**:
- Documentation: docs.restaurantmanagement.com/floor-plan
- Video Tutorial: youtube.com/watch?v=floor-plan-setup
- Email: support@restaurantmanagement.com

---

## Success Criteria for Rollout

### Week 1 (Beta)
- ✅ Zero critical bugs
- ✅ < 3 support tickets
- ✅ Positive feedback from Marcus
- ✅ Real-time sync < 200ms
- ✅ Setup time < 2 minutes

### Week 4 (Controlled Expansion)
- ✅ 5+ additional restaurants using feature
- ✅ 80%+ customer satisfaction
- ✅ < 5 support tickets per week
- ✅ No performance degradation

### Month 3 (General Availability)
- ✅ 30%+ adoption rate (Table Module subscribers)
- ✅ Feature contributes to module retention
- ✅ Cost-efficient (Firestore costs < 20% of module revenue)
- ✅ Scaled to 100+ concurrent users without issues

---

## Risk Mitigation

### Risk 1: High Firestore Costs
**Probability**: Medium
**Impact**: High (financial)
**Mitigation**:
- Set up Firestore usage alerts (threshold: £100/month)
- Monitor read/write patterns
- Implement caching where possible
- Recommend table limit (50 per floor plan)
**Contingency**: Optimize queries, implement pagination

### Risk 2: Customer Confusion
**Probability**: Low
**Impact**: Medium (UX)
**Mitigation**:
- In-app tooltips and hints
- Video tutorials
- Maintain dropdown fallback option
- Gather early feedback and iterate
**Contingency**: Additional documentation, support training

### Risk 3: Performance Issues at Scale
**Probability**: Low
**Impact**: High (reliability)
**Mitigation**:
- Load testing before GA
- Performance monitoring
- Table limit recommendations
- CDN for static assets
**Contingency**: Optimize SVG rendering, implement virtualization

### Risk 4: Mobile Browser Compatibility
**Probability**: Low
**Impact**: Medium (accessibility)
**Mitigation**:
- Test on major browsers (Chrome, Safari, Firefox)
- Touch event polyfills if needed
- Responsive design testing
- Browser detection and fallbacks
**Contingency**: Browser-specific workarounds, graceful degradation

---

## Post-Launch Roadmap

### Q1 2026 - Enhancements
- Table rotation support
- Background floor plan image upload
- Zone indicators (kitchen, bar, patio)
- Accessibility improvements (keyboard shortcuts)

### Q2 2026 - Advanced Features
- Auto-suggest table layout based on dimensions
- Table clustering for 100+ table restaurants
- Heatmap showing popular seating areas
- Capacity planning tools

### Q3 2026 - Analytics & Insights
- Table turnover analytics
- Popular table tracking
- Revenue per table metrics
- Seating efficiency reports

---

## Approval & Sign-Off

**Product Manager**: _____________ Date: _______
**Technical Lead**: _____________ Date: _______
**QA Lead**: _____________ Date: _______
**Support Manager**: _____________ Date: _______

**Status**: ✅ APPROVED FOR DEPLOYMENT

**Next Action**: Execute Phase 1 Beta deployment to Marcus's Restaurant on October 27, 2025.
