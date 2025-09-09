import io
import folium
import joblib
import datetime
import numpy as np
import gradio as gr
import pandas as pd
from PIL import Image
import matplotlib.pyplot as plt


# Load model and scaler
lgb_model = joblib.load("lgb_occupancy_model.pkl")
scaler = joblib.load("scaler.pkl")

# Load data for historical patterns (you may want to refactor this)
model_df = pd.read_pickle("Cluster_Demand_model_df.pkl")
holiday_dates = pd.read_json("holidays_2022_2025.json")['date']
holiday_dates = pd.to_datetime(holiday_dates).dt.normalize()
holiday_dates = set(holiday_dates)
feature_columns = joblib.load('feature_columns.pkl')

# Load properties data
properties_df = pd.read_csv('CTVNS_Properties.csv')
properties_cols_to_keep = ['Property Name','Property ID', 'Star Rating', 'Property Type', 'Distance from Center','Latitude','Longitude']
properties_filtered_df = properties_df[properties_cols_to_keep].copy()

# Create dropdown options with property name or ID
property_options = properties_filtered_df['Property Name'].astype(str).tolist()

property_type_mapping = {
     'Hotel': 9,
     'Homestay': 7,
     'Guest House': 5,
     'Resort': 11,
     'Hostel': 8,
     'BnB': 2,
     'Villa': 12,
     'Apartment': 1,
     'Apart-hotel': 0,
     'Holiday Home': 6,
     'Cottage': 3,
     'Lodge': 10,
     'Farm House': 4
    }

def forecast_by_property(property_name,adr):
    # Find the selected row
    selected_row = properties_filtered_df[properties_filtered_df['Property Name'].astype(str) == property_name]
    if selected_row.empty:
        return pd.DataFrame({'Error': ['Property Name not found.']})
    
    star_rating = int(selected_row['Star Rating'].values[0])
    property_type_str = selected_row['Property Type'].values[0]
    property_type_cat = property_type_mapping.get(property_type_str, -1)
    distance = float(selected_row['Distance from Center'].values[0])
    lat = selected_row['Latitude']
    lon = selected_row['Longitude']

    # Call your original forecast function
    return forecast(star_rating, property_type_cat, distance,lat,lon,property_name,adr)

def forecast_segment_all_features(starRating, propertyType_cat, distanceFromCenter, model_df, cutoff_date, end_date, scaler, lgb_model, full_feature_cols, X_train, holiday_dates, tolerance=0.1):
    """Forecasts occupancy for a given segment."""
    cluster_hist = model_df[
        (model_df['starRating'] == starRating) &
        (model_df['propertyType_cat'] == propertyType_cat) &
        (np.abs(model_df['distanceFromCenter'] - distanceFromCenter) <= tolerance) &
        (model_df['date'] <= cutoff_date)
    ].sort_values('date')

    if cluster_hist.empty:
        print(f"Warning: No historical data found for segment ({starRating}, {propertyType_cat}, {distanceFromCenter}) up to {cutoff_date}.")
        return None

    extended_series = pd.DataFrame({'date': pd.date_range(start=cluster_hist['date'].min(), end=end_date)})
    extended_series = extended_series.merge(cluster_hist[['date', 'occupiedRooms']], on='date', how='left').rename(columns={'occupiedRooms': 'occupied'})

    for i in range(len(extended_series)):
        current_date = extended_series.at[i, 'date']
        if current_date <= pd.to_datetime(cutoff_date):
            continue

        day_of_week = current_date.dayofweek
        day_of_year = current_date.timetuple().tm_yday
        month = current_date.month
        year = current_date.year

        is_weekend = 1 if day_of_week in [4, 5] else 0
        is_holiday = 1 if current_date in holiday_dates else 0

        day_of_week_sin = np.sin(2 * np.pi * day_of_week / 7)
        day_of_year_sin = np.sin(2 * np.pi * day_of_year / 365.25)
        month_sin = np.sin(2 * np.pi * month / 12)
        base_year = model_df['date'].dt.year.min()
        year_scaled = year - base_year

        lags = {}
        for lag in [1, 7, 15]:
            lags[f'lag_{lag}'] = extended_series.at[i - lag, 'occupied'] if i - lag >= 0 else np.nan

        rolling_stats = {}
        for window in [3, 7, 15]:
            window_data = extended_series['occupied'].iloc[i - window:i] if i >= window else extended_series['occupied'].iloc[:i]
            rolling_stats[f'rolling_{window}_mean'] = window_data.mean() if len(window_data) > 0 else np.nan
            rolling_stats[f'rolling_{window}_std'] = window_data.std(ddof=0) if len(window_data) > 0 else np.nan

        daily_change = extended_series.at[i, 'occupied'] - extended_series.at[i - 1, 'occupied'] if i > 0 and pd.notnull(extended_series.at[i - 1, 'occupied']) and pd.notnull(extended_series.at[i, 'occupied']) else np.nan

        feature_vector = {
            'starRating': starRating, 'distanceFromCenter': distanceFromCenter,
            'day_of_week_sin': day_of_week_sin, 'day_of_year_sin': day_of_year_sin, 'month_sin': month_sin,
            'year_scaled': year_scaled, 'is_weekend': is_weekend, 'is_holiday': is_holiday,
            'lag_1': lags.get('lag_1', np.nan), 'lag_7': lags.get('lag_7', np.nan), 'lag_15': lags.get('lag_15', np.nan),
            'rolling_3_mean': rolling_stats.get('rolling_3_mean', np.nan), 'rolling_3_std': rolling_stats.get('rolling_3_std', np.nan),
            'rolling_7_mean': rolling_stats.get('rolling_7_mean', np.nan), 'rolling_7_std': rolling_stats.get('rolling_7_std', np.nan),
            'rolling_15_mean': rolling_stats.get('rolling_15_mean', np.nan), 'rolling_15_std': rolling_stats.get('rolling_15_std', np.nan),
            'daily_change': daily_change,
        }
        for j in range (10):
            feature_vector[f'prop_type_{j}'] = 1 if propertyType_cat == j else 0

        features = pd.DataFrame([feature_vector])
        features = features.reindex(columns=feature_columns)
        features.fillna(X_train.mean(numeric_only=True), inplace=True)  # or another imputation strategy
        features_scaled = scaler.transform(features)
        pred = lgb_model.predict(features_scaled)[0]
        extended_series.at[i, 'occupied'] = pred
        if i > 0:
            extended_series.at[i, 'daily_change'] = pred - extended_series.at[i - 1, 'occupied']

    future_df = extended_series[extended_series['date'] > pd.to_datetime(cutoff_date)].copy()
    future_df['starRating'] = starRating
    future_df['distanceFromCenter'] = distanceFromCenter
    future_df['propertyType_cat'] = propertyType_cat
    return future_df



def forecast(starRating, propertyType_cat, distanceFromCenter,lat,lon,property_name,adr):
    cutoff_date = datetime.datetime.today()
    start_date = cutoff_date - pd.Timedelta(days=30)
    end_date = cutoff_date + pd.Timedelta(days=30)

    # Filter last 30 days of actuals from model_df
    actual_df = model_df[
        (model_df['starRating'] == starRating) &
        (model_df['propertyType_cat'] == propertyType_cat) &
        (model_df['distanceFromCenter'] == distanceFromCenter) &
        (model_df['date'] >= start_date) &
        (model_df['date'] <= cutoff_date)
    ][['date', 'occupiedRooms']].copy()
    actual_df.rename(columns={'occupiedRooms': 'occupied'}, inplace=True)
    actual_df['occupied'] = actual_df['occupied'] * 1.75
    actual_df['occupied'] = np.ceil(actual_df['occupied'])

    actual_df['source'] = 'Actual'
    

    # Forecast next 30 days
    future_df = forecast_segment_all_features(
        starRating=starRating,
        propertyType_cat=propertyType_cat,
        distanceFromCenter=distanceFromCenter,
        model_df=model_df,
        cutoff_date=cutoff_date,
        end_date=end_date,
        scaler=scaler,
        lgb_model=lgb_model,
        full_feature_cols=None,
        X_train=model_df,
        holiday_dates=holiday_dates,
        tolerance=0.1
    )

    if future_df is None:
        return None, pd.DataFrame(columns=['date', 'occupied'])

    future_df = future_df[['date', 'occupied']].copy()
    future_df['occupied'] = np.ceil(future_df['occupied'])
    future_df['occupied'] = future_df['occupied'] * 1.75
    future_df['occupied'] = np.ceil(future_df['occupied'])
    future_df['source'] = 'Forecast'
    
    forecasted_rns = int(future_df['occupied'].sum())
    forecasted_revenue = int(forecasted_rns * adr)
    
    # Combine actual and forecast
    combined_df = pd.concat([actual_df, future_df], ignore_index=True)
    # Plot
    plt.figure(figsize=(10, 4))
    for label, df in combined_df.groupby('source'):
        plt.plot(df['date'], df['occupied'], label=label, marker='o')

    plt.xticks(rotation=45)
    plt.xlabel("Date")
    plt.ylabel("Occupancy")
    plt.title("Hotel Occupancy: Last 30 Days (Actual) + Next 30 Days (Forecast)")
    plt.grid(True)
    plt.legend()

    # Save plot to image buffer
    buf = io.BytesIO()
    plt.tight_layout()
    plt.savefig(buf, format='png')
    plt.close()
    buf.seek(0)
    image = Image.open(buf)
    
    folium_map = folium.Map(location=[lat, lon], zoom_start=15)
    folium.Marker([lat, lon], tooltip=property_name).add_to(folium_map)
    map_html = folium_map._repr_html_()

#     return image, future_df[['date', 'occupied']],map_html
    return image,forecasted_rns,forecasted_revenue,map_html


model_df.columns

demo = gr.Interface(
    fn=forecast_by_property,
    inputs=[
        gr.Dropdown(
            choices=property_options,
            label="Select Property",
            info="Choose from the list of properties (searchable)",
            interactive=True
        ),
        gr.Number(
            label="Average Daily Rate (ADR)",
            info="Enter the expected ADR in your currency",
            interactive=True
        )
    ],
    outputs=[
        gr.Image(type="pil", label="Forecast Plot"),
        gr.Number(label="Total Forecasted Room Nights", precision=0),
        gr.Number(label="Total Forecasted Revenue", precision=0),
        gr.HTML(label="Map")
    ],
    title="Hotel Occupancy Segment Forecast",
    description="Forecasts the next 30 days of occupancy for a selected hotel segment.",
    flagging_mode='never'
)

if __name__ == "__main__":
    demo.launch(share=True)
