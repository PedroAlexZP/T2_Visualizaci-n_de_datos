import pandas as pd
import json
from datetime import datetime

MONTH_LABELS = {
    1: "Enero", 2: "Febrero", 3: "Marzo", 4: "Abril",
    5: "Mayo", 6: "Junio", 7: "Julio", 8: "Agosto",
    9: "Septiembre", 10: "Octubre", 11: "Noviembre", 12: "Diciembre"
}

# Leer CSVs y convertir TOTAL_VENTAS a float (cambiar coma por punto)
df23 = pd.read_csv('data/sri_ventas_2023.csv', sep='|', encoding='latin-1')
df24 = pd.read_csv('data/sri_ventas_2024.csv', sep='|', encoding='latin-1')

# Convertir TOTAL_VENTAS de string con coma a float
df23['TOTAL_VENTAS'] = df23['TOTAL_VENTAS'].astype(str).str.replace(',', '.').astype(float)
df24['TOTAL_VENTAS'] = df24['TOTAL_VENTAS'].astype(str).str.replace(',', '.').astype(float)

# Mapeo de códigos a nombres de sectores (consistente con preprocess_sri.py)
sector_names = {
    'A': 'Agricultura, ganadería, silvicultura y pesca',
    'B': 'Explotación de minas y canteras',
    'C': 'Industrias manufactureras',
    'D': 'Suministro de electricidad, gas, vapor y aire acondicionado',
    'E': 'Distribución de agua, alcantarillado y gestión de desechos',
    'F': 'Construcción',
    'G': 'Comercio al por mayor y al por menor; reparación de vehículos',
    'H': 'Transporte y almacenamiento',
    'I': 'Alojamiento y servicio de comidas',
    'J': 'Información y comunicación',
    'K': 'Actividades financieras y de seguros',
    'L': 'Actividades inmobiliarias',
    'M': 'Actividades profesionales, científicas y técnicas',
    'N': 'Servicios administrativos y de apoyo',
    'O': 'Administración pública y defensa',
    'P': 'Enseñanza',
    'Q': 'Salud humana y asistencia social',
    'R': 'Artes, entretenimiento y recreación',
    'S': 'Otras actividades de servicios',
    'T': 'Actividades de los hogares como empleadores',
    'U': 'Organizaciones y órganos extraterritoriales'
}

# Agrupar por mes y sector, filtrando solo valores > 0
grupo23 = df23[df23['TOTAL_VENTAS'] > 0].groupby(['MES', 'CODIGO_SECTOR_N1'])['TOTAL_VENTAS'].sum().reset_index()
grupo24 = df24[df24['TOTAL_VENTAS'] > 0].groupby(['MES', 'CODIGO_SECTOR_N1'])['TOTAL_VENTAS'].sum().reset_index()

# Construir estructura de datos
monthly_sectors = {}
for month in range(1, 13):
    month_label = MONTH_LABELS[month]
    
    # Datos para este mes
    data23 = grupo23[grupo23['MES'] == month].set_index('CODIGO_SECTOR_N1')
    data24 = grupo24[grupo24['MES'] == month].set_index('CODIGO_SECTOR_N1')
    
    # Sectores disponibles (solo los que tienen datos en ambos años)
    all_sectors = set(data23.index) | set(data24.index)
    
    rankings = []
    for sector_code in sorted(all_sectors):
        # Solo incluir si está en el mapeo
        if sector_code not in sector_names:
            continue
            
        ventas_2023 = float(data23.loc[sector_code, 'TOTAL_VENTAS']) if sector_code in data23.index else 0
        ventas_2024 = float(data24.loc[sector_code, 'TOTAL_VENTAS']) if sector_code in data24.index else 0
        
        if ventas_2023 > 0:
            pct_change = ((ventas_2024 - ventas_2023) / ventas_2023) * 100
        else:
            pct_change = 0 if ventas_2024 == 0 else 100
        
        abs_change = ventas_2024 - ventas_2023
        
        rankings.append({
            'sector': sector_names[sector_code],
            'sector_code': sector_code,
            'ventas_2023': ventas_2023,
            'ventas_2024': ventas_2024,
            'pct_change': float(pct_change),
            'abs_change': float(abs_change)
        })
    
    # Ordenar por variación porcentual descendente
    rankings.sort(key=lambda x: x['pct_change'], reverse=True)
    
    monthly_sectors[month] = {
        'month': month,
        'month_label': month_label,
        'rankings': rankings
    }

# Guardar
with open('data/sri_ventas_monthly_sectors.json', 'w', encoding='utf-8') as f:
    json.dump(monthly_sectors, f, ensure_ascii=False, indent=2)

print("✓ Archivo actualizado: data/sri_ventas_monthly_sectors.json")
print(f"✓ Datos para 12 meses procesados")
for month in [1, 6, 12]:
    count = len(monthly_sectors[month]['rankings'])
    print(f"  - {MONTH_LABELS[month]}: {count} sectores con datos")

