// pages/api/update-prices.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  try {
    const response = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc');
    const data = await response.json();

    const updates = data.map((coin) => ({
      id: coin.id,
      symbol: coin.symbol.toUpperCase(),
      name: coin.name,
      image: coin.image,
      current_price: coin.current_price,
      market_cap: coin.market_cap,
      price_change_percentage_24h: coin.price_change_percentage_24h,
      last_updated: coin.last_updated,
    }));

    // Clear old data (optional if you're overwriting)
    await supabase.from('coins').delete().neq('id', '');

    const { error } = await supabase.from('coins').insert(updates);

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Failed to insert data to Supabase' });
    }

    return res.status(200).json({ message: 'Prices updated successfully' });
  } catch (err) {
    console.error('Fetch or server error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
