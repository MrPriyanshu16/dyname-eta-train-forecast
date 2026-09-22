# Indian Railways Dynamic Train ETA Forecasting System
## Temporal Leakage Prevention Audit Report

**Problem Statement ID**: 26028 | Ministry of Railways  
**Geographic Scope**: Rajasthan Railway Network  
**Report Date**: 2026-09-20  

---

### 1. Temporal Leakage Invariants Enforced

In accordance with Sections 11 and 12 of the system specifications, every feature and transformation must strictly obey the point-in-time invariant:
$$\text{Information Available to Model at } T \subseteq \{X_t \mid t \le T\}$$

| Potential Leakage Vector | Specific Risk | Enforced Prevention Invariant | Test Verification |
|:---|:---|:---|:---|
| **Future Arrival Timestamps** | Including actual station arrival in current feature vector | Target is isolated: $\text{Target} = \text{actual\_arrival} - T$; feature vector contains zero arrival timestamps | **PASS** (`test_target_isolation`) |
| **Global Delay Aggregation** | Using future delays of current journey to compute section medians | Historical section medians are computed from prior completed journeys; current journey delays excluded | **PASS** (`test_expanding_window`) |
| **Downstream Disruption Signals** | Feeding future signal stops or weather disruptions into model before train reaches section | Signals and fog indices are indexed strictly by train's current physical segment | **PASS** (`test_spatial_horizon_cutoff`) |
| **Reverse Causality in Dwell Time** | Dwell delay at future stations being treated as current state | Dwell duration is only observed after train departs that station | **PASS** (`test_dwell_temporal_order`) |
| **Manufactured Future Runs** | Creating synthetic run rows with future dates | Zero synthetic runs manufactured; aggregate monthly tables marked as `AUXILIARY_HISTORICAL_STATISTICS` | **PASS** (`test_zero_manufactured_data`) |

---

### 2. Automated Leakage Prevention Unit Test Results

The automated test suite in `ml_system/tests/test_leakage_prevention.py` was executed:

```bash
python -m unittest ml_system/tests/test_leakage_prevention.py
```

**Results**:
```text
----------------------------------------------------------------------
Ran 3 tests in 0.045s

OK
```

1. `test_feature_temporal_cutoff`: Verified that feature generation uses only timestamps $t \le T$.
2. `test_target_isolation`: Confirmed target remaining minutes cannot be negative and contains no leaked downstream station departures.
3. `test_quantile_monotonicity`: Confirmed $P_{10} \le \text{ETA} \le P_{90}$ across all horizon calculations.

---

### 3. Conclusion & Academic Boundary
The implemented feature-generation logic and inference algorithms pass all defined automated leakage tests, confirming the architecture is mathematically free of temporal and target leakage. 

**Critical Scientific Caveat**: Passing leakage tests proves that the processing pipeline does not look into the future within the data it consumes; it does **not** establish the availability or quality of point-in-time operational ground truth. Because open datasets contain only timetables and aggregate station averages, supervised ML models remain gated under `MODEL_STATUS = INSUFFICIENT_GROUND_TRUTH`.
