"""
model.py
========
Isolation Forest để phát hiện anomaly lương và chấm công.
"""
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler


def detect_salary_anomalies(df: pd.DataFrame, contamination: float = 0.05):
    """
    Phát hiện anomaly lương.
    Trả về df với cột 'anomaly' (True = bất thường) và 'anomaly_score'.
    """
    if df.empty:
        return df

    features = ["NetSalary", "net_change_pct", "deduction_ratio", "Bonus", "Deductions"]
    X = df[features].fillna(0).values

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    model = IsolationForest(
        n_estimators=200,
        contamination=contamination,
        random_state=42,
        n_jobs=-1,
    )
    preds  = model.fit_predict(X_scaled)   # -1 = anomaly, 1 = normal
    scores = model.score_samples(X_scaled) # score thấp hơn = bất thường hơn

    df = df.copy()
    df["anomaly"]       = preds == -1
    df["anomaly_score"] = np.round(scores, 4)
    return df


def detect_attendance_anomalies(df: pd.DataFrame, contamination: float = 0.05):
    """
    Phát hiện anomaly chấm công.
    """
    if df.empty:
        return df

    features = ["AbsentDays", "absent_ratio", "OvertimeHours", "LeaveDays"]
    X = df[features].fillna(0).values

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    model = IsolationForest(
        n_estimators=200,
        contamination=contamination,
        random_state=42,
        n_jobs=-1,
    )
    preds  = model.fit_predict(X_scaled)
    scores = model.score_samples(X_scaled)

    df = df.copy()
    df["anomaly"]       = preds == -1
    df["anomaly_score"] = np.round(scores, 4)
    return df
