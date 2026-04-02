import express from 'express';
import cors from 'cors';
import axios from 'axios';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'GTI Backend is running' });
});

// DeepSeek AI Chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body;
    const deepseekKey = process.env.DEEPSEEK_API_KEY;
    
    if (!deepseekKey) {
      return res.status(500).json({ error: 'DeepSeek API key not configured' });
    }

    const response = await axios.post('https://api.deepseek.com/v1/chat/completions', {
      model: 'deepseek-chat',
      messages: messages.map(m => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.text
      })),
      temperature: 0.7,
      max_tokens: 500
    }, {
      headers: {
        'Authorization': `Bearer ${deepseekKey}`,
        'Content-Type': 'application/json'
      }
    });

    res.json({ reply: response.data.choices[0].message.content });
  } catch (error) {
    console.error('DeepSeek error:', error.response?.data || error.message);
    res.status(500).json({ error: 'AI service error' });
  }
});

// Alpha Vantage Market Data endpoint
app.get('/api/market-data', async (req, res) => {
  try {
    const { symbol } = req.query;
    const alphaKey = process.env.ALPHA_VANTAGE_API_KEY;
    
    if (!alphaKey) {
      return res.status(500).json({ error: 'Alpha Vantage API key not configured' });
    }

    // Map symbols to Alpha Vantage format
    const symbolMap = {
      'EUR/USD': 'EURUSD',
      'GBP/USD': 'GBPUSD',
      'USD/JPY': 'USDJPY',
      'AUD/USD': 'AUDUSD',
      'USD/CAD': 'USDCAD',
      'USD/CHF': 'USDCHF',
      'BTC/USD': 'BTCUSD',
      'ETH/USD': 'ETHUSD',
      'XAU/USD': 'XAUUSD',
      'SPX': 'SPX'
    };

    const alphaSymbol = symbolMap[symbol] || symbol;
    
    const response = await axios.get(`https://www.alphavantage.co/query`, {
      params: {
        function: 'CURRENCY_EXCHANGE_RATE',
        from_currency: alphaSymbol.substring(0, 3),
        to_currency: alphaSymbol.substring(3, 6),
        apikey: alphaKey
      }
    });

    const rate = response.data['Realtime Currency Exchange Rate'];
    
    if (rate && rate['5. Exchange Rate']) {
      res.json({ 
        symbol: symbol,
        price: parseFloat(rate['5. Exchange Rate']).toFixed(4),
        change: '+0.00%',
        isUp: true
      });
    } else {
      // Return fallback data
      const fallbackPrices = {
        'EUR/USD': 1.0842,
        'GBP/USD': 1.2654,
        'USD/JPY': 151.42,
        'AUD/USD': 0.6542,
        'USD/CAD': 1.3542,
        'BTC/USD': 68432.10,
        'ETH/USD': 3842.15,
        'XAU/USD': 2154.50,
        'SPX': 5123.40
      };
      
      res.json({
        symbol: symbol,
        price: fallbackPrices[symbol] || 1.0000,
        change: '+0.00%',
        isUp: true
      });
    }
  } catch (error) {
    console.error('Alpha Vantage error:', error.message);
    res.status(500).json({ error: 'Market data service error' });
  }
});

// Bulk market data endpoint
app.get('/api/market-data/all', async (req, res) => {
  try {
    const symbols = ['EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD', 'USD/CAD', 'BTC/USD', 'ETH/USD'];
    const results = {};
    
    for (const symbol of symbols) {
      try {
        const response = await axios.get(`http://localhost:${PORT}/api/market-data?symbol=${symbol}`);
        results[symbol] = response.data;
      } catch (err) {
        results[symbol] = { symbol, price: 0, error: 'Failed to fetch' };
      }
    }
    
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch market data' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`GTI Backend running on port ${PORT}`);
});
