function createSectorChart(targetId, ranking, mode) {
  const filtered = [...ranking]
    .filter((entry) => (mode === "positive" ? entry.pct_change >= 0 : entry.pct_change < 0))
    .sort((left, right) => (mode === "positive" ? right.pct_change - left.pct_change : left.pct_change - right.pct_change));

  const displayFiltered = filtered.slice(0, 14);

  if (mode === "positive") {
    displayFiltered.reverse();
  }

  const sectorKey = mode === "positive" ? "growth" : "decline";
  annualSectorNames[sectorKey] = displayFiltered.map(entry => entry.sector);

  const color = mode === "positive" ? "#47d18c" : "#ff7f7f";
  const darkColor = mode === "positive" ? "#2a8a54" : "#cc4444";

  const xLines = [];
  const yLines = [];
  displayFiltered.forEach((entry) => {
    xLines.push(0);
    xLines.push(entry.pct_change);
    xLines.push(null);
    yLines.push(entry.sector);
    yLines.push(entry.sector);
    yLines.push(null);
  });

  const traces = [
    {
      type: "scatter",
      mode: "lines",
      x: xLines,
      y: yLines,
      line: { width: 3, color: color },
      hoverinfo: "skip",
      showlegend: false,
    },
    {
      type: "scatter",
      mode: "markers",
      x: displayFiltered.map((entry) => entry.pct_change),
      y: displayFiltered.map((entry) => entry.sector),
      marker: {
        size: 16,
        color: color,
        symbol: "circle",
        line: { width: 3, color: darkColor }
      },
      hovertemplate:
        "<b>%{y}</b><br>Variación: %{x:.2f}%<br>2023: %{customdata[0]:$,.0f}<br>2024: %{customdata[1]:$,.0f}<extra></extra>",
      customdata: displayFiltered.map((entry) => [entry.ventas_2023, entry.ventas_2024]),
      showlegend: false,
    },
  ];

  const layout = buildPlotLayout({
    margin: { l: 180, r: 36, t: 24, b: 48 },
    xaxis: {
      ...buildPlotLayout().xaxis,
      title: "Variación porcentual interanual",
      tickformat: ".1f",
      zeroline: true,
      zerolinecolor: "rgba(255,255,255,0.22)",
      zerolinewidth: 2,
    },
    yaxis: {
      ...buildPlotLayout().yaxis,
      automargin: true,
    },
    hovermode: "closest",
  });

  return Plotly.newPlot(targetId, traces, layout, {
    responsive: true,
    displaylogo: false,
    modeBarButtonsToRemove: ["zoom2d", "pan2d", "select2d", "lasso2d", "autoScale2d"],
    transition: { duration: 1200, easing: "cubic-in-out" }
  });
}
