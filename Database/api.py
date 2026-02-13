import yfinance as yf
import pandas as pd
import numpy as np
from pymongo import MongoClient
from dotenv import load_dotenv
import os
from datetime import datetime

# Load environment variables
load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")
DB_NAME = os.getenv("DB_NAME")
COLLECTION_NAME = os.getenv("COLLECTION_NAME")

client = MongoClient(MONGO_URI)
db = client[DB_NAME]
collection = db[COLLECTION_NAME]


def fetch_financials(ticker_symbol):
    t = yf.Ticker(ticker_symbol)

    data = {
        "ticker": ticker_symbol.upper(),
        "timestamp": datetime.utcnow().isoformat()
    }

    # -------- BASIC PRICE DATA --------
    fast = t.fast_info
    data["last_price"] = fast.get("lastPrice")
    data["market_cap"] = fast.get("marketCap")
    data["year_high"] = fast.get("yearHigh")
    data["year_low"] = fast.get("yearLow")
    data["volume"] = fast.get("lastVolume")

    # -------- SECTOR, INDUSTRY, EPS, PE, ROE, DEBT/ EQUITY, PROFIT MARGIN --------
    try:
        info = t.get_info()

        data["sector"] = info.get("sector")
        data["industry"] = info.get("industry")
        data["eps"] = info.get("trailingEps")
        data["pe_ratio"] = info.get("trailingPE")
        data["roe"] = info.get("returnOnEquity")
        data["debt_to_equity"] = info.get("debtToEquity")
        data["profit_margin"] = info.get("profitMargins")

    except:
        data["sector"] = None
        data["industry"] = None
        data["eps"] = None
        data["pe_ratio"] = None
        data["roe"] = None
        data["debt_to_equity"] = None
        data["profit_margin"] = None

    # -------- TOTAL REVENUE --------
    try:
        fin = t.get_financials()

        possible_revenue_rows = ["Total Revenue", "TotalRevenue"]

        revenue_value = None
        for name in possible_revenue_rows:
            if name in fin.index:
                revenue_value = fin.loc[name].iloc[0]
                break

        data["total_revenue"] = float(revenue_value) if revenue_value else None

    except:
        data["total_revenue"] = None

    # -------- CURRENT RATIO (FULL FIX) --------
    def extract_current_ratio(bs):
        asset_keys = ["Total Current Assets", "Current Assets", "CurrentAssets"]
        liability_keys = ["Total Current Liabilities", "Current Liabilities", "CurrentLiabilities"]

        curr_assets = None
        curr_liabilities = None

        for key in asset_keys:
            if key in bs.index:
                curr_assets = bs.loc[key].iloc[0]
                break

        for key in liability_keys:
            if key in bs.index:
                curr_liabilities = bs.loc[key].iloc[0]
                break

        if curr_assets and curr_liabilities and curr_liabilities != 0:
            return curr_assets / curr_liabilities

        return None

    # Annual
    try:
        bs_annual = t.get_balance_sheet()
        data["current_ratio"] = extract_current_ratio(bs_annual)
    except:
        data["current_ratio"] = None

    if data["current_ratio"] is None:
        try:
            bs_quarter = t.get_quarterly_balance_sheet()
            data["current_ratio"] = extract_current_ratio(bs_quarter)
        except:
            data["current_ratio"] = None


    try:
        hist = t.history(period="1y")
        hist["returns"] = hist["Close"].pct_change()
        data["volatility"] = float(hist["returns"].std() * np.sqrt(252))
        data["liquidity"] = float((hist["Close"] * hist["Volume"]).mean())
    except:
        data["volatility"] = None
        data["liquidity"] = None

    return data


def save_to_mongodb(data):
    collection.insert_one(data)
    print("✔ Saved to MongoDB successfully!")


if __name__ == "__main__":
    ticker = input("Enter stock ticker (e.g., AAPL): ").upper()
    print("\nFetching financial data...")

    try:
        result = fetch_financials(ticker)
        print("\nSaving to MongoDB...")
        save_to_mongodb(result)
        print("\n✔ Completed!")
        print(result)
    except Exception as e:
        print("\n❌ Error:", e)
