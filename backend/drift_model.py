import math
import json
import urllib.request
from datetime import datetime, timedelta
from concurrent.futures import ThreadPoolExecutor


def _fetch_json(url):
    req = urllib.request.urlopen(url, timeout=15)
    return json.loads(req.read())


def get_open_meteo_data(lat, lon, days):
    w = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&hourly=wind_speed_10m,wind_direction_10m&forecast_days={days}"
    m = f"https://marine-api.open-meteo.com/v1/marine?latitude={lat}&longitude={lon}&hourly=ocean_current_velocity,ocean_current_direction&forecast_days={days}"
    with ThreadPoolExecutor(2) as pool:
        wf, mf = pool.submit(_fetch_json, w), pool.submit(_fetch_json, m)
    return wf.result()['hourly'], mf.result()['hourly']


def batch_check_land(lats, lons):
    if not lats: return []
    ls = ','.join(f"{v:.6f}" for v in lats)
    lo = ','.join(f"{v:.6f}" for v in lons)
    try:
        d = _fetch_json(f"https://api.open-meteo.com/v1/elevation?latitude={ls}&longitude={lo}")
        return [e > 1.0 for e in d.get('elevation', [0]*len(lats))]
    except:
        return [False]*len(lats)


def reverse_geocode(lat, lon):
    try:
        url = f"https://nominatim.openstreetmap.org/reverse?lat={lat}&lon={lon}&format=json&zoom=16&addressdetails=1"
        req = urllib.request.Request(url, headers={'User-Agent': 'SagarDrishti/1.0'})
        data = json.loads(urllib.request.urlopen(req, timeout=10).read())
        dn = data.get('display_name', 'Unknown')
        a = data.get('address', {})
        parts = []
        for k in ['beach','bay','water','natural','leisure']:
            if k in a: parts.append(a[k])
        if not parts:
            for k in ['hamlet','suburb','neighbourhood','village','town','city']:
                if k in a: parts.append(a[k]); break
        for k in ['state_district','state','county']:
            if k in a: parts.append(a[k]); break
        name = ', '.join(parts) if parts else dn.split(',')[0].strip()
        low = dn.lower()
        if any(w in low for w in ['river','creek','nadi','nala','stream','khadi']): lt = "Riverbank"
        elif any(w in low for w in ['beach','shore','coast','harbour','harbor','port','marina','bandar','jetty']): lt = "Seashore"
        elif any(w in low for w in ['island','isle']): lt = "Island Shore"
        elif any(w in low for w in ['lake','reservoir']): lt = "Lakeshore"
        else: lt = "Coastline"
        return {"name": name, "type": lt, "full_address": dn}
    except:
        return {"name": f"Shore ({lat:.4f}N, {lon:.4f}E)", "type": "Coastline", "full_address": ""}


def haversine_km(lat1, lon1, lat2, lon2):
    R = 6371.0
    dl, dn = math.radians(lat2-lat1), math.radians(lon2-lon1)
    a = math.sin(dl/2)**2 + math.cos(math.radians(lat1))*math.cos(math.radians(lat2))*math.sin(dn/2)**2
    return R*2*math.asin(math.sqrt(a))


def traj_dist(t):
    return round(sum(haversine_km(t[i-1]["lat"],t[i-1]["lon"],t[i]["lat"],t[i]["lon"]) for i in range(1,len(t))),2)


def simulate_lagrangian_drift(start_lat, start_lon, days=7):
    traj = []
    cl, cn = start_lat, start_lon
    ct = datetime.now()
    li = None
    try:
        if batch_check_land([start_lat],[start_lon])[0]:
            traj.append({"lat":round(cl,6),"lon":round(cn,6),"timestamp":ct.isoformat(),"day":0,"wind_speed_knots":0,"current_velocity_ms":0,"status":"Started on Land"})
            g = reverse_geocode(start_lat, start_lon)
            return {"engine":"Precise Lagrangian Simulator","source":"Open-Meteo Live Marine & Weather Data","trajectory":traj,"landing_info":{"location_name":g["name"],"location_type":g["type"],"full_address":g["full_address"],"grounded_lat":round(start_lat,6),"grounded_lon":round(start_lon,6),"grounding_day":0,"drift_distance_km":0.0,"status":"Already on Land"}}

        wh, mh = get_open_meteo_data(start_lat, start_lon, days)
        LW = 0.03
        fw = wh['wind_speed_10m'][0] or 0
        fc = mh['ocean_current_velocity'][0] or 0
        traj.append({"lat":round(cl,6),"lon":round(cn,6),"timestamp":ct.isoformat(),"day":0,"wind_speed_knots":round(fw*0.539957,1),"current_velocity_ms":round(fc*0.277778,2),"status":"Origin"})

        HPD = 24
        th = min(len(wh['wind_speed_10m']),len(mh['ocean_current_velocity']),days*HPD)
        ap = []
        sl, sn, st = cl, cn, ct
        for gh in range(th):
            ws=wh['wind_speed_10m'][gh] or 0; wd=wh['wind_direction_10m'][gh] or 0
            cs=mh['ocean_current_velocity'][gh] or 0; cd=mh['ocean_current_direction'][gh] or 0
            whr=(wd+180)%360
            sl += (cs*math.cos(math.radians(cd))+LW*ws*math.cos(math.radians(whr)))/111.32
            sn += (cs*math.sin(math.radians(cd))+LW*ws*math.sin(math.radians(whr)))/(111.32*math.cos(math.radians(sl)))
            st += timedelta(hours=1)
            ap.append((round(sl,6),round(sn,6),ws,cs,st))

        de = [(d, d*HPD-1) for d in range(1,days+1) if d*HPD-1<len(ap)]
        dl = [ap[i][0] for _,i in de]; dn2 = [ap[i][1] for _,i in de]
        dland = batch_check_land(dl, dn2)

        fld = None; fldi = None
        for di,(day,_) in enumerate(de):
            if dland[di]: fld=day; fldi=di; break

        if fld is not None:
            sg = (fld-1)*HPD; eg = min(fld*HPD, len(ap))
            hl = [ap[g][0] for g in range(sg,eg)]; hn = [ap[g][1] for g in range(sg,eg)]
            hland = batch_check_land(hl, hn)
            flh = len(hland)-1
            for h,ol in enumerate(hland):
                if ol: flh=h; break
            lgh = sg+flh
            if flh>0: wl,wn = ap[sg+flh-1][0],ap[sg+flh-1][1]
            elif fldi and fldi>0: pi=de[fldi-1][1]; wl,wn=ap[pi][0],ap[pi][1]
            else: wl,wn = start_lat, start_lon
            ll,ln = ap[lgh][0],ap[lgh][1]
            shl,shn = round((wl+ll)/2,6), round((wn+ln)/2,6)
            g = reverse_geocode(shl, shn)
            for di2,(day,pi) in enumerate(de):
                if day<fld:
                    p=ap[pi]; traj.append({"lat":p[0],"lon":p[1],"timestamp":p[4].isoformat(),"day":day,"wind_speed_knots":round(p[2]*0.539957,1),"current_velocity_ms":round(p[3]*0.277778,2),"status":"Drifting"})
            lp=ap[lgh]
            traj.append({"lat":shl,"lon":shn,"timestamp":lp[4].isoformat(),"day":fld,"wind_speed_knots":round(lp[2]*0.539957,1),"current_velocity_ms":round(lp[3]*0.277778,2),"status":f"Grounded at {g['type']}"})
            li={"location_name":g["name"],"location_type":g["type"],"full_address":g["full_address"],"grounded_lat":shl,"grounded_lon":shn,"grounding_day":fld,"drift_distance_km":traj_dist(traj),"status":f"Grounded at {g['type']}"}
            pt=lp[4]
            for rd in range(fld+1,days+1):
                pt+=timedelta(days=1)
                traj.append({"lat":shl,"lon":shn,"timestamp":pt.isoformat(),"day":rd,"wind_speed_knots":0,"current_velocity_ms":0,"status":f"Grounded at {g['type']}"})
        else:
            for day,pi in de:
                p=ap[pi]; s="Projected Location" if day==days else "Drifting"
                traj.append({"lat":p[0],"lon":p[1],"timestamp":p[4].isoformat(),"day":day,"wind_speed_knots":round(p[2]*0.539957,1),"current_velocity_ms":round(p[3]*0.277778,2),"status":s})

        if not li:
            la=traj[-1] if traj else {"lat":start_lat,"lon":start_lon}
            li={"location_name":"Still at Sea","location_type":"Open Water","full_address":f"Lat: {la['lat']:.4f}, Lon: {la['lon']:.4f}","grounded_lat":la["lat"],"grounded_lon":la["lon"],"grounding_day":None,"drift_distance_km":traj_dist(traj),"status":"Still Drifting"}

        return {"engine":"Precise Lagrangian Simulator","source":"Open-Meteo Live Marine & Weather Data","trajectory":traj,"landing_info":li}
    except Exception as e:
        print(f"Drift error: {e}")
        import traceback; traceback.print_exc()
        import random
        for day in range(1,days+1):
            cl+=random.uniform(-0.01,0.02); cn+=random.uniform(-0.02,0.01); ct+=timedelta(days=1)
            traj.append({"lat":round(cl,6),"lon":round(cn,6),"timestamp":ct.isoformat(),"day":day,"wind_speed_knots":round(random.uniform(5,15),1),"current_velocity_ms":round(random.uniform(0.2,0.6),2),"status":"Projected Location" if day==days else "Drifting"})
        return {"engine":"Lagrangian Simulator (Fallback)","source":"Mock Data","trajectory":traj,"landing_info":{"location_name":"Unknown","location_type":"Unknown","full_address":"","grounded_lat":traj[-1]["lat"],"grounded_lon":traj[-1]["lon"],"grounding_day":days,"drift_distance_km":round(random.uniform(5,25),2),"status":"Fallback"}}
