function createSeasonalityChart(data) {
  const byYear = data.monthly.by_year;
  const combined = data.monthly.combined;
  const maxMonth = combined.reduce((best, entry) => (entry.total_ventas > best.total_ventas ? entry : best), combined[0]);
  const minMonth = combined.reduce((best, entry) => (entry.total_ventas < best.total_ventas ? entry : best), combined[0]);

  setText("peak-month", maxMonth.month_label);
  setText("peak-value", formatShortMoney(maxMonth.total_ventas));
  setText("trough-month", minMonth.month_label);
  setText("trough-value", formatShortMoney(minMonth.total_ventas));

  const traces = [2023, 2024].map((year, index) => {
    const yearData = byYear.filter((entry) => entry.year === year);
    return {
      type: "scatter",
      mode: "lines+markers",
      name: String(year),
      x: yearData.map((entry) => MONTH_SHORT[entry.month]),
      y: yearData.map((entry) => toBillions(entry.total_ventas)),
      fill: index === 0 ? undefined : "tonexty",
      fillcolor: index === 0 ? "rgba(244, 184, 106, 0.15)" : "rgba(86, 199, 217, 0.15)",
      line: {
        width: 3,
        color: index === 0 ? "#f4b86a" : "#56c7d9",
      },
      marker: { size: 7 },
      hovertemplate: "%{x}<br>%{fullData.name}: %{y:.2f} mil millones<extra></extra>",
    };
  });

  const layout = buildPlotLayout({
    margin: { l: 58, r: 24, t: 30, b: 48 },
    xaxis: {
      ...buildPlotLayout().xaxis,
      categoryorder: "array",
      categoryarray: MONTH_ORDER.map((m) => MONTH_SHORT[m]),
      tickangle: 0,
      tickfont: { size: 13, color: "rgba(239, 246, 255, 0.8)" },
    },
    yaxis: {
      ...buildPlotLayout().yaxis,
      title: "Miles de millones de USD",
      tickformat: ".0f",
    },
    legend: {
      orientation: "h",
      y: 1.12,
      x: 0,
      font: { color: "rgba(239, 246, 255, 0.78)" },
    },
    hovermode: "x unified",
  });

  return Plotly.newPlot("seasonality-chart", traces, layout, {
    responsive: true,
    displaylogo: false,
    modeBarButtonsToRemove: ["zoom2d", "pan2d", "select2d", "lasso2d", "autoScale2d"],
    transition: { duration: 1200, easing: "cubic-in-out" }
  });
}
