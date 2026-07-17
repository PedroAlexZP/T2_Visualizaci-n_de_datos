function createProvinceTreemap(data, sectorFilter) {
  let provinces;

  if (sectorFilter && sectorFilter !== "all" && provinceSectorData && provinceSectorData.data) {
    const filtered = [];
    for (const [prov, sectors] of Object.entries(provinceSectorData.data)) {
      const ventas = sectors[sectorFilter] || 0;
      if (ventas > 0) filtered.push({ provincia: prov, total_ventas: ventas });
    }
    filtered.sort((a, b) => b.total_ventas - a.total_ventas);
    const totalSector = filtered.reduce((sum, p) => sum + p.total_ventas, 0);
    provinces = filtered.map(p => ({
      ...p,
      share: totalSector > 0 ? (p.total_ventas / totalSector) * 100 : 0,
    }));
  } else {
    provinces = data.provinces.ranking.slice().sort((a, b) => b.total_ventas - a.total_ventas);
  }

  const labels = ["Ecuador", ...provinces.map(p => p.provincia)];
  const parents = ["", ...provinces.map(() => "Ecuador")];
  const values = [0, ...provinces.map(p => p.total_ventas)];
  const colorValues = [0, ...provinces.map(p => p.share)];

  const top3 = provinces.slice(0, 3).reduce((s, p) => s + p.share, 0);
  const top5 = provinces.slice(0, 5).reduce((s, p) => s + p.share, 0);

  provinceTop3Value = top3;
  animateProvinceTop3();
  setText("province-top5", `Top 5: ${formatterPercent.format(top5)}% del total`);
  document.querySelector("#province-top3")?.closest(".callout")?.querySelector("span")?.replaceWith(
    Object.assign(document.createElement("span"), { textContent: sectorFilter && sectorFilter !== "all" ? `Participación top 3 ${sectorFilter}` : "Participación top 3" })
  );

  const trace = {
    type: "treemap",
    labels: labels,
    parents: parents,
    values: values,
    marker: {
      colors: colorValues,
      colorscale: [
        [0, "rgba(56, 142, 187, 0.4)"],
        [0.5, "rgba(86, 199, 217, 0.8)"],
        [1, "rgba(255, 193, 7, 1)"]
      ],
      colorbar: {
        title: "Concentración %",
        thickness: 16,
        len: 0.7,
        x: 1.02,
        tickfont: { color: "rgba(239, 246, 255, 0.8)", size: 11 },
        titlefont: { color: "rgba(239, 246, 255, 0.9)", size: 12 },
      },
      line: {
        width: 2,
        color: "rgba(6, 17, 26, 0.8)"
      }
    },
    text: labels.map((label, idx) => {
      if (idx === 0) return "Ecuador";
      const prov = provinces[idx - 1];
      return `<b>${label}</b><br>${formatShortMoney(prov.total_ventas)}<br>${formatterPercent.format(prov.share)}%`;
    }),
    textposition: "middle center",
    hovertemplate: "%{text}<extra></extra>",
    showlegend: false
  };

  const layout = buildPlotLayout({
    margin: { l: 20, r: 150, t: 20, b: 20 },
    paper_bgcolor: "rgba(0,0,0,0)",
    plot_bgcolor: "rgba(0,0,0,0)"
  });

  Plotly.react("province-chart", [trace], layout, {
    responsive: true,
    displaylogo: false,
    modeBarButtonsToRemove: ["zoom2d", "pan2d", "select2d", "lasso2d", "autoScale2d"],
    transition: { duration: 800, easing: "cubic-in-out" }
  });
}

function setupProvinceFilter(data) {
  const select = document.getElementById("province-sector-filter");
  if (!select || !provinceSectorData) return;

  provinceSectorData.sectors.forEach(sector => {
    const opt = document.createElement("option");
    opt.value = sector;
    opt.textContent = sector;
    select.appendChild(opt);
  });

  select.addEventListener("change", () => {
    createProvinceTreemap(data, select.value);
  });
}
