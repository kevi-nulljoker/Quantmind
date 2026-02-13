const express = require('express');
const mongoose = require('mongoose');
const cors = require("cors");

const app = express();

app.use(express.json());
app.use(cors());
app.set('view engine', 'ejs');


// CONNECT TO DATABASE
// mongoose.connect(
//   'mongodb+srv://shikharsaxena7777_db_user:Codecode@globathon.rl4ckeo.mongodb.net/Database',
//   { useNewUrlParser: true, useUnifiedTopology: true }
// );

mongoose.connect('mongodb+srv://shikharsaxena7777_db_user:Codecode@globathon.rl4ckeo.mongodb.net/Database')
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error(err));


// --------------------
// Number Formatter
// --------------------
function formatNumber(num) {
  if (num === null || num === undefined || isNaN(num)) return null;

  const trillion = 1_000_000_000_000;
  const billion = 1_000_000_000;
  const million = 1_000_000;

  if (num >= trillion) return (num / trillion).toFixed(2) + "T";
  if (num >= billion) return (num / billion).toFixed(2) + "B";
  if (num >= million) return (num / million).toFixed(2) + "M";

  return Number(num).toFixed(2);
}

// --------------------
// SCHEMAS
// --------------------
const SocialSchema = new mongoose.Schema({
  ticker: String,
  company: String,

  sentiment: {
    sentiment_score: Number,
    confidence_pct: Number,
    investability_score: Number,
  },

  financials: {
    reported_revenue: { type: Map, of: Number },
    yoy_growth_pct: { type: Map, of: Number },
    forecast_revenue: { type: Map, of: Number },

    market_share_pct: Number, // <-- NOT a map
    cagr_2021_2024_pct: Number,

    total_revenue_2021_2024_usd: Number,
    total_forecast_revenue_2025_2027_usd: Number,
  }
});

const DataSchema = new mongoose.Schema({
  ticker: String,
  timestamp: String,

  last_price: Number,
  market_cap: Number,
  year_high: Number,
  year_low: Number,
  volume: Number,

  sector: String,
  industry: String,

  eps: Number,
  pe_ratio: Number,
  roe: Number,
  debt_to_equity: Number,
  profit_margin: Number,
  current_ratio: Number,
  total_revenue: Number,
  volatility: Number,
  liquidity: Number,
});

// MODELS
const StockData = mongoose.model("yfinance", DataSchema, "yfinance");
const SocialData = mongoose.model("social", SocialSchema, "social");

// -------------------------------------------
// HELPER: FORMAT MONGOOSE MAP TO NORMAL OBJECT
// -------------------------------------------
function formatMap(obj) {
  if (!obj) return null;

  let formatted = {};
  for (let [key, value] of obj.entries()) {
    formatted[key] = formatNumber(value);
  }
  return formatted;
}

// ------------------------------------------------------
// ROUTE 1: EJS RENDER (If you still want EJS output)
// ------------------------------------------------------
app.get('/', async (req, res) => {
  let stocks = await StockData.find({});
  let social = await SocialData.find({});

  // Format stock numbers
  stocks = stocks.map(s => ({
    ...s._doc,
    last_price: formatNumber(s.last_price),
    market_cap: formatNumber(s.market_cap),
    year_high: formatNumber(s.year_high),
    year_low: formatNumber(s.year_low),
    volume: formatNumber(s.volume),
    eps: formatNumber(s.eps),
    pe_ratio: formatNumber(s.pe_ratio),
    roe: formatNumber(s.roe),
    debt_to_equity: formatNumber(s.debt_to_equity),
    profit_margin: formatNumber(s.profit_margin),
    current_ratio: formatNumber(s.current_ratio),
    total_revenue: formatNumber(s.total_revenue),
    volatility: formatNumber(s.volatility),
    liquidity: formatNumber(s.liquidity),
  }));

  // Format social data
  social = social.map(item => ({
    ...item._doc,

    financials: {
      ...item.financials,
      reported_revenue: formatMap(item.financials?.reported_revenue),
      forecast_revenue: formatMap(item.financials?.forecast_revenue),
      yoy_growth_pct: formatMap(item.financials?.yoy_growth_pct),
      // ❌ removed invalid market_share_pct formatting
    }
  }));

  res.render("index", { stocksList: stocks, socialList: social });
});

// ------------------------------------------------------
// ROUTE 2: JSON API FOR REACT (App.tsx will use this)
// ------------------------------------------------------

app.get('/api/data', async (req, res) => {
  let stocks = await StockData.find({});
  let socialRaw = await SocialData.find({});

  // Normalize social docs to match your App.tsx types
  const social = socialRaw.map(doc => {
    const s = doc._doc;

    return {
      _id: s._id,
      ticker: s.ticker,
      company: s.company,

      sentiment: {
        sentiment_score: s.sentiment?.sentiment_score ?? s.sentiment_score ?? null,
        confidence_pct: s.sentiment?.confidence_pct ?? s.confidence_pct ?? null,
        investability_score: s.sentiment?.investability_score ?? s.investability_score ?? null,

        // optional fallback arrays
        top_positive_signals: s.top_positive_signals || [],
        top_negative_signals: s.top_negative_signals || [],
        representative_sources: s.representative_sources || []
      },

      financials: {
        reported_revenue:
          s.financials?.reported_revenue ??
          s.reported_revenue ??
          {},

        forecast_revenue:
          s.financials?.forecast_revenue ??
          s.forecast_revenue ??
          {},

        yoy_growth_pct:
          s.financials?.yoy_growth_pct ??
          s.yoy_growth_pct ??
          {},

        market_share_pct:
          s.financials?.market_share_pct ??
          s.market_share_pct ??
          null,

        cagr_2021_2024_pct:
          s.financials?.cagr_2021_2024_pct ??
          s.cagr_2021_2024_pct ??
          null,

        total_revenue_2021_2024_usd:
          s.financials?.total_revenue_2021_2024_usd ??
          s.total_revenue_2021_2024_usd ??
          null,

        total_forecast_revenue_2025_2027_usd:
          s.financials?.total_forecast_revenue_2025_2027_usd ??
          s.total_forecast_revenue_2025_2027_usd ??
          null
      }
    };
  });

  res.json({ stocks, social });
});





// START SERVER
app.listen(4000, () => {
  console.log("Server running on http://localhost:4000");
});
