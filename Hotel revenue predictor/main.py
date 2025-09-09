from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import io
import base64
import folium
import joblib
import datetime
import numpy as np
import pandas as pd
from PIL import Image
import matplotlib.pyplot as plt
from typing import List, Dict, Any
import json
import httpx
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = FastAPI(title="Hotel Occupancy Forecast API", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080", "http://localhost:3000"],  # Add your frontend URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Supabase configuration
SUPABASE_URL = "https://pyxpulmqxslhegngzlac.supabase.co"
SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB5eHB1bG1xeHNsaGVnbmd6bGFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwNTIzNjAsImV4cCI6MjA3MTYyODM2MH0.rrZv1VyKNruLu_vRm48PNn_acAczkWxA3pcrbZJtxds"

# Load model and data (same as your original code)
try:
    lgb_model = joblib.load("lgb_occupancy_model.pkl")
    scaler = joblib.load("scaler.pkl")
    model_df = pd.read_pickle("Cluster_Demand_model_df.pkl")
    holiday_dates = pd.read_json("holidays_2022_2025.json")['date']
    holiday_dates = pd.to_datetime(holiday_dates).dt.normalize()
    holiday_dates = set(holiday_dates)
    feature_columns = joblib.load('feature_columns.pkl')
    properties_df = pd.read_csv('CTVNS_Properties.csv')
    properties_cols_to_keep = ['Property Name','Property ID', 'Star Rating', 'Property Type', 'Distance from Center','Latitude','Longitude']
    properties_filtered_df = properties_df[properties_cols_to_keep].copy()
    property_options = properties_filtered_df['Property Name'].astype(str).tolist()
    print("Model and data loaded successfully")
except Exception as e:
    print(f"Warning: Could not load model files: {e}")
    # Create dummy data for testing
    properties_filtered_df = pd.DataFrame()
    property_options = []

property_type_mapping = {
    'Hotel': 9, 'Homestay': 7, 'Guest House': 5, 'Resort': 11,
    'Hostel': 8, 'BnB': 2, 'Villa': 12, 'Apartment': 1,
    'Apart-hotel': 0, 'Holiday Home': 6, 'Cottage': 3,
    'Lodge': 10, 'Farm House': 4
}

# Pydantic models
class ForecastRequest(BaseModel):
    property_name: str
    adr: float

class ForecastResponse(BaseModel):
    plot_image: str  # base64 encoded image
    total_room_nights: int
    total_revenue: int
    map_html: str
    success: bool
    message: str = ""

class PropertyInfo(BaseModel):
    name: str
    id: str
    star_rating: float
    property_type: str
    distance_from_center: float
    latitude: float
    longitude: float

# Supabase helper functions
async def get_properties_from_supabase():
    """Fetch properties from Supabase profiles table"""
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        raise HTTPException(status_code=500, detail="Supabase configuration missing")
    
    async with httpx.AsyncClient() as client:
        headers = {
            "apikey": SUPABASE_SERVICE_KEY,
            "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
            "Content-Type": "application/json"
        }
        
        response = await client.get(
            f"{SUPABASE_URL}/rest/v1/profiles?select=name",
            headers=headers
        )
        
        if response.status_code == 200:
            data = response.json()
            return [profile['name'] for profile in data if profile.get('name')]
        else:
            raise HTTPException(
                status_code=response.status_code, 
                detail=f"Failed to fetch from Supabase: {response.text}"
            )

# Your existing forecast functions (copied from your code)
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
        for j in range(10):
            feature_vector[f'prop_type_{j}'] = 1 if propertyType_cat == j else 0

        features = pd.DataFrame([feature_vector])
        features = features.reindex(columns=feature_columns)
        features.fillna(X_train.mean(numeric_only=True), inplace=True)
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

def forecast_by_property_api(property_name: str, adr: float):
    """Modified version of your forecast function for API use"""
    try:
        # Find the selected row
        selected_row = properties_filtered_df[properties_filtered_df['Property Name'].astype(str) == property_name]
        if selected_row.empty:
            raise HTTPException(status_code=404, detail="Property Name not found.")
        
        star_rating = int(selected_row['Star Rating'].values[0])
        property_type_str = selected_row['Property Type'].values[0]
        property_type_cat = property_type_mapping.get(property_type_str, -1)
        distance = float(selected_row['Distance from Center'].values[0])
        lat = float(selected_row['Latitude'].values[0])
        lon = float(selected_row['Longitude'].values[0])

        # Call forecast
        cutoff_date = datetime.datetime.today()
        start_date = cutoff_date - pd.Timedelta(days=30)
        end_date = cutoff_date + pd.Timedelta(days=30)

        # Filter last 30 days of actuals
        actual_df = model_df[
            (model_df['starRating'] == star_rating) &
            (model_df['propertyType_cat'] == property_type_cat) &
            (model_df['distanceFromCenter'] == distance) &
            (model_df['date'] >= start_date) &
            (model_df['date'] <= cutoff_date)
        ][['date', 'occupiedRooms']].copy()
        
        actual_df.rename(columns={'occupiedRooms': 'occupied'}, inplace=True)
        actual_df['occupied'] = actual_df['occupied'] * 1.75
        actual_df['occupied'] = np.ceil(actual_df['occupied'])
        actual_df['source'] = 'Actual'

        # Forecast next 30 days
        future_df = forecast_segment_all_features(
            starRating=star_rating,
            propertyType_cat=property_type_cat,
            distanceFromCenter=distance,
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
            raise HTTPException(status_code=500, detail="Unable to generate forecast")

        future_df = future_df[['date', 'occupied']].copy()
        future_df['occupied'] = np.ceil(future_df['occupied'])
        future_df['occupied'] = future_df['occupied'] * 1.75
        future_df['occupied'] = np.ceil(future_df['occupied'])
        future_df['source'] = 'Forecast'
        
        forecasted_rns = int(future_df['occupied'].sum())
        forecasted_revenue = int(forecasted_rns * adr)
        
        # Combine actual and forecast
        combined_df = pd.concat([actual_df, future_df], ignore_index=True)
        
        # Create plot
        plt.figure(figsize=(12, 6))
        for label, df in combined_df.groupby('source'):
            plt.plot(df['date'], df['occupied'], label=label, marker='o', linewidth=2)

        plt.xticks(rotation=45)
        plt.xlabel("Date")
        plt.ylabel("Occupancy")
        plt.title(f"Hotel Occupancy Forecast - {property_name}")
        plt.grid(True, alpha=0.3)
        plt.legend()

        # Convert plot to base64
        buf = io.BytesIO()
        plt.tight_layout()
        plt.savefig(buf, format='png', dpi=150, bbox_inches='tight')
        plt.close()
        buf.seek(0)
        image_base64 = base64.b64encode(buf.getvalue()).decode()
        
        # Create map
        folium_map = folium.Map(location=[lat, lon], zoom_start=15)
        folium.Marker([lat, lon], tooltip=property_name).add_to(folium_map)
        map_html = folium_map._repr_html_()

        return ForecastResponse(
            plot_image=image_base64,
            total_room_nights=forecasted_rns,
            total_revenue=forecasted_revenue,
            map_html=map_html,
            success=True
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Forecast error: {str(e)}")

# API Endpoints
@app.get("/")
async def root():
    return {"message": "Hotel Occupancy Forecast API", "version": "1.0.0"}

@app.get("/properties", response_model=List[str])
async def get_properties():
    """Get list of available properties from Supabase or fallback to CSV"""
    try:
        # First try to get from Supabase
        if SUPABASE_URL and SUPABASE_SERVICE_KEY:
            try:
                properties = await get_properties_from_supabase()
                if properties:
                    return properties
            except Exception as supabase_error:
                print(f"Supabase error: {supabase_error}")
                # Fall through to CSV fallback
        
        # Fallback to CSV file
        df = pd.read_csv("CTVNS_Properties.csv")
        if "Property Name" not in df.columns:
            raise HTTPException(status_code=500, detail="CSV must contain 'Property Name' column")
        return df["Property Name"].dropna().astype(str).tolist()
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading properties: {str(e)}")

@app.get("/properties/supabase", response_model=List[str])
async def get_properties_supabase_only():
    """Get properties specifically from Supabase (for testing)"""
    try:
        return await get_properties_from_supabase()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Supabase error: {str(e)}")

@app.get("/properties/details", response_model=List[PropertyInfo])
async def get_property_details():
    """Get detailed information about all properties"""
    if properties_filtered_df.empty:
        return []
    
    properties_list = []
    for _, row in properties_filtered_df.iterrows():
        properties_list.append(PropertyInfo(
            name=str(row['Property Name']),
            id=str(row['Property ID']),
            star_rating=float(row['Star Rating']),
            property_type=str(row['Property Type']),
            distance_from_center=float(row['Distance from Center']),
            latitude=float(row['Latitude']),
            longitude=float(row['Longitude'])
        ))
    
    return properties_list

@app.post("/forecast", response_model=ForecastResponse)
async def create_forecast(request: ForecastRequest):
    """Generate occupancy forecast for a property"""
    if not request.property_name:
        raise HTTPException(status_code=400, detail="Property name is required")
    
    if request.adr <= 0:
        raise HTTPException(status_code=400, detail="ADR must be greater than 0")
    
    return forecast_by_property_api(request.property_name, request.adr)

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy", 
        "timestamp": datetime.datetime.now().isoformat(),
        "supabase_configured": bool(SUPABASE_URL and SUPABASE_SERVICE_KEY)
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=9000)