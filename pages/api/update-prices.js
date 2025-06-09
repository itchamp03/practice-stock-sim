// File: /api/update-stocks.js

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

export default async function handler(req, res) {
  try {
    // Fetch all stocks
    const { data: stocks, error: fetchError } = await supabase.from('stocks').select('*');
    if (fetchError) throw fetchError;

    const now = new Date().toISOString();

    // Update each stock's price and log history
    for (const stock of stocks) {
      // Calculate new price with random volatility change
      const change = (Math.random() * 2 - 1) * stock.volatility;
      const newPrice = Math.max(0.1, stock.price * (1 + change));

      // Update stock price and last_updated timestamp
      const { error: updateError } = await supabase
        .from('stocks')
        .update({ price: newPrice, last_updated: now })
        .eq('id', stock.id);
      if (updateError) throw updateError;

      // Insert price change into stock_history
      const { error: insertError } = await supabase
        .from('stock_history')
        .insert([{ stock_id: stock.id, price: newPrice, timestamp: now }]);
      if (insertError) throw insertError;
    }

    res.status(200).json({ message: 'Stock prices updated successfully' });
  } catch (error) {
    console.error('Error updating stock prices:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
