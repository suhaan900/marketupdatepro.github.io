async function fetchQuote(symbol) {
  const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${ALPHA_VANTAGE_KEY}`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (data["Global Quote"]) {
      const g = data["Global Quote"];
      return {
        symbol,
        price: parseFloat(g["05. price"]),
        change: parseFloat(g["09. change"]),
      };
    }
  } catch (e) { return { error: e.message }; }
  return { error: "No data" };
}

async function loadAll() {
  const list = document.getElementById('signals-list');
  list.innerHTML = "<tr><td colspan='5'>Loading...</td></tr>";
  const rows = [];
  for (const sym of STOCK_SYMBOLS) {
    const r = await fetchQuote(sym);
    if (r.error) rows.push(`<tr><td>${sym}</td><td colspan='4'>${r.error}</td></tr>`);
    else {
      const signal = r.change >= 0 ? "<span class='up'>BUY</span>" : "<span class='down'>SELL</span>";
      const target = (r.price * (r.change >= 0 ? 1.05 : 0.95)).toFixed(2);
      const sl = (r.price * (r.change >= 0 ? 0.98 : 1.02)).toFixed(2);
      rows.push(`<tr><td>${sym}</td><td>${r.price.toFixed(2)}</td><td>${signal}</td><td>${target}</td><td>${sl}</td></tr>`);
    }
    await new Promise(r => setTimeout(r, 12000));
  }
  list.innerHTML = rows.join('');
  document.getElementById('last-updated').textContent = new Date().toLocaleTimeString();
}

async function updateChart(symbol) {
  const chartStatus = document.getElementById('chart-status');
  chartStatus.textContent = "Loading chart...";
  const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY_ADJUSTED&symbol=${symbol}&apikey=${ALPHA_VANTAGE_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  if (!data["Time Series (Daily)"]) { chartStatus.textContent = "Chart error"; return; }
  const dates = Object.keys(data["Time Series (Daily)"]).slice(0, 30).reverse();
  const prices = dates.map(d => parseFloat(data["Time Series (Daily)"][d]["4. close"]));
  new Chart(document.getElementById('priceChart'), {
    type: 'line',
    data: { labels: dates, datasets: [{ data: prices, label: symbol, borderWidth: 2 }] },
    options: { responsive: true }
  });
  chartStatus.textContent = "Chart loaded";
}

document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('load-live');
  btn.onclick = () => { loadAll(); updateChart(CHART_SYMBOL); };
  document.getElementById('lang-toggle').onclick = () => {
    const isHi = document.documentElement.lang === 'hi';
    document.documentElement.lang = isHi ? 'en' : 'hi';
    document.querySelectorAll('[data-en]').forEach(el => el.style.display = isHi ? '' : 'none');
    document.querySelectorAll('[data-hi]').forEach(el => el.style.display = isHi ? 'none' : '');
  };
});
