import json
from pathlib import Path

import pandas as pd

BASE_DIR = Path(__file__).resolve().parents[1]
OUTPUT_DIR = BASE_DIR / "data"
OUTPUT_FILE = OUTPUT_DIR / "sri_ventas_province_sectors.json"

SECTOR_MAP = {
    "A": "Agricultura, ganadería, silvicultura y pesca",
    "B": "Explotación de minas y canteras",
    "C": "Industrias manufactureras",
    "D": "Suministro de electricidad, gas, vapor y aire acondicionado",
    "E": "Distribución de agua, alcantarillado y gestión de desechos",
    "F": "Construcción",
    "G": "Comercio al por mayor y al por menor; reparación de vehículos",
    "H": "Transporte y almacenamiento",
    "I": "Alojamiento y servicio de comidas",
    "J": "Información y comunicación",
    "K": "Actividades financieras y de seguros",
    "L": "Actividades inmobiliarias",
    "M": "Actividades profesionales, científicas y técnicas",
    "N": "Servicios administrativos y de apoyo",
    "O": "Administración pública y defensa",
    "P": "Enseñanza",
    "Q": "Salud humana y asistencia social",
    "R": "Artes, entretenimiento y recreación",
    "S": "Otras actividades de servicios",
    "T": "Actividades de los hogares como empleadores",
    "U": "Organizaciones y órganos extraterritoriales",
}


def load_year(year):
    return pd.read_csv(
        BASE_DIR / "data" / f"sri_ventas_{year}.csv",
        sep="|",
        encoding="latin-1",
        decimal=",",
    )


def main():
    frames = [load_year(year) for year in (2023, 2024)]
    data = pd.concat(frames, ignore_index=True)
    data["SECTOR_N1"] = data["CODIGO_SECTOR_N1"].astype(str).str.strip().str.upper().map(SECTOR_MAP).fillna("No clasificado / Otros")
    data["PROVINCIA"] = data["PROVINCIA"].astype(str).str.strip()

    agg = (
        data.groupby(["PROVINCIA", "SECTOR_N1"], as_index=False)["TOTAL_VENTAS"]
        .sum()
    )

    sector_totals = agg.groupby("SECTOR_N1", as_index=False)["TOTAL_VENTAS"].sum().sort_values("TOTAL_VENTAS", ascending=False)
    sector_list = sector_totals["SECTOR_N1"].tolist()

    province_sector = {}
    for _, row in agg.iterrows():
        prov = row["PROVINCIA"]
        sec = row["SECTOR_N1"]
        if prov not in province_sector:
            province_sector[prov] = {}
        province_sector[prov][sec] = float(round(row["TOTAL_VENTAS"], 2))

    total_ventas = float(agg["TOTAL_VENTAS"].sum())

    result = {
        "sectors": sector_list,
        "total_ventas": total_ventas,
        "data": province_sector,
    }

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    OUTPUT_FILE.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote {OUTPUT_FILE.relative_to(BASE_DIR)}")
    print(f"Sectors: {len(sector_list)}")
    print(f"Provinces: {len(province_sector)}")


if __name__ == "__main__":
    main()
