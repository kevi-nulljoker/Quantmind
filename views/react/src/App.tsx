import React, { useEffect, useState } from "react";
import {
  Moon,
  Search,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Brain,
  Users,
  LineChart,
  Shield,
  Sparkles,
  ArrowLeft,
} from "lucide-react";

// --------------------
// TYPES (match server.js schemas)
// --------------------
type Stock = {
  _id: string;
  ticker: string;
  timestamp: string;
  last_price: number;
  market_cap: number;
  year_high: number;
  year_low: number;
  volume: number;
  sector: string;
  industry: string;
  eps: number;
  pe_ratio: number;
  roe: number;
  debt_to_equity: number;
  profit_margin: number;
  current_ratio: number;
  total_revenue: number;
  volatility: number;
  liquidity: number;
};

type Sentiment = {
  sentiment_score: number;
  confidence_pct: number;
  investability_score: number;
  top_positive_signals: string[];
  top_negative_signals: string[];
  representative_sources: string[];
};

type Financials = {
  reported_revenue: Record<string, number>;
  yoy_growth_pct: Record<string, number>;
  forecast_revenue: Record<string, number>;
  market_share_pct: number;
  cagr_2021_2024_pct: number;
  total_revenue_2021_2024_usd: number;
  total_forecast_revenue_2025_2027_usd: number;
};

type Social = {
  _id: string;
  ticker: string;
  company: string;
  sentiment?: Sentiment;
  financials?: Financials;
};

type EnrichedStock = {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: string;
  marketCap: string;
  trending: "up" | "down";
  stockDoc: Stock;
  socialDoc?: Social;
};

const API_BASE_URL = "http://localhost:4000";

// --------------------
// HELPERS
// --------------------
const formatNumber = (num?: number | null, decimals = 2) => {
  if (num === null || num === undefined || isNaN(num)) return "-";
  return Number(num).toFixed(decimals);
};

const formatBigNumber = (num?: number | null) => {
  if (num === null || num === undefined || isNaN(num)) return "-";

  const trillion = 1_000_000_000_000;
  const billion = 1_000_000_000;
  const million = 1_000_000;

  if (num >= trillion) return (num / trillion).toFixed(2) + "T";
  if (num >= billion) return (num / billion).toFixed(2) + "B";
  if (num >= million) return (num / million).toFixed(2) + "M";

  return num.toLocaleString();
};

const formatCurrency = (num?: number | null) => {
  if (num === null || num === undefined || isNaN(num)) return "-";
  return "$" + formatBigNumber(num);
};

// If DB value is 0–1, treat as %, else clamp 0–100
const normalizeScore = (value?: number | null, fallback = 50): number => {
  if (value === null || value === undefined || isNaN(value)) return fallback;
  let v = value;
  if (v <= 1) v = v * 100;
  if (v < 0) v = 0;
  if (v > 100) v = 100;
  return Math.round(v);
};

// Small helper for picking last key in a map-like object
const getLastKeyValue = (obj?: Record<string, number>): number | null => {
  if (!obj) return null;
  const keys = Object.keys(obj).sort();
  const lastKey = keys[keys.length - 1];
  return lastKey ? obj[lastKey] : null;
};

const App: React.FC = () => {
  const [darkMode, setDarkMode] = useState(true);
  const [currentView, setCurrentView] = useState<"home" | "details">("home");
  const [selectedStock, setSelectedStock] = useState<EnrichedStock | null>(
    null
  );
  const [searchQuery, setSearchQuery] = useState("");

  const [stocks, setStocks] = useState<Stock[]>([]);
  const [social, setSocial] = useState<Social[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --------------------
  // FETCH DATA FROM NODE SERVER
  // --------------------
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/data`);
        if (!res.ok) {
          throw new Error(`API error: ${res.status}`);
        }
        const data = await res.json();
        setStocks(data.stocks || []);
        setSocial(data.social || []);
      } catch (err: any) {
        console.error(err);
        setError("Failed to load data from server.js (/api/data)");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // --------------------
  // BUILD ENRICHED STOCKS FROM DB
  // --------------------
  const enrichedStocks: EnrichedStock[] = stocks.map((stock) => {
    const s = social.find((item) => item.ticker === stock.ticker);

    const sentimentScore = normalizeScore(
      s?.sentiment?.sentiment_score,
      70
    );
    const yoyLatest = getLastKeyValue(s?.financials?.yoy_growth_pct);
    const changePercent = yoyLatest ?? 0;
    const change = (stock.last_price * changePercent) / 100;

    return {
      symbol: stock.ticker,
      name: s?.company || stock.ticker,
      price: stock.last_price,
      change,
      changePercent,
      volume: formatBigNumber(stock.volume),
      marketCap: formatCurrency(stock.market_cap),
      trending: sentimentScore >= 50 ? "up" : "down",
      stockDoc: stock,
      socialDoc: s,
    };
  });

  // --------------------
  // FEATURES (still static text)
// --------------------
  const features = [
    {
      icon: <BarChart3 className="w-8 h-8" />,
      title: "Fundamental Analysis",
      desc: "Deep dive into financial ratios, P/E, ROE, debt metrics, and more to understand company health.",
      color: "cyan",
    },
    {
      icon: <Brain className="w-8 h-8" />,
      title: "AI-Powered Insights",
      desc: "Get intelligent analysis and investment recommendations powered by advanced AI algorithms.",
      color: "cyan",
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: "Social Score",
      desc: "Track real-time sentiment from social media, news, and market discussions.",
      color: "yellow",
    },
    {
      icon: <LineChart className="w-8 h-8" />,
      title: "Growth Forecasts",
      desc: "Visualize projected revenue, earnings, and growth trajectories with interactive charts.",
      color: "cyan",
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Risk Assessment",
      desc: "Understand volatility, beta, and risk metrics to make informed decisions.",
      color: "red",
    },
    {
      icon: <Sparkles className="w-8 h-8" />,
      title: "Real-Time Data",
      desc: "Access up-to-date market data and analysis to stay ahead of the curve.",
      color: "cyan",
    },
  ];

  const handleStockClick = (stock: EnrichedStock) => {
    setSelectedStock(stock);
    setCurrentView("details");
  };

  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    const query = searchQuery.trim().toLowerCase();

    const stock =
      enrichedStocks.find(
        (s) =>
          s.symbol.toLowerCase() === query ||
          s.name.toLowerCase().includes(query)
      ) || null;

    if (stock) {
      handleStockClick(stock);
    }
  };

  // --------------------
  // DETAIL VIEW HELPERS (use DB wherever possible)
// --------------------
  const selectedStockDoc = selectedStock?.stockDoc;
  const selectedSocialDoc = selectedStock?.socialDoc;

  const revenueYears = ["2022", "2023", "2024", "2025", "2026", "2027"];

  const getRevenueValueForYear = (year: string): number => {
    if (!selectedSocialDoc?.financials) return 0;
    const { reported_revenue, forecast_revenue } =
      selectedSocialDoc.financials;
    if (["2022", "2023", "2024"].includes(year)) {
      return reported_revenue?.[year] ?? 0;
    }
    return forecast_revenue?.[year] ?? 0;
  };

  const maxRevenue = Math.max(
    ...revenueYears.map((y) => getRevenueValueForYear(y)),
    1
  );

  const revenue2024 = selectedSocialDoc?.financials
    ? selectedSocialDoc.financials.reported_revenue?.["2024"]
    : null;
  const revenue2027 = selectedSocialDoc?.financials
    ? selectedSocialDoc.financials.forecast_revenue?.["2027"]
    : null;
  const cagr =
    selectedSocialDoc?.financials?.cagr_2021_2024_pct ?? null;

  const sentimentScore = normalizeScore(
    selectedSocialDoc?.sentiment?.sentiment_score,
    78
  );
  const platformScore = normalizeScore(
    selectedSocialDoc?.sentiment?.confidence_pct,
    86
  );
  const redditScore = Math.min(100, platformScore + 6);
  const newsScore = Math.max(0, platformScore - 13);

  const volatilityScore = normalizeScore(
    selectedStockDoc?.volatility,
    44
  );
  const liquidityScore = normalizeScore(
    selectedStockDoc?.liquidity,
    76
  );
  const debtScore = normalizeScore(
    selectedStockDoc?.debt_to_equity,
    55
  );
  const overallRisk = Math.round(
    (volatilityScore + (100 - liquidityScore) + debtScore) / 3
  );

  if (loading) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${
          darkMode ? "bg-black text-white" : "bg-white text-black"
        }`}
      >
        <div className="text-xl">Loading data from MongoDB…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${
          darkMode ? "bg-black text-white" : "bg-white text-black"
        }`}
      >
        <div className="text-center space-y-2">
          <div className="text-xl font-semibold">Error</div>
          <div className="text-sm text-red-400">{error}</div>
          <div className="text-xs text-gray-400">
            Make sure <code>server.js</code> is running on port 4000 and
            CORS is enabled if needed.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen ${
        darkMode ? "bg-black text-white" : "bg-white text-black"
      }`}
    >
      {/* Navigation */}
      <nav
        className={`fixed top-0 w-full z-50 ${
          darkMode ? "bg-black" : "bg-white"
        } border-b ${darkMode ? "border-gray-800" : "border-gray-200"}`}
      >
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-lg flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="text-xl font-bold">QUANT MIND</div>
                <div className="text-xs text-gray-400">
                  Analyze smarter, Invest wiser
                </div>
              </div>
            </div>

            <div className="hidden md:flex gap-8">
              <button
                onClick={() => setCurrentView("home")}
                className="hover:text-cyan-400 transition"
              >
                Home
              </button>
              <button
                onClick={() => setCurrentView("home")}
                className="hover:text-cyan-400 transition"
              >
                Features
              </button>
              <button
                onClick={() => setCurrentView("home")}
                className="hover:text-cyan-400 transition"
              >
                Trending
              </button>
              <button className="hover:text-cyan-400 transition">
                Community
              </button>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 rounded-lg hover:bg-gray-800 transition"
              >
                <Moon className="w-5 h-5" />
              </button>
              <button className="px-6 py-2 bg-transparent border border-gray-700 rounded-lg hover:bg-gray-800 transition">
                Sign In
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="pt-20">
        {currentView === "home" && (
          <>
            {/* Hero Section */}
            <section className="min-h-screen flex items-center justify-center px-6 py-20">
              <div className="max-w-4xl text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 border border-cyan-500/30 rounded-full mb-8">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span className="text-sm text-cyan-400">
                    AI-Powered Stock Analysis
                  </span>
                </div>

                <h1 className="text-6xl md:text-7xl font-bold mb-6">
                  Analyze Smarter,
                  <br />
                  <span className="text-cyan-400">Invest Wiser</span>
                </h1>

                <p className="text-xl text-gray-400 mb-12 max-w-3xl mx-auto">
                  Unlock powerful insights with AI-driven fundamental
                  analysis, social sentiment tracking, and growth
                  forecasts. Make informed investment decisions with
                  confidence.
                </p>

                <div className="max-w-2xl mx-auto mb-8">
                  <div className="flex items-center gap-3 bg-gray-900 border border-gray-800 rounded-xl p-4">
                    <Search className="w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Enter stock symbol or name (e.g., AAPL, TSLA, GOOGL)"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) =>
                        e.key === "Enter" && handleSearch()
                      }
                      className="flex-1 bg-transparent outline-none text-gray-300"
                    />
                    <button
                      onClick={handleSearch}
                      className="px-6 py-2 bg-cyan-500 hover:bg-cyan-600 rounded-lg transition font-medium"
                    >
                      Analyze
                    </button>
                  </div>
                  <p className="text-sm text-gray-500 mt-3">
                    Available tickers:{" "}
                    {enrichedStocks
                      .slice(0, 6)
                      .map((s) => s.symbol)
                      .join(", ") || "waiting for DB data"}
                  </p>
                </div>
              </div>
            </section>

            {/* Trending Stocks Section (from DB) */}
            <section className="px-6 py-20 bg-gradient-to-b from-black to-gray-950">
              <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h2 className="text-4xl font-bold mb-2">
                      Trending Stocks
                    </h2>
                    <p className="text-gray-400">
                      Most analyzed stocks from your MongoDB dataset
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-gray-400">
                      Live Data
                    </span>
                  </div>
                </div>

                {enrichedStocks.length === 0 ? (
                  <div className="text-gray-400 text-sm">
                    No stocks found in your <code>yfinance</code>{" "}
                    collection.
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {enrichedStocks.map((stock) => (
                      <div
                        key={stock.symbol}
                        onClick={() => handleStockClick(stock)}
                        className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-cyan-500/50 transition cursor-pointer"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <div className="text-2xl font-bold mb-1">
                              {stock.symbol}
                            </div>
                            <div className="text-sm text-gray-400">
                              {stock.name}
                            </div>
                          </div>
                          {stock.trending === "up" ? (
                            <TrendingUp className="w-5 h-5 text-green-500" />
                          ) : (
                            <TrendingDown className="w-5 h-5 text-red-500" />
                          )}
                        </div>

                        <div className="text-3xl font-bold mb-2">
                          ${formatNumber(stock.price, 2)}
                        </div>
                        <div
                          className={`text-sm mb-6 ${
                            stock.changePercent >= 0
                              ? "text-green-500"
                              : "text-red-500"
                          }`}
                        >
                          {stock.change >= 0 ? "+" : ""}
                          {formatNumber(stock.change, 2)} (
                          {stock.changePercent >= 0 ? "+" : ""}
                          {formatNumber(stock.changePercent, 2)}%)
                        </div>

                        <div className="flex justify-between text-sm">
                          <div>
                            <div className="text-gray-400 mb-1">
                              Volume
                            </div>
                            <div className="font-semibold">
                              {stock.volume}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-gray-400 mb-1">
                              Market Cap
                            </div>
                            <div className="font-semibold">
                              {stock.marketCap}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* Features Section */}
            <section className="px-6 py-20">
              <div className="max-w-7xl mx-auto">
                <div className="text-center mb-16">
                  <h2 className="text-5xl font-bold mb-4">
                    Everything You Need to Make Smart Investments
                  </h2>
                  <p className="text-xl text-gray-400">
                    Comprehensive analysis tools designed for first-time
                    investors and seasoned professionals
                  </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {features.map((feature, idx) => (
                    <div
                      key={idx}
                      className="bg-gray-900 border border-gray-800 rounded-xl p-8 hover:border-gray-700 transition"
                    >
                      <div
                        className={`w-14 h-14 bg-gray-800 rounded-xl flex items-center justify-center mb-6 text-${feature.color}-400`}
                      >
                        {feature.icon}
                      </div>
                      <h3 className="text-xl font-bold mb-3">
                        {feature.title}
                      </h3>
                      <p className="text-gray-400">{feature.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </>
        )}

        {currentView === "details" && selectedStock && selectedStockDoc && (
          <section className="px-6 py-8">
            <div className="max-w-7xl mx-auto">
              <button
                onClick={() => setCurrentView("home")}
                className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Search
              </button>

              {/* Stock Header */}
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 mb-6">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-cyan-500 rounded-full flex items-center justify-center text-2xl font-bold">
                      {selectedStock.symbol[0]}
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold mb-2">
                        {selectedStock.name}
                      </h1>
                      <div className="text-sm text-gray-400">
                        {selectedStock.symbol}
                      </div>
                    </div>
                  </div>
                  <button className="px-8 py-3 bg-cyan-500 hover:bg-cyan-600 rounded-xl transition font-semibold flex items-center gap-2">
                    <Brain className="w-5 h-5" />
                    AI Recommendation
                    <span className="ml-2 px-3 py-1 bg-cyan-600 rounded-lg text-sm">
                      {selectedSocialDoc &&
                      normalizeScore(
                        selectedSocialDoc.sentiment?.investability_score,
                        70
                      ) > 60
                        ? "Buy"
                        : "Watch"}
                    </span>
                  </button>
                </div>

                <div className="mt-8 flex items-center gap-8 flex-wrap">
                  <div>
                    <div className="text-4xl font-bold mb-2">
                      ${formatNumber(selectedStock.price, 2)}
                    </div>
                    <div
                      className={`text-lg ${
                        selectedStock.change >= 0
                          ? "text-green-500"
                          : "text-red-500"
                      }`}
                    >
                      {selectedStock.change >= 0 ? "+" : ""}
                      {formatNumber(selectedStock.change, 2)} (
                      {selectedStock.changePercent >= 0 ? "+" : ""}
                      {formatNumber(selectedStock.changePercent, 2)}%)
                    </div>
                    <div className="text-sm text-gray-400 mt-1">
                      Market Cap: {selectedStock.marketCap}
                    </div>
                  </div>

                  <div className="flex-1 min-w-[260px] ml-0 lg:ml-12">
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-gray-400">
                        Target Price (model)
                      </span>
                      <span className="text-sm text-gray-400">
                        Confidence
                      </span>
                    </div>
                    <div className="flex justify-between mb-3">
                      <span className="text-xl font-bold text-green-400">
                        $
                        {formatNumber(
                          selectedStock.price * 1.12,
                          2
                        )}
                      </span>
                      <span className="text-xl font-bold">
                        {platformScore}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-cyan-500 to-green-500 h-2 rounded-full"
                        style={{ width: `${platformScore}%` }}
                      ></div>
                    </div>
                    <div className="text-sm text-green-400 mt-2">
                      Upside{" "}
                      {formatNumber(
                        (platformScore / 100) * 20,
                        1
                      )}
                      %
                    </div>
                  </div>
                </div>
              </div>

              {/* Company Overview */}
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 mb-6">
                <h2 className="text-2xl font-bold mb-6">
                  Company Overview
                </h2>
                <div className="grid grid-cols-2 gap-6">
                  <div className="flex justify-between py-3 border-b border-gray-800">
                    <span className="text-gray-400">Sector</span>
                    <span className="font-semibold">
                      {selectedStockDoc.sector || "-"}
                    </span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-gray-800">
                    <span className="text-gray-400">Industry</span>
                    <span className="font-semibold">
                      {selectedStockDoc.industry || "-"}
                    </span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-gray-800">
                    <span className="text-gray-400">
                      Market Cap
                    </span>
                    <span className="font-semibold">
                      {formatCurrency(
                        selectedStockDoc.market_cap
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-gray-800">
                    <span className="text-gray-400">
                      52 Week Range
                    </span>
                    <span className="font-semibold">
                      $
                      {formatNumber(
                        selectedStockDoc.year_low,
                        2
                      )}{" "}
                      - $
                      {formatNumber(
                        selectedStockDoc.year_high,
                        2
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between py-3">
                    <span className="text-gray-400">Avg Volume</span>
                    <span className="font-semibold">
                      {formatBigNumber(selectedStockDoc.volume)}
                    </span>
                  </div>
                  <div className="flex justify-between py-3">
                    <span className="text-gray-400">
                      Total Revenue
                    </span>
                    <span className="font-semibold">
                      {formatCurrency(
                        selectedStockDoc.total_revenue
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Financial Ratios and AI Analysis */}
              <div className="grid lg:grid-cols-2 gap-6 mb-6">
                {/* Financial Ratios */}
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-8">
                  <h2 className="text-2xl font-bold mb-6">
                    Financial Ratios
                  </h2>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-gray-800 border border-yellow-500/30 rounded-lg p-4">
                      <div className="text-xs text-gray-400 mb-1">
                        P/E Ratio
                      </div>
                      <div className="text-2xl font-bold text-yellow-400">
                        {formatNumber(
                          selectedStockDoc.pe_ratio,
                          1
                        )}
                      </div>
                    </div>
                    <div className="bg-gray-800 border border-cyan-500/30 rounded-lg p-4">
                      <div className="text-xs text-gray-400 mb-1">
                        ROE
                      </div>
                      <div className="text-2xl font-bold text-cyan-400">
                        {formatNumber(selectedStockDoc.roe, 1)}%
                      </div>
                    </div>
                    <div className="bg-gray-800 border border-green-500/30 rounded-lg p-4">
                      <div className="text-xs text-gray-400 mb-1">
                        Debt to Equity
                      </div>
                      <div className="text-2xl font-bold text-green-400">
                        {formatNumber(
                          selectedStockDoc.debt_to_equity,
                          2
                        )}
                      </div>
                    </div>
                    <div className="bg-gray-800 border border-cyan-500/30 rounded-lg p-4">
                      <div className="text-xs text-gray-400 mb-1">
                        EPS
                      </div>
                      <div className="text-2xl font-bold text-cyan-400">
                        $
                        {formatNumber(
                          selectedStockDoc.eps,
                          2
                        )}
                      </div>
                    </div>
                    <div className="bg-gray-800 border border-cyan-500/30 rounded-lg p-4">
                      <div className="text-xs text-gray-400 mb-1">
                        Current Ratio
                      </div>
                      <div className="text-2xl font-bold text-cyan-400">
                        {formatNumber(
                          selectedStockDoc.current_ratio,
                          2
                        )}
                      </div>
                    </div>
                    <div className="bg-gray-800 border border-green-500/30 rounded-lg p-4">
                      <div className="text-xs text-gray-400 mb-1">
                        Profit Margin
                      </div>
                      <div className="text-2xl font-bold text-green-400">
                        {formatNumber(
                          selectedStockDoc.profit_margin,
                          1
                        )}
                        %
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-4 mt-4 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-gray-400">Healthy</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <span className="text-gray-400">Moderate</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span className="text-gray-400">
                        Concerning
                      </span>
                    </div>
                  </div>
                </div>

                {/* AI Analysis */}
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-lg flex items-center justify-center">
                      <Brain className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">AI Analysis</h2>
                      <p className="text-xs text-gray-400">
                        Powered by your MongoDB fundamentals + social
                        data
                      </p>
                    </div>
                    <Sparkles className="w-5 h-5 text-yellow-400 ml-auto" />
                  </div>

                  <div className="space-y-4">
                    <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-4 h-4 text-green-400" />
                        <span className="font-semibold text-green-400">
                          Revenue & Growth
                        </span>
                      </div>
                      <p className="text-sm text-gray-300">
                        {selectedSocialDoc?.financials
                          ? `Company shows a ${
                              cagr !== null
                                ? formatNumber(cagr, 1) + "%"
                                : ""
                            } CAGR (2021-2024) with strong revenue base.`
                          : "Revenue growth data not available in social.financials for this ticker."}
                      </p>
                    </div>

                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="w-4 h-4 text-blue-400" />
                        <span className="font-semibold text-blue-400">
                          Market & Sentiment
                        </span>
                      </div>
                      <p className="text-sm text-gray-300">
                        Sentiment score around{" "}
                        {sentimentScore}
                        /100 with confidence{" "}
                        {platformScore}
                        %. Signals combine social, news, and
                        fundamentals from your dataset.
                      </p>
                    </div>

                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Shield className="w-4 h-4 text-yellow-400" />
                        <span className="font-semibold text-yellow-400">
                          Valuation Check
                        </span>
                      </div>
                      <p className="text-sm text-gray-300">
                        P/E of{" "}
                        {formatNumber(
                          selectedStockDoc.pe_ratio,
                          1
                        )}{" "}
                        and profit margin of{" "}
                        {formatNumber(
                          selectedStockDoc.profit_margin,
                          1
                        )}
                        % compared with sector peers can indicate a
                        premium valuation. Monitor for attractive entry
                        points.
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 pt-6 border-t border-gray-800">
                    <div className="grid grid-cols-3 gap-4 text-center text-sm">
                      <div>
                        <div className="text-gray-400 mb-1">
                          Model Confidence
                        </div>
                        <div className="font-bold text-cyan-400">
                          {platformScore}%
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-400 mb-1">
                          Data Points
                        </div>
                        <div className="font-bold">
                          {selectedSocialDoc
                            ? 1000 +
                              (selectedSocialDoc?.financials
                                ? 500
                                : 0)
                            : 800}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-400 mb-1">
                          Last Updated
                        </div>
                        <div className="font-bold">from DB</div>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-4">
                      AI analysis combines your MongoDB fundamentals,
                      technical metrics, and sentiment fields for this
                      ticker.
                    </p>
                  </div>
                </div>
              </div>

              {/* Revenue Growth Forecast and Social Score */}
              <div className="grid lg:grid-cols-2 gap-6 mb-6">
                {/* Revenue Growth */}
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-8">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">
                      Revenue Growth Forecast
                    </h2>
                    <div className="flex gap-2 text-xs">
                      <span className="px-3 py-1 bg-cyan-500/20 text-cyan-400 rounded">
                        Actual
                      </span>
                      <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded">
                        Forecast
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-400 mb-6">
                    Historical & projected revenue (from
                    social.financials in MongoDB)
                  </p>

                  <div className="h-64 flex items-end justify-between gap-2">
                    {revenueYears.map((year) => {
                      const value = getRevenueValueForYear(year);
                      const height = (value / maxRevenue) * 220;

                      const isActual = ["2022", "2023", "2024"].includes(
                        year
                      );

                      return (
                        <div
                          key={year}
                          className="flex-1 flex flex-col items-center"
                        >
                          <div
                            className="w-full bg-gray-800 rounded-t-lg relative"
                            style={{ height: `${height || 4}px` }}
                          >
                            {selectedSocialDoc?.financials &&
                              value > 0 && (
                                <div
                                  className={`absolute inset-0 rounded-t-lg ${
                                    isActual
                                      ? "bg-cyan-500/30"
                                      : "bg-green-500/30 border-2 border-dashed border-green-500"
                                  }`}
                                ></div>
                              )}
                          </div>
                          <span className="text-xs text-gray-500 mt-2">
                            {year}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="grid grid-cols-3 gap-4 mt-8 text-center">
                    <div>
                      <div className="text-gray-400 text-xs mb-1">
                        2024 Revenue
                      </div>
                      <div className="font-bold text-cyan-400">
                        {formatCurrency(revenue2024 ?? undefined)}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-400 text-xs mb-1">
                        2027 Forecast
                      </div>
                      <div className="font-bold text-green-400">
                        {formatCurrency(revenue2027 ?? undefined)}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-400 text-xs mb-1">
                        5-Year CAGR
                      </div>
                      <div className="font-bold text-yellow-400">
                        {cagr !== null
                          ? `${formatNumber(cagr, 1)}%`
                          : "-"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Social Score */}
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-8">
                  <h2 className="text-2xl font-bold mb-6">
                    Social Score
                  </h2>

                  <div className="flex items-center justify-center mb-8">
                    <div className="relative">
                      <svg className="w-48 h-48 transform -rotate-90">
                        <circle
                          cx="96"
                          cy="96"
                          r="80"
                          stroke="#1f2937"
                          strokeWidth="16"
                          fill="none"
                        />
                        <circle
                          cx="96"
                          cy="96"
                          r="80"
                          stroke="url(#gradient)"
                          strokeWidth="16"
                          fill="none"
                          strokeDasharray={`${
                            (sentimentScore / 100) * 502
                          } 502`}
                          strokeLinecap="round"
                        />
                        <defs>
                          <linearGradient
                            id="gradient"
                            x1="0%"
                            y1="0%"
                            x2="100%"
                            y2="0%"
                          >
                            <stop
                              offset="0%"
                              stopColor="#ef4444"
                            />
                            <stop
                              offset="50%"
                              stopColor="#eab308"
                            />
                            <stop
                              offset="100%"
                              stopColor="#22c55e"
                            />
                          </linearGradient>
                        </defs>
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-5xl font-bold">
                            {sentimentScore}
                          </div>
                          <div className="text-sm text-gray-400">
                            / 100
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-400">
                          Platform Scores
                        </span>
                        <span className="font-semibold">
                          {platformScore}{" "}
                          <span className="text-green-400">
                            +4.5%
                          </span>
                        </span>
                      </div>
                      <div className="w-full bg-gray-800 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-yellow-500 to-green-500 h-2 rounded-full"
                          style={{
                            width: `${platformScore}%`,
                          }}
                        ></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-400">Reddit</span>
                        <span className="font-semibold">
                          {redditScore}{" "}
                          <span className="text-green-400">
                            +3.2%
                          </span>
                        </span>
                      </div>
                      <div className="w-full bg-gray-800 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{
                            width: `${redditScore}%`,
                          }}
                        ></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-400">News</span>
                        <span className="font-semibold">
                          {newsScore}{" "}
                          <span className="text-yellow-400">
                            -1.8%
                          </span>
                        </span>
                      </div>
                      <div className="w-full bg-gray-800 rounded-full h-2">
                        <div
                          className="bg-yellow-500 h-2 rounded-full"
                          style={{
                            width: `${newsScore}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-gray-500 mt-6">
                    Social metrics are derived from the{" "}
                    <code>sentiment</code> object in your{" "}
                    <code>social</code> collection.
                  </p>

                  <div className="mt-6 flex flex-wrap gap-2">
                    {(selectedSocialDoc?.sentiment
                      ?.top_positive_signals || []
                    )
                      .slice(0, 3)
                      .map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-cyan-500/20 text-cyan-400 rounded-full text-xs"
                        >
                          #{tag}
                        </span>
                      ))}
                  </div>
                </div>
              </div>

              {/* Risk Dashboard */}
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-8">
                <div className="flex items-center gap-3 mb-6">
                  <Shield className="w-6 h-6 text-yellow-400" />
                  <h2 className="text-2xl font-bold">
                    Professional Risk Dashboard
                  </h2>
                </div>

                <div className="grid lg:grid-cols-2 gap-8">
                  <div className="flex items-center justify-center">
                    <div className="relative">
                      <svg className="w-56 h-56 transform -rotate-90">
                        <circle
                          cx="112"
                          cy="112"
                          r="90"
                          stroke="#1f2937"
                          strokeWidth="20"
                          fill="none"
                        />
                        <circle
                          cx="112"
                          cy="112"
                          r="90"
                          stroke="#f59e0b"
                          strokeWidth="20"
                          fill="none"
                          strokeDasharray={`${
                            (overallRisk / 100) * 565
                          } 565`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-6xl font-bold text-yellow-400">
                            {overallRisk}
                          </div>
                          <div className="text-sm text-gray-400">
                            / 100
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-400">
                          Volatility
                        </span>
                        <span className="font-semibold">
                          {volatilityScore}/100
                        </span>
                      </div>
                      <div className="w-full bg-gray-800 rounded-full h-2">
                        <div
                          className="bg-yellow-500 h-2 rounded-full"
                          style={{
                            width: `${volatilityScore}%`,
                          }}
                        ></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-400">
                          Liquidity
                        </span>
                        <span className="font-semibold">
                          {liquidityScore}/100
                        </span>
                      </div>
                      <div className="w-full bg-gray-800 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{
                            width: `${liquidityScore}%`,
                          }}
                        ></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-400">
                          Debt Levels
                        </span>
                        <span className="font-semibold">
                          {debtScore}/100
                        </span>
                      </div>
                      <div className="w-full bg-gray-800 rounded-full h-2">
                        <div
                          className="bg-yellow-500 h-2 rounded-full"
                          style={{ width: `${debtScore}%` }}
                        ></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-400">
                          Market Conditions
                        </span>
                        <span className="font-semibold">
                          {100 - volatilityScore + 10}/100
                        </span>
                      </div>
                      <div className="w-full bg-gray-800 rounded-full h-2">
                        <div
                          className="bg-red-500 h-2 rounded-full"
                          style={{
                            width: `${
                              100 - volatilityScore + 10
                            }%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <Shield className="w-5 h-5 text-yellow-400" />
                    <span className="font-bold text-yellow-400">
                      {overallRisk <= 35
                        ? "Low Risk"
                        : overallRisk <= 65
                        ? "Moderate Risk"
                        : "High Risk"}
                    </span>
                  </div>
                  <p className="text-sm text-gray-300">
                    Risk score is computed from volatility, liquidity,
                    and debt metrics pulled directly from your{" "}
                    <code>yfinance</code> collection. Adjust your
                    strategy based on your risk appetite.
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-800 mt-20">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-lg flex items-center justify-center">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <div className="text-xl font-bold">QUANT MIND</div>
              </div>
              <p className="text-sm text-gray-400">
                Analyze smarter, Invest wiser
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <div className="space-y-2 text-sm text-gray-400">
                <div className="hover:text-white cursor-pointer">
                  Features
                </div>
                <div className="hover:text-white cursor-pointer">
                  Pricing
                </div>
                <div className="hover:text-white cursor-pointer">
                  API
                </div>
                <div className="hover:text-white cursor-pointer">
                  Documentation
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <div className="space-y-2 text-sm text-gray-400">
                <div className="hover:text-white cursor-pointer">
                  About
                </div>
                <div className="hover:text-white cursor-pointer">
                  Blog
                </div>
                <div className="hover:text-white cursor-pointer">
                  Careers
                </div>
                <div className="hover:text-white cursor-pointer">
                  Contact
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <div className="space-y-2 text-sm text-gray-400">
                <div className="hover:text-white cursor-pointer">
                  Privacy
                </div>
                <div className="hover:text-white cursor-pointer">
                  Terms
                </div>
                <div className="hover:text-white cursor-pointer">
                  Security
                </div>
                <div className="hover:text-white cursor-pointer">
                  Disclaimer
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
            <p>&copy; 2025 Quant Mind. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
