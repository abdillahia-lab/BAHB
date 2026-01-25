# BVLOS Features - Future Development

> **Status**: DEFERRED - All BVLOS features are planned for future development cycles.
> Current operations are **VLOS (Visual Line of Sight) only**.

## Overview

This folder contains planning and documentation for Beyond Visual Line of Sight (BVLOS) capabilities that will be implemented in future releases.

## Regulatory Requirements

### FAA Part 107 Waiver (14 CFR 107.31)

BVLOS operations require a waiver from the FAA. Key requirements include:

1. **Detect and Avoid (DAA)**
   - Must demonstrate ability to see and avoid other aircraft
   - Options: ADS-B In, ground-based radar, visual observers

2. **Communication Links**
   - Reliable command and control (C2) link
   - Link loss procedures documented
   - Redundant communication paths

3. **Airspace Integration**
   - LAANC authorization for controlled airspace
   - UTM (UAS Traffic Management) integration
   - Real-time airspace awareness

4. **Safety Case**
   - Formal risk assessment
   - Mitigation strategies documented
   - Emergency procedures

## Planned Modules

### `bahb/bvlos/planning/`
- Extended range mission planning
- Route optimization for BVLOS
- Waypoint density for long-range ops

### `bahb/bvlos/detect_and_avoid/`
- ADS-B In receiver integration
- Traffic alerting
- Collision avoidance maneuvers

### `bahb/bvlos/communication/`
- LTE/5G C2 links
- Satellite backup (Starlink)
- Link quality monitoring

### `bahb/bvlos/airspace/`
- LAANC API integration
- Real-time TFR/NOTAM checking
- UTM service provider integration

### `bahb/bvlos/regulatory/`
- Waiver application tracking
- Compliance documentation
- Audit logging

### `bahb/bvlos/testing/`
- BVLOS-specific test procedures
- Link loss simulation
- DAA system validation

## Timeline

| Phase | Features | Target |
|-------|----------|--------|
| Phase 1 | ADS-B In integration | TBD |
| Phase 2 | LTE C2 link | TBD |
| Phase 3 | LAANC integration | TBD |
| Phase 4 | Full BVLOS capability | TBD |

## Dependencies

- FAA Part 107 waiver approval (6+ months lead time)
- ADS-B In hardware procurement
- LTE modem integration with Manifold 3
- UTM service provider agreement

## Current Limitations

Until BVLOS is implemented:
- Maximum operation distance: Visual range (~1500ft in good conditions)
- Requires visual observer for extended operations
- No autonomous beyond-horizon missions
