# Operational Limitations & Continuous Improvement Report

## Identified Model Limitations

1. **Unscheduled Force Majeure Events**:
   - The model cannot anticipate sudden track derailments, unannounced overhead wire (OHE) snaps, or flash weather flooding before the train slows down or stops.
   - *Mitigation*: GPS telemetry velocity monitoring triggers immediate anomaly state when velocity drops to 0 km/h in mid-section.

2. **Loop Line Dispatch Decisions**:
   - Local station master decisions to hold a lower-priority Passenger train for an overtaking Rajdhani express are currently inferred via section occupancy and headway features, but manual section controller interventions can create unexpected delays.
   - *Mitigation*: Incorporate real-time section interlocking signalling feed where available.

3. **Master Timetable Revision Lag**:
   - The ingested open-source master contains 5,208 trains and 8,990 stations; special seasonal trains (e.g. Kumbh / Chhath festival specials) introduced on short notice require running the automated master ingestion pipeline.
   - *Mitigation*: Dynamic ingestion endpoint `POST /api/system/refresh-master` keeps master synchronised.

4. **Prediction Intervals in Extreme Disruptions**:
   - In events exceeding 120-minute delays, prediction interval sharpness widens to over 30 minutes, which is statistically honest but may require targeted dispatch operational interventions.
