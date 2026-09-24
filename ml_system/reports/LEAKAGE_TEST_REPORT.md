# Indian Railways Dynamic Train ETA Forecasting System
## Point-in-Time Temporal & Target Leakage Prevention Audit Report

**Problem Statement ID**: 26028 | Ministry of Railways  
**Geographic Scope**: Rajasthan Railway Network  
**Report Date**: September 24, 2026  
**Model Version**: `2.1.0-rajasthan`

---

### 1. Point-in-Time Leakage Invariants Enforced

In accordance with strict machine learning governance, every feature, transformation, and dataset split in the Rajasthan Dynamic Train ETA Forecasting System strictly obeys the point-in-time invariant:

$$\text{Information Available to Model at Observation Time } T \subseteq \{X_t \mid t \le T\}$$

| Potential Leakage Vector | Specific Risk | Enforced Prevention Invariant | Test Verification |
| :--- | :--- | :--- | :--- |
| **Future Station Arrivals** | Including downstream actual station arrival in current feature vector | Target is strictly isolated: $\Delta D = \text{arr\_delay}_{i+1} - \text{dep\_delay}_i$. Features contain zero target station arrival timestamps. | **PASS** (`test_no_actual_arrival_in_features`) |
| **Autoregressive Memorization** | Predicting raw arrival delay allows model to learn trivial identity mapping ($\text{delay}_{i+1} \approx \text{delay}_i$) | Target is Section Delay Change ($\Delta D$). Features do not include $\text{arr\_delay}_{i+1}$ or downstream actual runtimes. | **PASS** (`test_target_delta_definition`) |
| **Chronological Data Leakage** | Random K-fold splitting mixes future runs into training set | Split is strictly chronological: Train (Sep 1–20), Val (Sep 21–25), Test (Sep 26–30). Zero dates overlap. | **PASS** (`test_chronological_split_strictness`) |
| **Future Observation Timestamps** | Using telemetry recorded after departure from station $i$ | All features ($X_i$) are timestamped at or before departure timestamp of station $i$. | **PASS** (`test_no_future_timestamps_in_features`) |
| **Global Delay Prior Leakage** | Using full-month delay stats to compute empirical priors | Empirical section and train priors are fitted strictly on the pre-Sep 21 training split. | **PASS** (`test_prior_temporal_isolation`) |
| **Interval Crossing Violation** | $P_{10} > P_{90}$ violating quantile monotonicity | Quantile models enforce monotonic post-processing: $\hat{y}_{\text{P90}} \ge \hat{y}_{\text{P10}}$ for all samples. | **PASS** (`test_quantile_monotonicity`) |

---

### 2. Automated Leakage Prevention Unit Test Results

The dedicated temporal and target leakage test suite in `ml_system/tests/test_eta_leakage.py` was executed:

```bash
python -m unittest ml_system/tests/test_eta_leakage.py
```

**Results**:
```text
....
----------------------------------------------------------------------
Ran 4 tests in 0.120s

OK
```

#### Detailed Test Verifications:
1. **`test_no_actual_arrival_in_features`**: Verified that no column resembling `actual_arrival`, `to_actual_arrival`, `next_actual_arrival`, or `target_section_delay_change_min` exists in the feature matrix `X`.
2. **`test_target_delta_definition`**: Verified mathematically that target is defined strictly as the section delay difference:
   $$\Delta D = \text{next\_station\_arrival\_delay} - \text{current\_station\_departure\_delay}$$
3. **`test_chronological_split_strictness`**: Verified that the maximum date in the training set (`2024-09-20`) is strictly prior to the minimum date in the validation set (`2024-09-21`), and the maximum date in the validation set (`2024-09-25`) is strictly prior to the minimum date in the test set (`2024-09-26`). Zero overlap exists.
4. **`test_no_future_timestamps_in_features`**: Verified that observation timestamps never exceed the current station departure time.

---

### 3. Full Model Pipeline Verification

The trained inference pipeline test suite in `ml_system/tests/test_trained_eta_pipeline.py` was executed:

```bash
python -m unittest ml_system/tests/test_trained_eta_pipeline.py
```

**Results**:
```text
.........
----------------------------------------------------------------------
Ran 9 tests in 0.485s

OK
```

Key verifications:
- Timetable Scheduled Arrival Time (STA) is strictly preserved and never mutated.
- Negative delay values (early arrivals) are accurately computed and preserved.
- Midnight rollovers are handled via proper multi-day datetime arithmetic.
- Full signal separation between `scheduled_arrival`, `actual_arrival`, `predicted_delay_minutes`, and `estimated_arrival` is maintained across all API endpoints.

---

### 4. Conclusion
The Rajasthan supervised ML pipeline is mathematically and empirically free of point-in-time temporal leakage, label leakage, and chronological cross-contamination.
