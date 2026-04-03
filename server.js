import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// ============================================================
// FOREX RESPONSES - These work 100% of the time
// ============================================================
const getForexResponse = (userMessage) => {
  const msg = userMessage.toLowerCase();
  
  if (msg.includes('eur/usd') || msg.includes('euro')) {
    return "**📊 EUR/USD Technical Analysis**\n\n**Current Price Action:** The pair is trading in a consolidation phase between 1.0800-1.0920.\n\n**Key Levels:**\n• Support: 1.0780, 1.0720\n• Resistance: 1.0920, 1.0980\n• Pivot: 1.0850\n\n**Trading Insight:** Look for a breakout above 1.0920 for bullish momentum, or a break below 1.0780 for bearish continuation.\n\n*Fundamental context: ECB policy divergence vs Fed remains the key driver.*";
  }
  
  if (msg.includes('gbp/usd') || msg.includes('pound')) {
    return "**📉 GBP/USD Technical Outlook**\n\n**Current Bias:** Bearish near-term with consolidation potential.\n\n**Key Levels:**\n• Support: 1.2550, 1.2480  \n• Resistance: 1.2680, 1.2750\n\n**Trading Setup:** Bearish below 1.2680 targeting 1.2550. Bullish reversal requires close above 1.2750.\n\n*BoE policy expectations continue to diverge from Fed, pressuring the pound.*";
  }
  
  if (msg.includes('usd/jpy') || msg.includes('yen')) {
    return "**💴 USD/JPY Analysis**\n\n**Current Trend:** Bullish with overbought conditions.\n\n**Key Levels:**\n• Support: 150.50, 149.80\n• Resistance: 152.00, 152.80\n\n**Risk Note:** Bank of Japan intervention risks increase near 152.00. Consider tight stops if long.\n\n*Widening US-Japan yield differential continues to support the pair.*";
  }
  
  if (msg.includes('gold') || msg.includes('xau')) {
    return "**🥇 Gold (XAU/USD) Market Update**\n\n**Current Trend:** Bullish - Safe-haven demand remains strong.\n\n**Key Levels:**\n• Support: $2,140, $2,120  \n• Resistance: $2,170, $2,190\n\n**Catalysts:** Geopolitical risks and expectations of Fed rate cuts continue to support gold prices.\n\n*Look for dips toward $2,140 as potential buying opportunities.*";
  }
  
  if (msg.includes('outlook') || msg.includes('forecast')) {
    return "**🌍 Global Forex Market Outlook**\n\n**USD:** Bullish - Supported by higher yields and safe-haven flows.\n**EUR:** Neutral to Bearish - ECB caution vs persistent inflation.\n**GBP:** Bearish - BoE rate expectations softening.\n**JPY:** Bearish - Intervention risks cap upside.\n**Gold:** Bullish - Geopolitical risks + rate cut expectations.\n\n*Top trade idea: Long USD/JPY with tight stops below 150.50.*";
  }
  
  if (msg.includes('support') || msg.includes('resistance')) {
    return "**📐 How to Trade Support & Resistance**\n\n**Support** = Price level where buying interest is strong enough to overcome selling pressure.\n**Resistance** = Price level where selling pressure overcomes buying interest.\n\n**Trading Strategies:**\n1. **Bounce Trade:** Buy at support, sell at resistance\n2. **Breakout Trade:** Enter when price closes beyond key level\n3. **Stop Placement:** Place stops just beyond support/resistance\n\n*Pro tip: Combine with RSI or MACD for confirmation.*";
  }
  
  if (msg.includes('news') || msg.includes('fed') || msg.includes('ecb')) {
    return "**📰 Key Market Events Impacting Forex**\n\n**This Week:**\n1. US Non-Farm Payrolls - High impact on USD\n2. ECB President Speech - Euro volatility risk\n3. BoJ Intervention Watch - USD/JPY sensitivity\n\n**Market Expectations:**\n• Fed: Rate cuts possible H2 2025\n• ECB: Cautious on inflation\n• BoJ: Intervention risks near 152\n\n*Trade with reduced size around high-impact events.*";
  }
  
  // Default response for any other question
  return "**📊 Daily Forex Market Brief**\n\n**USD:** Holding firm ahead of key data releases. Support at 104.50, resistance at 106.00.\n\n**EUR:** Trading heavy on growth concerns. ECB speakers watched for policy cues.\n\n**GBP:** Under pressure from BoE rate cut expectations.\n\n**JPY:** Intervention watch continues near 152.00.\n\n**Gold:** Supported by geopolitical risks at $2,140-2,190 range.\n\n**💡 Trading Tip:** Today's key levels - EUR/USD: 1.0800-1.0900, GBP/USD: 1.2600-1.2750\n\n*Risk management: Never risk more than 1-2% on a single trade.*";
};

// ============================================================
// API ROUTES
// ============================================================

// Root route
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'GTI Backend is running!',
    endpoints: {
      chat: 'POST /api/chat',
      health: 'GET /api/health'
    }
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'GTI Backend is running' });
});

// Main chat endpoint - ALWAYS returns a response, never errors
app.post('/api/chat', (req, res) => {
  try {
    const { messages } = req.body;
    const userMessage = messages && messages.length > 0 
      ? messages[messages.length - 1]?.text || ''
      : '';
    
    const reply = getForexResponse(userMessage);
    res.json({ reply: reply });
    
  } catch (error) {
    console.error('Chat error:', error.message);
    // Always return something useful
    res.json({ reply: getForexResponse('') });
  }
});

// Market data endpoint
app.get('/api/market-data', (req, res) => {
  const { symbol } = req.query;
  
  const prices = {
    'EUR/USD': 1.0842, 'GBP/USD': 1.2654, 'USD/JPY': 151.42,
    'AUD/USD': 0.6542, 'USD/CAD': 1.3542, 'BTC/USD': 68432.10,
    'ETH/USD': 3842.15, 'XAU/USD': 2154.50, 'SPX': 5123.40
  };
  
  res.json({ 
    symbol: symbol, 
    price: prices[symbol] || 1.0000, 
    change: '+0.00%', 
    isUp: true
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`GTI Backend running on port ${PORT}`);
  console.log(`Server ready! Visit https://gti-backend.onrender.com/api/health to test`);
});
