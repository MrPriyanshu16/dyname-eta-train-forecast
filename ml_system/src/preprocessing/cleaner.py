import json
import pandas as pd
import numpy as np
from pathlib import Path
from ml_system.config.config import RAW_DATA_DIR, PROCESSED_DATA_DIR

def clean_and_profile_data():
    raw_path = RAW_DATA_DIR / 'historical_runs.csv'
    stations_path = RAW_DATA_DIR / 'station_master.csv'
    trains_path = RAW_DATA_DIR / 'train_master.csv'
    
    df = pd.read_csv(raw_path)
    stations_df = pd.read_csv(stations_path)
    trains_df = pd.read_csv(trains_path)
    
    total_records = len(df)
    valid_stations = set(stations_df['code'])
    valid_trains = set(trains_df['train_number'].astype(str))
    
    # 1. Check duplicates
    duplicate_count = int(df.duplicated(subset=['journey_id', 'station_code']).sum())
    df = df.drop_duplicates(subset=['journey_id', 'station_code'])
    
    # 2. Check invalid stations & trains
    invalid_station_mask = ~df['station_code'].isin(valid_stations)
    invalid_train_mask = ~df['train_number'].astype(str).isin(valid_trains)
    
    # 3. Check negative remaining travel times
    negative_travel_mask = (df['target_remaining_time_to_destination'] < 0) | (df['target_remaining_time_to_station'] < 0)
    
    # 4. Check impossible delays (> 12 hours)
    delay_outlier_mask = df['current_delay_min'] > 720.0
    
    # Compile removal mask
    removal_mask = invalid_station_mask | invalid_train_mask | negative_travel_mask | delay_outlier_mask
    removed_records = int(removal_mask.sum())
    
    clean_df = df[~removal_mask].copy()
    valid_records = len(clean_df)
    
    # Sort chronologically strictly by observation_timestamp
    clean_df['obs_dt'] = pd.to_datetime(clean_df['observation_timestamp'], format='ISO8601')
    clean_df = clean_df.sort_values(by=['obs_dt', 'journey_id', 'station_sequence']).reset_index(drop=True)
    
    # Chronological Train / Val / Test Split (Strict point-in-time time series split: 70% / 15% / 15%)
    n_records = len(clean_df)
    train_end_idx = int(0.70 * n_records)
    val_end_idx = int(0.85 * n_records)
    
    train_df = clean_df.iloc[:train_end_idx].copy()
    val_df = clean_df.iloc[train_end_idx:val_end_idx].copy()
    test_df = clean_df.iloc[val_end_idx:].copy()
    
    # Drop temporary datetime sorting col
    clean_df.drop(columns=['obs_dt'], inplace=True)
    train_df.drop(columns=['obs_dt'], inplace=True)
    val_df.drop(columns=['obs_dt'], inplace=True)
    test_df.drop(columns=['obs_dt'], inplace=True)
    
    # Save splits
    clean_df.to_csv(PROCESSED_DATA_DIR / 'cleaned_dataset.csv', index=False)
    train_df.to_csv(PROCESSED_DATA_DIR / 'train.csv', index=False)
    val_df.to_csv(PROCESSED_DATA_DIR / 'val.csv', index=False)
    test_df.to_csv(PROCESSED_DATA_DIR / 'test.csv', index=False)
    
    report = {
        'total_records': total_records,
        'valid_records': valid_records,
        'removed_records': removed_records,
        'duplicate_percentage': round((duplicate_count / total_records) * 100, 3),
        'missing_value_percentage': round((df.isnull().sum().sum() / (total_records * len(df.columns))) * 100, 3),
        'unique_trains': int(clean_df['train_number'].nunique()),
        'unique_stations': int(clean_df['station_code'].nunique()),
        'date_range': {
            'start': str(clean_df['journey_date'].min()),
            'end': str(clean_df['journey_date'].max())
        },
        'chronological_split': {
            'train_records': len(train_df),
            'train_date_range': [str(train_df['journey_date'].min()), str(train_df['journey_date'].max())],
            'val_records': len(val_df),
            'val_date_range': [str(val_df['journey_date'].min()), str(val_df['journey_date'].max())],
            'test_records': len(test_df),
            'test_date_range': [str(test_df['journey_date'].min()), str(test_df['journey_date'].max())]
        }
    }
    
    report_path = PROCESSED_DATA_DIR / 'data_quality_report.json'
    with open(report_path, 'w', encoding='utf-8') as f:
        json.dump(report, f, indent=2)
        
    print('Data Cleaning & Chronological Split Complete!')
    print(f'Train: {len(train_df)} | Val: {len(val_df)} | Test: {len(test_df)}')
    print(f'Quality Report saved to {report_path}')
    return report

if __name__ == '__main__':
    clean_and_profile_data()
