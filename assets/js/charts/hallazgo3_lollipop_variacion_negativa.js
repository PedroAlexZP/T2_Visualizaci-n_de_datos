function redrawSectorChartForMonth(monthlySectorData, month, targetId, mode) {
  if (!monthlySectorData || !monthlySectorData[month]) {
    console.error(`No data available for month ${month}`);
    return;
  }

  const monthData = monthlySectorData[month];
  const rankings = monthData.rankings;
  let filtered;

  if (mode === "all_monthly") {
    filtered = [...rankings].sort((a, b) => b.pct_change - a.pct_change);
  } else {
    filtered = [...rankings]
      .filter((entry) => (mode === "positive" ? entry.pct_change >= 0 : entry.pct_change < 0))
      .sort((left, right) => (mode === "positive" ? right.pct_change - left.pct_change : left.pct_change - right.pct_change))
      .slice(0, 8);

    if (mode === "positive") {
      filtered.reverse();
    }
  }

  let traces;

  if (mode === "all_monthly") {
    const positiveData = filtered.filter(e => e.pct_change >= 0);
    const negativeData = filtered.filter(e => e.pct_change < 0);

    traces = [];

    if (positiveData.length > 0) {
      const xLinesPos = [];
      const yLinesPos = [];
      positiveData.forEach((entry) => {
        xLinesPos.push(0);
        xLinesPos.push(entry.pct_change);
        xLinesPos.push(null);
        yLinesPos.push(entry.sector);
        yLinesPos.push(entry.sector);
        yLinesPos.push(null);
      });

      traces.push({
        type: "scatter",
        mode: "lines",
        x: xLinesPos,
        y: yLinesPos,
        line: { width: 3, color: "#47d18c" },
        hoverinfo: "skip",
        showlegend: false,
      });

      traces.push({
        type: "scatter",
        mode: "markers",
        x: positiveData.map((e) => e.pct_change),
        y: positiveData.map((e) => e.sector),
        marker: {
          size: 12,
          color: "#47d18c",
          symbol: "circle",
          line: { width: 3, color: "#2a8a54" }
        },
        hovertemplate:
          "<b>%{y}</b><br>Variación: %{x:.2f}%<br>2023: %{customdata[0]:$,.0f}<br>2024: %{customdata[1]:$,.0f}<extra></extra>",
        customdata: positiveData.map((entry) => [entry.ventas_2023, entry.ventas_2024]),
        showlegend: false,
      });
    }

    if (negativeData.length > 0) {
      const xLinesNeg = [];
      const yLinesNeg = [];
      negativeData.forEach((entry) => {
        xLinesNeg.push(0);
        xLinesNeg.push(entry.pct_change);
        xLinesNeg.push(null);
        yLinesNeg.push(entry.sector);
        yLinesNeg.push(entry.sector);
        yLinesNeg.push(null);
      });

      traces.push({
        type: "scatter",
        mode: "lines",
        x: xLinesNeg,
        y: yLinesNeg,
        line: { width: 3, color: "#ff7f7f" },
        hoverinfo: "skip",
        showlegend: false,
      });

      traces.push({
        type: "scatter",
        mode: "markers",
        x: negativeData.map((e) => e.pct_change),
        y: negativeData.map((e) => e.sector),
        marker: {
          size: 12,
          color: "#ff7f7f",
          symbol: "circle",
          line: { width: 3, color: "#cc4444" }
        },
        hovertemplate:
          "<b>%{y}</b><br>Variación: %{x:.2f}%<br>2023: %{customdata[0]:$,.0f}<br>2024: %{customdata[1]:$,.0f}<extra></extra>",
        customdata: negativeData.map((entry) => [entry.ventas_2023, entry.ventas_2024]),
        showlegend: false,
      });
    }
  } else {
    const color = mode === "positive" ? "#47d18c" : "#ff7f7f";
    const darkColor = mode === "positive" ? "#2a8a54" : "#cc4444";

    const xLines = [];
    const yLines = [];
    filtered.forEach((entry) => {
      xLines.push(0);
      xLines.push(entry.pct_change);
      xLines.push(null);
      yLines.push(entry.sector);
      yLines.push(entry.sector);
      yLines.push(null);
    });

    traces = [
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
        x: filtered.map((entry) => entry.pct_change),
        y: filtered.map((entry) => entry.sector),
        marker: {
          size: 16,
          color: color,
          symbol: "circle",
          line: { width: 3, color: darkColor }
        },
        hovertemplate:
          "<b>%{y}</b><br>Variación: %{x:.2f}%<br>2023: %{customdata[0]:$,.0f}<br>2024: %{customdata[1]:$,.0f}<extra></extra>",
        customdata: filtered.map((entry) => [entry.ventas_2023, entry.ventas_2024]),
        showlegend: false,
      },
    ];
  }

  const layout = buildPlotLayout({
    margin: { l: 180, r: 36, t: 24, b: 48 },
    height: mode === "all_monthly" ? Math.max(600, filtered.length * 18) : undefined,
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
      categoryorder: "array",
      categoryarray: filtered.map((entry) => entry.sector),
    },
    hovermode: "closest",
  });

  Plotly.react(targetId, traces, layout, {
    responsive: true,
    displaylogo: false,
    modeBarButtonsToRemove: ["zoom2d", "pan2d", "select2d", "lasso2d", "autoScale2d"],
    transition: { duration: 1200, easing: "cubic-in-out" }
  });
}

function redrawSectorChartForMonthFiltered(monthlySectorData, month, targetId, sectorType) {
  if (!monthlySectorData || !monthlySectorData[month]) {
    console.error(`No data available for month ${month}`);
    return;
  }

  const monthData = monthlySectorData[month];
  const allRankings = monthData.rankings;

  const sectorNamesToShow = sectorType === "growth" ? annualSectorNames.growth : annualSectorNames.decline;
  const filtered = [];
  const seenSectors = new Set();

  for (const annualName of sectorNamesToShow) {
    const match = allRankings.find(r => r.sector === annualName || normalizeSectorName(annualName) === r.sector);
    if (match) {
      if (!seenSectors.has(match.sector)) {
        filtered.push(match);
        seenSectors.add(match.sector);
      }
    } else {
      filtered.push({
        sector: annualName,
        ventas_2023: 0,
        ventas_2024: 0,
        pct_change: 0,
        abs_change: 0,
      });
    }
  }

  const positiveData = filtered.filter(e => e.pct_change >= 0);
  const negativeData = filtered.filter(e => e.pct_change < 0);

  let traces = [];

  if (positiveData.length > 0) {
    const xLinesPos = [];
    const yLinesPos = [];
    positiveData.forEach((entry) => {
      xLinesPos.push(0);
      xLinesPos.push(entry.pct_change);
      xLinesPos.push(null);
      yLinesPos.push(entry.sector);
      yLinesPos.push(entry.sector);
      yLinesPos.push(null);
    });

    traces.push({
      type: "scatter",
      mode: "lines",
      x: xLinesPos,
      y: yLinesPos,
      line: { width: 3, color: "#47d18c" },
      hoverinfo: "skip",
      showlegend: false,
    });

    traces.push({
      type: "scatter",
      mode: "markers",
      x: positiveData.map((e) => e.pct_change),
      y: positiveData.map((e) => e.sector),
      marker: {
        size: 12,
        color: "#47d18c",
        symbol: "circle",
        line: { width: 3, color: "#2a8a54" }
      },
      hovertemplate:
        "<b>%{y}</b><br>Variación: %{x:.2f}%<br>2023: %{customdata[0]:$,.0f}<br>2024: %{customdata[1]:$,.0f}<extra></extra>",
      customdata: positiveData.map((entry) => [entry.ventas_2023, entry.ventas_2024]),
      showlegend: false,
    });
  }

  if (negativeData.length > 0) {
    const xLinesNeg = [];
    const yLinesNeg = [];
    negativeData.forEach((entry) => {
      xLinesNeg.push(0);
      xLinesNeg.push(entry.pct_change);
      xLinesNeg.push(null);
      yLinesNeg.push(entry.sector);
      yLinesNeg.push(entry.sector);
      yLinesNeg.push(null);
    });

    traces.push({
      type: "scatter",
      mode: "lines",
      x: xLinesNeg,
      y: yLinesNeg,
      line: { width: 3, color: "#ff7f7f" },
      hoverinfo: "skip",
      showlegend: false,
    });

    traces.push({
      type: "scatter",
      mode: "markers",
      x: negativeData.map((e) => e.pct_change),
      y: negativeData.map((e) => e.sector),
      marker: {
        size: 12,
        color: "#ff7f7f",
        symbol: "circle",
        line: { width: 3, color: "#cc4444" }
      },
      hovertemplate:
        "<b>%{y}</b><br>Variación: %{x:.2f}%<br>2023: %{customdata[0]:$,.0f}<br>2024: %{customdata[1]:$,.0f}<extra></extra>",
      customdata: negativeData.map((entry) => [entry.ventas_2023, entry.ventas_2024]),
      showlegend: false,
    });
  }

  const layout = buildPlotLayout({
    margin: { l: 180, r: 36, t: 24, b: 48 },
    xaxis: {
      ...buildPlotLayout().xaxis,
      title: "Variación porcentual en " + MONTH_LABELS[month],
      tickformat: ".1f",
      zeroline: true,
      zerolinecolor: "rgba(255,255,255,0.22)",
      zerolinewidth: 2,
    },
    yaxis: {
      ...buildPlotLayout().yaxis,
      automargin: true,
      categoryorder: "array",
      categoryarray: filtered.map((entry) => entry.sector),
    },
    hovermode: "closest",
  });

  Plotly.react(targetId, traces, layout, {
    responsive: true,
    displaylogo: false,
    modeBarButtonsToRemove: ["zoom2d", "pan2d", "select2d", "lasso2d", "autoScale2d"],
    transition: { duration: 1200, easing: "cubic-in-out" }
  });
}
