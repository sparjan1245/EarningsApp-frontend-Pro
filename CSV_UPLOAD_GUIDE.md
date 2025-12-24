# Earnings CSV Upload Guide

## CSV Template Format

This guide explains how to format your CSV file for bulk uploading earnings records.

### Required Columns

The following columns are **REQUIRED** (must have values):
- **Ticker** - Stock ticker symbol (e.g., AAPL, MSFT, GOOGL)
- **Fiscal Year** - Fiscal year as a number (e.g., 2024)
- **Fiscal Quarter** - Fiscal quarter (e.g., Q1, Q2, Q3, Q4)
- **Earnings Date** - Date in format YYYY-MM-DD (e.g., 2024-01-25)

### Optional Columns

The following columns are **OPTIONAL** (can be empty):
- **Company Name** - Full company name (e.g., Apple Inc.)
- **Sector** - Industry sector (e.g., Technology, Healthcare)
- **Market Cap (B USD)** - Market capitalization in billions USD (e.g., 3000.50)
- **Quarterly Revenue (B USD)** - Quarterly revenue in billions USD (e.g., 394.33)
- **EPS (USD)** - Earnings per share in USD (e.g., 6.16)
- **P/E Ratio** - Price to earnings ratio (e.g., 32.47)
- **Report Time** - Time of earnings report: "day" or "night" (defaults to "day")

### Column Name Variations

The system accepts multiple column name variations. Use any of these:

| Field | Accepted Column Names |
|-------|----------------------|
| Ticker | `Ticker`, `ticker`, `Symbol`, `symbol` |
| Company Name | `Company Name`, `Company`, `company`, `companyName` |
| Sector | `Sector`, `sector` |
| Market Cap | `Market Cap (B USD)`, `Market Cap`, `marketCap`, `Market Cap (B)`, `mcap` |
| Revenue | `Quarterly Revenue (B USD)`, `Revenue`, `revenue`, `Quarterly Revenue` |
| EPS | `EPS (USD)`, `EPS`, `eps` |
| P/E Ratio | `P/E Ratio`, `PE Ratio`, `peRatio`, `P/E`, `pe` |
| Earnings Date | `Earnings Date`, `Date`, `earningsDate` |
| Fiscal Year | `Fiscal Year`, `fiscalYear`, `FY`, `fy` |
| Fiscal Quarter | `Fiscal Quarter`, `fiscalQuarter`, `Quarter`, `quarter`, `fq` |
| Report Time | `Report Time`, `Time`, `reportTime` |

### Sample CSV Format

```csv
Ticker,Company Name,Sector,Market Cap (B USD),Quarterly Revenue (B USD),EPS (USD),P/E Ratio,Earnings Date,Fiscal Year,Fiscal Quarter,Report Time
AAPL,Apple Inc.,Technology,3000.50,394.33,6.16,32.47,2024-01-25,2024,Q1,day
MSFT,Microsoft Corporation,Technology,2800.25,620.20,2.93,38.50,2024-01-24,2024,Q2,day
GOOGL,Alphabet Inc.,Technology,1800.75,863.10,1.64,28.30,2024-01-30,2024,Q4,day
```

### Data Format Requirements

1. **Ticker**: Text string, no spaces (e.g., "AAPL")
2. **Fiscal Year**: Integer number (e.g., 2024)
3. **Fiscal Quarter**: Text string, typically "Q1", "Q2", "Q3", or "Q4"
4. **Earnings Date**: Date in YYYY-MM-DD format (e.g., "2024-01-25")
5. **Market Cap, Revenue, EPS, P/E Ratio**: Numbers (can include decimals). Commas and spaces are automatically removed.
6. **Report Time**: Either "day" or "night" (case-insensitive)

### Upload Methods

#### Method 1: Chunked Upload (Recommended for Large Files)
- Parses CSV in browser
- Uploads in chunks of 50 rows
- Shows progress for each chunk
- Best for files with 50+ rows
- Handles authentication refresh automatically

#### Method 2: Direct Upload (Recommended for Very Large Files)
- Uploads file directly to server
- Server processes the file
- Better for files > 10MB
- No browser memory limits
- Shows progress during upload

### Validation Rules

1. **Rows without Ticker, Fiscal Year, or Fiscal Quarter will be skipped**
2. **Duplicate records** (same ticker + fiscal year + fiscal quarter) will be **updated** (not duplicated)
3. **Invalid dates** will default to current date
4. **Empty numeric fields** will be stored as null
5. **Report Time** defaults to "day" if not specified

### Tips

1. **Use the template**: Download `EARNINGS_CSV_TEMPLATE.csv` as a starting point
2. **Check your data**: Ensure required fields are filled
3. **Date format**: Always use YYYY-MM-DD format for dates
4. **Large files**: Use Direct Upload for files > 10MB or > 1000 rows
5. **Progress tracking**: Watch the progress bar during upload
6. **Error handling**: Check the success dialog for skipped rows

### Example with Minimal Columns

You can create a CSV with just the required columns:

```csv
Ticker,Fiscal Year,Fiscal Quarter,Earnings Date
AAPL,2024,Q1,2024-01-25
MSFT,2024,Q2,2024-01-24
GOOGL,2024,Q4,2024-01-30
```

All other fields will be optional and can be added later via the Edit function.

### Troubleshooting

**Issue**: "Missing ticker" error
- **Solution**: Ensure every row has a value in the Ticker column

**Issue**: "Missing fiscalYear" error  
- **Solution**: Ensure every row has a numeric value in Fiscal Year column

**Issue**: "Missing fiscalQuarter" error
- **Solution**: Ensure every row has a value in Fiscal Quarter column (Q1, Q2, Q3, or Q4)

**Issue**: Upload fails or times out
- **Solution**: Try Direct Upload method for large files, or split into smaller files

**Issue**: Some rows are skipped
- **Solution**: Check the success dialog - it shows which rows were skipped and why

