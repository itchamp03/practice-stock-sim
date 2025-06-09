const SUPABASE_URL = 'https://dsmcscvdzytcswsitzbj.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzbWNzY3Zkenl0Y3N3c2l0emJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkzNzkzODksImV4cCI6MjA2NDk1NTM4OX0.GaXM7bOg_DBCT-KJljPVIuvD6NhkBzkjMSpPQNlHvIM'; // truncated for clarity
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const tbody = document.getElementById("stocks-tbody");

let currentSortColumn = 'ticker';
let ascending = true;

async function fetchStocks() {
  const { data: stocks, error } = await supabaseClient
    .from('stocks')
    .select('*');

  if (error) {
    console.error("Error fetching stocks:", error);
    return;
  }

  const oneHourAgoISO = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { data: history, error: historyError } = await supabaseClient
    .from('stock_history')
    .select('stock_id, price, timestamp')
    .gte('timestamp', oneHourAgoISO);

  if (historyError) {
    console.error("Error fetching stock history:", historyError);
    return;
  }

  const oneHourAgoPrices = {};
  history.forEach(entry => {
    if (
      !oneHourAgoPrices[entry.stock_id] ||
      new Date(entry.timestamp) < new Date(oneHourAgoPrices[entry.stock_id].timestamp)
    ) {
      oneHourAgoPrices[entry.stock_id] = entry;
    }
  });

  tbody.innerHTML = '';

  const sortedStocks = [...stocks].sort((a, b) => {
    let valA = a[currentSortColumn];
    let valB = b[currentSortColumn];

    if (currentSortColumn === 'price' || currentSortColumn === 'percent_change') {
      valA = valA ?? -Infinity;
      valB = valB ?? -Infinity;
      return ascending ? valA - valB : valB - valA;
    }

    if (currentSortColumn === 'last_updated') {
      valA = new Date(valA);
      valB = new Date(valB);
      return ascending ? valA - valB : valB - valA;
    }

    if (valA == null) return 1;
    if (valB == null) return -1;
    return ascending
      ? valA.toString().localeCompare(valB.toString())
      : valB.toString().localeCompare(valA.toString());
  });

  sortedStocks.forEach(stock => {
    const stockHistory = history
      .filter(h => h.stock_id === stock.id)
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    const priceNow = stockHistory.length > 0
      ? stockHistory[stockHistory.length - 1].price
      : stock.price;

    const priceOneHourAgo = oneHourAgoPrices[stock.id]?.price ?? stock.price;

    let percentChange = null;
    if (priceOneHourAgo && priceNow) {
      percentChange = ((priceNow - priceOneHourAgo) / priceOneHourAgo) * 100;
    }

    const changeStyle = percentChange !== null
      ? (percentChange >= 0 ? 'color: green;' : 'color: red;')
      : '';

    const row = document.createElement('tr');
    row.style.cursor = 'pointer';
    row.innerHTML = `
      <td>${stock.name}</td>
      <td>${stock.ticker}</td>
      <td>$${priceNow.toFixed(2)}</td>
      <td>${stock.last_updated ? new Date(stock.last_updated).toLocaleTimeString() : 'N/A'}</td>
      <td style="${changeStyle}">${percentChange !== null ? percentChange.toFixed(2) + '%' : 'N/A'}</td>
    `;

    row.addEventListener('click', () => {
      window.location.href = `stock.html?id=${stock.id}&ticker=${stock.ticker}`;
    });

    tbody.appendChild(row);
  });
}

document.querySelectorAll("#stocks-table thead th[data-sort]").forEach(th => {
  th.addEventListener('click', () => {
    const sortKey = th.getAttribute('data-sort');
    if (sortKey === currentSortColumn) {
      ascending = !ascending;
    } else {
      currentSortColumn = sortKey;
      ascending = true;
    }
    fetchStocks();
  });
});

document.addEventListener('DOMContentLoaded', () => {
  fetchStocks();
  setInterval(fetchStocks, 60_000); // refresh every 60 seconds
});
