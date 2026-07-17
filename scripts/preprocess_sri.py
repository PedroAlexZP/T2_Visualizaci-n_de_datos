from __future__ import annotations

import json
from pathlib import Path

import pandas as pd


BASE_DIR = Path(__file__).resolve().parents[1]
OUTPUT_DIR = BASE_DIR / "data"
OUTPUT_FILE = OUTPUT_DIR / "sri_ventas_story.json"

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

MONTHS = {
    1: "Enero",
    2: "Febrero",
    3: "Marzo",
    4: "Abril",
    5: "Mayo",
    6: "Junio",
    7: "Julio",
    8: "Agosto",
    9: "Septiembre",
    10: "Octubre",
    11: "Noviembre",
    12: "Diciembre",
}


def load_year(year: int) -> pd.DataFrame:
    frame = pd.read_csv(
        BASE_DIR / "data" / f"sri_ventas_{year}.csv",
        sep="|",
        encoding="latin-1",
        decimal=",",
    )
    frame["AÑO"] = frame["AÑO"].astype(int)
    frame["MES"] = frame["MES"].astype(int)
    frame["CODIGO_SECTOR_N1"] = frame["CODIGO_SECTOR_N1"].astype(str).str.strip().str.upper()
    frame["PROVINCIA"] = frame["PROVINCIA"].astype(str).str.strip()
    frame["SECTOR_N1"] = frame["CODIGO_SECTOR_N1"].map(SECTOR_MAP).fillna("No clasificado / Otros")
    return frame


def money(value: float) -> float:
    return round(float(value), 2)


def pct_change(previous: float, current: float) -> float:
    if previous == 0:
        return 0.0
    return round((current - previous) / previous * 100, 6)


def main() -> None:
    frames = [load_year(year) for year in (2023, 2024)]
    data = pd.concat(frames, ignore_index=True)

    annual_totals = data.groupby("AÑO", as_index=False)["TOTAL_VENTAS"].sum().sort_values("AÑO")

    monthly_by_year = (
        data.groupby(["AÑO", "MES"], as_index=False)["TOTAL_VENTAS"].sum().sort_values(["AÑO", "MES"])
    )
    monthly_combined = (
        data.groupby("MES", as_index=False)["TOTAL_VENTAS"].sum().sort_values("MES")
    )

    sector_totals = (
        data.groupby(["AÑO", "SECTOR_N1"], as_index=False)["TOTAL_VENTAS"].sum()
        .pivot(index="SECTOR_N1", columns="AÑO", values="TOTAL_VENTAS")
        .fillna(0)
    )
    sector_totals["pct_change"] = sector_totals.apply(
        lambda row: pct_change(row.get(2023, 0), row.get(2024, 0)), axis=1
    )
    sector_totals["abs_change"] = sector_totals.get(2024, 0) - sector_totals.get(2023, 0)
    sector_totals = sector_totals.sort_values("pct_change", ascending=False)

    province_totals = (
        data.groupby("PROVINCIA", as_index=False)["TOTAL_VENTAS"].sum().sort_values("TOTAL_VENTAS", ascending=False)
    )
    province_total_sum = float(province_totals["TOTAL_VENTAS"].sum())
    province_totals["share"] = province_totals["TOTAL_VENTAS"] / province_total_sum * 100

    positive_sector = sector_totals.sort_values("pct_change", ascending=False).head(1).reset_index()
    negative_sector = sector_totals.sort_values("pct_change", ascending=True).head(1).reset_index()

    monthly_by_year_payload = []
    for row in monthly_by_year.itertuples(index=False):
        monthly_by_year_payload.append(
            {
                "year": int(row.AÑO),
                "month": int(row.MES),
                "month_label": MONTHS[int(row.MES)],
                "total_ventas": money(row.TOTAL_VENTAS),
            }
        )

    monthly_combined_payload = []
    for row in monthly_combined.itertuples(index=False):
        monthly_combined_payload.append(
            {
                "month": int(row.MES),
                "month_label": MONTHS[int(row.MES)],
                "total_ventas": money(row.TOTAL_VENTAS),
            }
        )

    sector_ranking = []
    for sector_name, row in sector_totals.reset_index().iterrows():
        sector_ranking.append(
            {
                "sector": row["SECTOR_N1"],
                "ventas_2023": money(row.get(2023, 0)),
                "ventas_2024": money(row.get(2024, 0)),
                "pct_change": round(float(row["pct_change"]), 6),
                "abs_change": money(row["abs_change"]),
            }
        )

    province_ranking = []
    for row in province_totals.itertuples(index=False):
        province_ranking.append(
            {
                "provincia": row.PROVINCIA,
                "total_ventas": money(row.TOTAL_VENTAS),
                "share": round(float(row.share), 6),
            }
        )

    payload = {
        "source": {
            "name": "SRI Ecuador",
            "years": [2023, 2024],
            "note": "2024 está completo. Los montos provienen de los CSV con separador |, codificación Latin-1 y decimales con coma.",
        },
        "annual_totals": {
            str(int(row.AÑO)): money(row.TOTAL_VENTAS) for row in annual_totals.itertuples(index=False)
        },
        "monthly": {
            "by_year": monthly_by_year_payload,
            "combined": monthly_combined_payload,
        },
        "sectors": {
            "positive": {
                "sector": positive_sector.iloc[0]["SECTOR_N1"],
                "ventas_2023": money(positive_sector.iloc[0][2023]),
                "ventas_2024": money(positive_sector.iloc[0][2024]),
                "pct_change": round(float(positive_sector.iloc[0]["pct_change"]), 6),
                "abs_change": money(positive_sector.iloc[0]["abs_change"]),
            },
            "negative": {
                "sector": negative_sector.iloc[0]["SECTOR_N1"],
                "ventas_2023": money(negative_sector.iloc[0][2023]),
                "ventas_2024": money(negative_sector.iloc[0][2024]),
                "pct_change": round(float(negative_sector.iloc[0]["pct_change"]), 6),
                "abs_change": money(negative_sector.iloc[0]["abs_change"]),
            },
            "ranking": sector_ranking,
        },
        "provinces": {
            "ranking": province_ranking,
            "top3_share": round(float(province_totals.head(3)["TOTAL_VENTAS"].sum() / province_total_sum * 100), 6),
            "top5_share": round(float(province_totals.head(5)["TOTAL_VENTAS"].sum() / province_total_sum * 100), 6),
        },
        "methodology": {
            "decimal": ",",
            "separator": "|",
            "encoding": "latin-1",
            "sector_mapping": SECTOR_MAP,
        },
    }

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    OUTPUT_FILE.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote {OUTPUT_FILE.relative_to(BASE_DIR)}")
    print(f"Annual totals: {payload['annual_totals']}")
    print(f"Top positive sector: {payload['sectors']['positive']}")
    print(f"Top negative sector: {payload['sectors']['negative']}")
    print(f"Top province: {payload['provinces']['ranking'][0]}")


if __name__ == "__main__":
    main()
