import express from 'express';
import cors from 'cors';
import axios from 'axios';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// ============================================================
// ROOT ROUTE (fixes the 404 when visiting the base URL)
// ============================================================
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'GTI Backend is running!',
    endpoints: {
      chat: 'POST /api/chat',
      marketData: 'GET /api/market-data?symbol=EUR/USD',
      health: 'GET /api/health'
    }
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'GTI Backend is running' });
});

// DeepSeek AI Chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body;
    const deepseekKey = process.env.DEEPSEEK_API_KEY;
    
    console.log('Chat request received. Messages:', messages?.length);
    
    if (!deepseekKey) {
      console.error('DeepSeek API key missing');
      return res.status(500).json({ error: 'DeepSeek API key not configured on server' });
    }

    // Format messages for DeepSeek
    const formattedMessages = messages.map(m => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: m.text
    }));

    console.log('Calling DeepSeek API...');
    
    const response = await axios.post('https://api.deepseek.com/v1/chat/completions', {
      model: 'deepseek-chat',
      messages: formattedMessages,
      temperature: 0.7,
      max_tokens: 500
    }, {
      headers: {
        'Authorization': `Bearer ${deepseekKey}`,
        'Content-Type': 'application/json'
      }
    });

    const reply = response.data.choices[0].message.content;
    console.log('DeepSeek response received, length:', reply.length);
    
    res.json({ reply: reply });
  } catch (error) {
    console.error('DeepSeek error:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'AI service error', 
      details: error.response?.data?.error?.message || error.message 
    });
  }
});

// Alpha Vantage Market Data endpoint
app.get('/api/market-data', async (req, res) => {
  try {
    const { symbol } = req.query;
    const alphaKey = process.env.ALPHA_VANTAGE_API_KEY;
    
    console.log(`Market data request for: ${symbol}`);
    
    if (!alphaKey) {
      console.error('Alpha Vantage API key missing');
      return res.status(500).json({ error: 'Alpha Vantage API key not configured' });
    }

    // Map symbols to Alpha Vantage format
    const symbolMap = {
      'EUR/USD': { from: 'EUR', to: 'USD' },
      'GBP/USD': { from: 'GBP', to: 'USD' },
      'USD/JPY': { from: 'USD', to: 'JPY' },
      'AUD/USD': { from: 'AUD', to: 'USD' },
      'USD/CAD': { from: 'USD', to: 'CAD' },
      'USD/CHF': { from: 'USD', to: 'CHF' }
    };

    const currencies = symbolMap[symbol];
    
    if (!currencies) {
      // Return fallback for unsupported symbols
      const fallbackPrices = {
        'BTC/USD': 68432.10,
        'ETH/USD': 3842.15,
        'XAU/USD': 2154.50,
        'SPX': 5123.40
      };
      return res.json({
        symbol: symbol,
        price: fallbackPrices[symbol] || 1.0000,
        change: '+0.00%',
        isUp: true,
        source: 'fallback'
      });
    }
    
    const response = await axios.get(`https://www.alphavantage.co/query`, {
      params: {
        function: 'CURRENCY_EXCHANGE_RATE',
        from_currency: currencies.from,
        to_currency: currencies.to,
        apikey: alphaKey
      }
    });

    const rate = response.data['Realtime Currency Exchange Rate'];
    
    if (rate && rate['5. Exchange Rate']) {
      res.json({ 
        symbol: symbol,
        price: parseFloat(rate['5. Exchange Rate']).toFixed(4),
        change: '+0.00%',
        isUp: true,
        source: 'alphavantage'
      });
    } else {
      throw new Error('Invalid response from Alpha Vantage');
    }
  } catch (error) {
    console.error('Alpha Vantage error:', error.message);
    // Return fallback data instead of failing
    const fallbackPrices = {
      'EUR/USD': 1.0842,
      'GBP/USD': 1.2654,
      'USD/JPY': 151.42,
      'AUD/USD': 0.6542,
      'USD/CAD': 1.3542,
      'BTC/USD': 68432.10,
      'ETH/USD': 3842.15
    };
    
    res.json({
      symbol: symbol,
      price: fallbackPrices[symbol] || 1.0000,
      change: '+0.00%',
      isUp: true,
      source: 'fallback'
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`GTI Backend running on port ${PORT}`);
});
