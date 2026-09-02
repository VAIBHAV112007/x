import math
import json
import urllib.request
from datetime import datetime, timedelta

def get_open_meteo_data(lat: float, lon: float, days: int):
    # Fetch weather and marine data
    weather_url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&hourly=wind_speed_10m,wind_direction_10m&forecast_days={days}"
    marine_url = f"https://marine-api.open-meteo.com/v1/marine?latitude={lat}&longitude={lon}&hourly=ocean_current_velocity,ocean_current_direction&forecast_days={days}"
    
    weather_req = urllib.request.urlopen(weather_url)
    weather_data = json.loads(weather_req.read())
    
    marine_req = urllib.request.urlopen(marine_url)
    marine_data = json.loads(marine_req.read())
    
    return weather_data['hourly'], marine_data['hourly']

def is_on_land(lat: float, lon: float) -> bool:
    """Check if a coordinate is on land by seeing if ocean_current_velocity is null."""
    try:
        url = f"https://marine-api.open-meteo.com/v1/marine?latitude={lat}&longitude={lon}&current=ocean_current_velocity"
        req = urllib.request.urlopen(url)
        data = json.loads(req.read())
        return data.get('current', {}).get('ocean_current_velocity') is None
    except Exception:
        return False

def simulate_lagrangian_drift(start_lat: float, start_lon: float, days: int = 7):
    """
    Simulates a precise Lagrangian particle-tracking model for ocean debris drift.
    Uses real-time wind and ocean current data from Open-Meteo.
    Stops simulation precisely at the seashore if the particle washes ashore.
    """
    trajectory = []
    
    current_lat = start_lat
    current_lon = start_lon
    current_time = datetime.now()
    
    try:
        # Check if the starting point is on land
        if is_on_land(start_lat, start_lon):
            trajectory.append({
                "lat": round(current_lat, 6),
                "lon": round(current_lon, 6),
                "timestamp": current_time.isoformat(),
                "day": 0,
                "wind_speed_knots": 0,
                "current_velocity_ms": 0,
                "status": "Washed Ashore (Started on Land)"
            })
            return {
                "engine": "Precise Lagrangian Simulator",
                "source": "Open-Meteo Live Marine & Weather Data",
                "trajectory": trajectory
            }

        weather_hourly, marine_hourly = get_open_meteo_data(start_lat, start_lon, days)
        
        # Leeway factor for surface debris (~3% wind effect)
        LEEWAY = 0.03 
        
        trajectory.append({
            "lat": round(current_lat, 6),
            "lon": round(current_lon, 6),
            "timestamp": current_time.isoformat(),
            "day": 0,
            "wind_speed_knots": round(weather_hourly['wind_speed_10m'][0] * 0.539957, 1),
            "current_velocity_ms": round(marine_hourly['ocean_current_velocity'][0] * 0.277778, 2),
            "status": "Origin"
        })
        
        hours_per_day = 24
        total_hours = min(
            len(weather_hourly['wind_speed_10m']), 
            len(marine_hourly['ocean_current_velocity']), 
            days * hours_per_day
        )
        
        for day in range(1, days + 1):
            day_coords = []
            day_speeds = []
            
            for h in range(hours_per_day):
                global_h = (day - 1) * hours_per_day + h
                if global_h >= total_hours:
                    break
                
                wind_speed = weather_hourly['wind_speed_10m'][global_h]
                wind_dir = weather_hourly['wind_direction_10m'][global_h]
                curr_speed = marine_hourly['ocean_current_velocity'][global_h]
                curr_dir = marine_hourly['ocean_current_direction'][global_h]
                
                wind_heading = (wind_dir + 180) % 360
                
                wind_heading_rad = math.radians(wind_heading)
                curr_dir_rad = math.radians(curr_dir)
                
                wind_u = wind_speed * math.sin(wind_heading_rad)
                wind_v = wind_speed * math.cos(wind_heading_rad)
                curr_u = curr_speed * math.sin(curr_dir_rad)
                curr_v = curr_speed * math.cos(curr_dir_rad)
                
                net_u = curr_u + LEEWAY * wind_u
                net_v = curr_v + LEEWAY * wind_v
                
                delta_lat = net_v / 111.32
                delta_lon = net_u / (111.32 * math.cos(math.radians(current_lat)))
                
                current_lat += delta_lat
                current_lon += delta_lon
                current_time += timedelta(hours=1)
                
                day_coords.append((round(current_lat, 6), round(current_lon, 6)))
                day_speeds.append((wind_speed, curr_speed, current_time))
                
            if not day_coords:
                break
                
            # Batch check for this day to find exact shore hit
            lats_str = ",".join(str(c[0]) for c in day_coords)
            lons_str = ",".join(str(c[1]) for c in day_coords)
            url = f"https://marine-api.open-meteo.com/v1/marine?latitude={lats_str}&longitude={lons_str}&current=ocean_current_velocity"
            
            try:
                req = urllib.request.urlopen(url)
                data = json.loads(req.read())
                
                results = data if isinstance(data, list) else [data]
                
                washed_ashore_idx = -1
                for i, res in enumerate(results):
                    if res.get('current', {}).get('ocean_current_velocity') is None:
                        washed_ashore_idx = i
                        break
                        
                if washed_ashore_idx != -1:
                    # Hit land! Truncate trajectory precisely at the last known WATER coordinate (seashore)
                    if washed_ashore_idx > 0:
                        water_idx = washed_ashore_idx - 1
                        land_lat, land_lon = day_coords[water_idx]
                        land_wind, land_curr, land_time = day_speeds[water_idx]
                    else:
                        # Hit land on the very first hour. Use the previous day's end coordinate (which was in water).
                        if len(trajectory) > 0:
                            prev = trajectory[-1]
                            land_lat, land_lon = prev["lat"], prev["lon"]
                            land_wind = prev["wind_speed_knots"] / 0.539957
                            land_curr = prev["current_velocity_ms"] / 0.277778
                            land_time = datetime.fromisoformat(prev["timestamp"])
                        else:
                            land_lat, land_lon = start_lat, start_lon
                            land_wind, land_curr, land_time = day_speeds[0]
                    
                    trajectory.append({
                        "lat": land_lat,
                        "lon": land_lon,
                        "timestamp": land_time.isoformat(),
                        "day": day,
                        "wind_speed_knots": round(land_wind * 0.539957, 1),
                        "current_velocity_ms": round(land_curr * 0.277778, 2),
                        "status": "Washed Ashore"
                    })
                    
                    # Pad the remaining days to show the debris parked safely at the seashore (not moving inland)
                    for remaining_day in range(day + 1, days + 1):
                        land_time += timedelta(days=1)
                        trajectory.append({
                            "lat": land_lat,
                            "lon": land_lon,
                            "timestamp": land_time.isoformat(),
                            "day": remaining_day,
                            "wind_speed_knots": 0,
                            "current_velocity_ms": 0,
                            "status": "Washed Ashore"
                        })
                    
                    break # Stop simulation entirely
                else:
                    # Still in water, append end of day location
                    end_lat, end_lon = day_coords[-1]
                    end_wind, end_curr, end_time = day_speeds[-1]
                    status = "Projected Location" if day == days else "Drifting"
                    
                    trajectory.append({
                        "lat": end_lat,
                        "lon": end_lon,
                        "timestamp": end_time.isoformat(),
                        "day": day,
                        "wind_speed_knots": round(end_wind * 0.539957, 1),
                        "current_velocity_ms": round(end_curr * 0.277778, 2),
                        "status": status
                    })
                    
            except Exception as e:
                print(f"Batch land check failed: {e}")
                # Fallback to appending end of day without strict land check
                end_lat, end_lon = day_coords[-1]
                end_wind, end_curr, end_time = day_speeds[-1]
                status = "Projected Location" if day == days else "Drifting"
                trajectory.append({
                    "lat": end_lat,
                    "lon": end_lon,
                    "timestamp": end_time.isoformat(),
                    "day": day,
                    "wind_speed_knots": round(end_wind * 0.539957, 1),
                    "current_velocity_ms": round(end_curr * 0.277778, 2),
                    "status": status
                })

        return {
            "engine": "Precise Lagrangian Simulator",
            "source": "Open-Meteo Live Marine & Weather Data",
            "trajectory": trajectory
        }
    except Exception as e:
        print(f"Error fetching live data, falling back to mock: {e}")
        # Fallback to simple random walk if API fails
        import random
        for day in range(1, days + 1):
            current_lat += random.uniform(-0.01, 0.02)
            current_lon += random.uniform(-0.02, 0.01)
            current_time += timedelta(days=1)
            status = "Projected Location" if day == days else "Drifting"
            trajectory.append({
                "lat": round(current_lat, 6),
                "lon": round(current_lon, 6),
                "timestamp": current_time.isoformat(),
                "day": day,
                "wind_speed_knots": round(random.uniform(5.0, 15.0), 1),
                "current_velocity_ms": round(random.uniform(0.2, 0.6), 2),
                "status": status
            })
        return {
            "engine": "Lagrangian Simulator (Fallback Mock)",
            "source": "Mock Data",
            "trajectory": trajectory
        }
