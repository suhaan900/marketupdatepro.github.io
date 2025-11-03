// main.js - lightweight live fetcher (Alpha Vantage)
// Note: Alpha Vantage free tier allows 5 requests/min. This script waits between requests.
async function fetchQuote(symbol) {
  const key = ALPHA_VANTAGE_KEY;
  if (!key || key === "YOUR_API_KEY_HERE") {
    return { error: "Please set your Alpha Vantage API key in config.js" };
  }
  const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${key}`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (data["Global Quote"] && data["Global Quote"]["05. price"]) {
      const g = data["Global Quote"];
      return {
        symbol: symbol,
        price: parseFloat(g["05. price"]),
        change: parseFloat(g["09. change"] || 0),
        changePercent: g["10. change percent"] || "0%"
      };
    } else {
      return { error: "No data", raw: data };
    }
  } catch (e) {
    return { error: e.message };
  }
}

async function fetchDailySeries(symbol) {
  const key = ALPHA_VANTAGE_KEY;
  const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY_ADJUSTED&symbol=${symbol}&outputsize=compact&apikey=${key}`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (data["Time Series (Daily)"]) {
      return data["Time Series (Daily)"];
    } else {
      return { error: "No time series", raw: data };
    }
  } catch (e) {
    return { error: e.message };
  }
}

async function loadAll() {
  const list = document.getElementById('signals-list');
  list.innerHTML = '<tr><td colspan="5">Loading live quotes... (May be slow due to API rate limits)</td></tr>';
  const results = [];
  for (let i = 0; i < STOCK_SYMBOLS.length; i++) {
    const sym = STOCK_SYMBOLS[i];
    const r = await fetchQuote(sym);
    results.push(r);
    if (i < STOCK_SYMBOLS.length - 1) await new Promise(res => setTimeout(res, 15000));
  }
  const rows = results.map(r => {
    if (r.error) return `<tr><td>${r.symbol || ""}</td><td colspan="4" style="color:orange">Error: ${r.error}</td></tr>`;
    const signal = r.change >= 0 ? '<span class="up">BUY</span>' : '<span class="down">SELL</span>';
    const target = (r.price * (r.change >=0 ? 1.05 : 0.95)).toFixed(2);
    const sl = (r.price * (r.change >=0 ? 0.98 : 1.02)).toFixed(2);
    return `<tr>
      <td>${r.symbol}</td>
      <td>${r.price.toFixed(2)}</td>
      <td>${signal}</td>
      <td>${target}</td>
      <td>${sl}</td>
    </tr>`;
  }).join('');
  list.innerHTML = rows;
  document.getElementById('last-updated').textContent = new Date().toLocaleString();
}

async function updateChart(symbol) {
  const chartStatus = document.getElementById('chart-status');
  chartStatus.textContent = 'Loading chart...';
  const series = await fetchDailySeries(symbol);
  if (series.error) {
    chartStatus.textContent = 'Chart error: ' + series.error;
    return;
  }
  const dates = Object.keys(series).slice(0, 60).reverse();
  const prices = dates.map(d => parseFloat(series[d]['4. close']));
  renderChart(dates, prices, symbol);
  chartStatus.textContent = 'Chart last 60 days for ' + symbol;
}

let priceChart = null;
function renderChart(labels, data, symbol) {
  const ctx = document.getElementById('priceChart').getContext('2d');
  if (priceChart) priceChart.destroy();
  priceChart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: labels,
        datasets: [{
            label: symbol + ' Close Price',
            data: data,
            fill: false,
            tension: 0.2,
        }]
    },
    options: { responsive: true }
  });
}

// language toggle
function setLang(lang) {
  document.documentElement.lang = (lang === 'hi') ? 'hi' : 'en';
  document.querySelectorAll('[data-en]').forEach(el => el.style.display = (lang==='en') ? '' : 'none');
  document.querySelectorAll('[data-hi]').forEach(el => el.style.display = (lang==='hi') ? '' : 'none');
  localStorage.setItem('mup_lang', lang);
}

document.addEventListener('DOMContentLoaded', () => {
  const saved = localStorage.getItem('mup_lang') || 'en';
  setLang(saved);
  document.getElementById('lang-toggle').addEventListener('click', () => {
    setLang(document.documentElement.lang === 'hi' ? 'en' : 'hi');
  });
  document.getElementById('load-live').addEventListener('click', () => {
    loadAll();
    updateChart(CHART_SYMBOL);
  });
  let autoTimer = null;
  const autoCheckbox = document.getElementById('auto-refresh');
  autoCheckbox.addEventListener('change', () => {
    if (autoCheckbox.checked) {
      loadAll();
      updateChart(CHART_SYMBOL);
      autoTimer = setInterval(() => { loadAll(); updateChart(CHART_SYMBOL); }, AUTO_REFRESH_MS);
    } else {
      if (autoTimer) clearInterval(autoTimer);
    }
  });
});