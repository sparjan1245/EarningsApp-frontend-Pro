# Complete Bulk Upload Earnings Records Guide

## Overview
This guide covers the complete end-to-end flow for bulk uploading earnings records via CSV file, including both frontend UI and backend processing.

## 📋 CSV Template

### Download Template
Use the file `EARNINGS_CSV_TEMPLATE.csv` as your starting point.

### Required Columns (Must Have Values)
1. **Ticker** - Stock symbol (e.g., AAPL, MSFT)
2. **Fiscal Year** - Year as number (e.g., 2024)
3. **Fiscal Quarter** - Quarter identifier (e.g., Q1, Q2, Q3, Q4)
4. **Earnings Date** - Date in YYYY-MM-DD format (e.g., 2024-01-25)

### Optional Columns (Can Be Empty)
5. **Company Name** - Full company name
6. **Sector** - Industry sector
7. **Market Cap (B USD)** - Market cap in billions
8. **Quarterly Revenue (B USD)** - Revenue in billions
9. **EPS (USD)** - Earnings per share
10. **P/E Ratio** - Price to earnings ratio
11. **Report Time** - "day" or "night" (defaults to "day")

### Sample CSV Format
```csv
Ticker,Company Name,Sector,Market Cap (B USD),Quarterly Revenue (B USD),EPS (USD),P/E Ratio,Earnings Date,Fiscal Year,Fiscal Quarter,Report Time
AAPL,Apple Inc.,Technology,3000.50,394.33,6.16,32.47,2024-01-25,2024,Q1,day
MSFT,Microsoft Corporation,Technology,2800.25,620.20,2.93,38.50,2024-01-24,2024,Q2,day
```

## 🔄 Complete Upload Flow

### Frontend Flow (React/TypeScript)

1. **User selects CSV file**
   - File input accepts `.csv` files
   - Two upload methods available:
     - **Chunked Upload**: Parses in browser, uploads in 50-row chunks
     - **Direct Upload**: Uploads file directly to server

2. **CSV Parsing (Chunked Upload Method)**
   - Uses PapaParse library
   - Normalizes column names (removes spaces, special chars)
   - Maps to field aliases:
     - `ticker` → ['ticker', 'symbol']
     - `company` → ['companyname', 'company name', 'company']
     - `marketCap` → ['marketcapbusd', 'market cap (b usd)', 'marketcap']
     - etc.

3. **Data Transformation**
   ```typescript
   {
     id: `tmp-${Date.now()}-${i}`,  // Temporary ID (not sent to backend)
     ticker: string,
     companyName: string,
     sector: string,
     marketCap: string | null,      // Converted to string
     revenue: string | null,
     eps: string | null,
     peRatio: string | null,
     earningsDate: ISO string,
     fiscalYear: number,
     fiscalQuarter: string,
     reportTime: 'day' | 'night'
   }
   ```

4. **Upload Process**
   - **Chunked**: Splits into 50-row chunks, uploads 5 chunks in parallel
   - **Direct**: Uploads entire file via FormData
   - Shows progress bar
   - Handles authentication refresh automatically
   - Can be cancelled mid-upload

### Backend Flow (NestJS)

1. **Gateway Service** (`/api/stock/chunked-bulk`)
   - Receives POST request with array of records
   - Calls gRPC client: `adminGrpcClient.bulkUploadStocks({ stocks: chunk })`

2. **Admin Service gRPC Controller**
   - Receives gRPC call
   - Calls `stockService.chunkedBulkUpsert(chunk)`
   - Returns response with `{ inserted, updated, skipped, total }`

3. **Stock Service Processing**
   - Validates each row (requires: ticker, fiscalYear, fiscalQuarter)
   - Checks for existing records (unique key: ticker + fiscalYear + fiscalQuarter)
   - Separates into inserts and updates
   - Executes in database transaction
   - Returns counts:
     ```typescript
     {
       message: 'Chunk processed successfully',
       inserted: number,
       updated: number,
       skipped: number,
       total: number
     }
     ```

4. **Database Upsert**
   - **New records**: Creates with new UUID
   - **Existing records**: Updates all fields
   - Uses composite unique key: `ticker_fiscalYear_fiscalQuarter`

### Response Flow Back

1. **Backend → Gateway**
   ```json
   {
     "message": "Chunk processed successfully",
     "inserted": 45,
     "updated": 5,
     "skipped": 0,
     "total": 50,
     "success": true
   }
   ```

2. **Gateway → Frontend**
   - Same format passed through

3. **Frontend Aggregation**
   - Aggregates results from all chunks
   - Shows success dialog with totals:
     - Total inserted
     - Total updated
     - Total skipped

## 🎯 Field Mapping Reference

### Frontend CSV Parser Field Aliases
```typescript
ticker: ['ticker', 'symbol']
company: ['companyname', 'company name', 'company']
sector: ['sector']
marketCap: ['marketcapbusd', 'market cap (b usd)', 'marketcapb', 'mcap', 'marketcap']
revenue: ['quarterlyrevenuebusd', 'quarterly revenue (b usd)', 'quarterlyrevenue', 'revenue']
eps: ['epsusd', 'eps (usd)', 'eps']
peRatio: ['peratio', 'p/e ratio', 'p/e', 'priceearnings', 'pe']
earningsDate: ['earningsdate', 'earnings date', 'date']
fiscalYear: ['fiscalyear', 'fiscal year', 'fy']
fiscalQuarter: ['fiscalquarter', 'fiscal quarter', 'quarter', 'fq']
reportTime: ['reporttime', 'report time', 'time']
```

### Backend CSV Parser Field Aliases
```typescript
Ticker: ['Ticker', 'ticker', 'Symbol', 'symbol']
Company Name: ['Company Name', 'Company', 'company', 'companyName']
Sector: ['Sector', 'sector']
Market Cap: ['Market Cap (B USD)', 'Market Cap', 'marketCap', 'Market Cap (B)']
Revenue: ['Quarterly Revenue (B USD)', 'Revenue', 'revenue', 'Quarterly Revenue']
EPS: ['EPS (USD)', 'EPS', 'eps']
P/E Ratio: ['P/E Ratio', 'PE Ratio', 'peRatio', 'P/E']
Earnings Date: ['Earnings Date', 'Date', 'earningsDate']
Fiscal Year: ['Fiscal Year', 'fiscalYear', 'FY', 'fy']
Fiscal Quarter: ['Fiscal Quarter', 'fiscalQuarter', 'Quarter', 'quarter']
Report Time: ['Report Time', 'Time', 'reportTime']
```

## ✅ Validation Rules

### Required Fields
- **Ticker**: Must be non-empty string
- **Fiscal Year**: Must be a valid number
- **Fiscal Quarter**: Must be non-empty string
- **Earnings Date**: Must be valid date (YYYY-MM-DD format)

### Optional Fields
- All other fields can be empty/null
- Empty numeric fields stored as `null` in database
- Missing `reportTime` defaults to `'day'`

### Duplicate Handling
- Records with same `ticker + fiscalYear + fiscalQuarter` are **updated** (not duplicated)
- This is an **upsert** operation (insert or update)

## 🚀 Upload Methods Comparison

| Feature | Chunked Upload | Direct Upload |
|---------|---------------|---------------|
| **File Size Limit** | Browser memory (~50MB) | Server limit (100MB) |
| **Best For** | Files < 10MB, < 1000 rows | Large files > 10MB |
| **Progress Tracking** | Per chunk (50 rows) | Overall progress |
| **Browser Memory** | Loads entire file | Streams to server |
| **Error Handling** | Per chunk | Overall |
| **Authentication** | Auto-refresh every 10 chunks | Single request |

## 📊 Success Response Format

```typescript
{
  message: string;        // "Chunk processed successfully"
  inserted: number;       // New records created
  updated: number;        // Existing records updated
  skipped: number;        // Invalid rows skipped
  total: number;         // Total rows in chunk
  success: boolean;       // Always true on success
}
```

## 🔍 Troubleshooting

### Common Issues

1. **"Missing ticker" error**
   - Ensure every row has a value in Ticker column
   - Check for empty rows in CSV

2. **"Missing fiscalYear" error**
   - Ensure Fiscal Year is a number (not text)
   - Check for empty cells

3. **"Missing fiscalQuarter" error**
   - Ensure Fiscal Quarter column has values (Q1, Q2, Q3, Q4)
   - Check spelling/case

4. **Upload times out**
   - Use Direct Upload for large files
   - Split into smaller files (< 1000 rows each)

5. **Some rows skipped**
   - Check success dialog for details
   - Verify required fields are filled
   - Check date format (YYYY-MM-DD)

6. **Authentication expired**
   - System auto-refreshes every 10 chunks
   - If still fails, log out and log back in

## 🎨 UI Features

### Upload Dialog
- **Two tabs**: Chunked Upload | Direct Upload
- **File selection**: Browse and select CSV file
- **Progress bar**: Real-time upload progress
- **Cancel button**: Stop upload mid-process
- **Error display**: Shows specific error messages

### Success Dialog
- **Summary stats**: Inserted, Updated, Skipped counts
- **Success rate**: Percentage calculation
- **Total processed**: Total rows processed
- **Color coding**: Green for success, yellow for warnings

## 📝 Example Workflow

1. **Prepare CSV**
   - Download `EARNINGS_CSV_TEMPLATE.csv`
   - Fill in your data
   - Ensure required columns have values

2. **Upload**
   - Go to Earnings Admin Page
   - Click "Upload CSV" button
   - Select your CSV file
   - Choose upload method (Chunked or Direct)
   - Click "Upload" button

3. **Monitor Progress**
   - Watch progress bar
   - See chunk numbers (for chunked upload)
   - Can cancel if needed

4. **Review Results**
   - Success dialog shows:
     - How many records inserted
     - How many records updated
     - How many records skipped
   - Click "Close" to finish

5. **Verify Data**
   - Check the earnings table
   - Search for your uploaded records
   - Edit if needed

## 🔧 Technical Details

### API Endpoints

**Chunked Upload:**
```
POST /api/stock/chunked-bulk
Body: EarningsRow[]
Response: { inserted, updated, skipped, total, success }
```

**Direct Upload:**
```
POST /api/stock/upload-earnings
Body: FormData (file)
Response: { inserted, updated, skipped, total, message }
```

### Database Schema
- **Table**: `FinancialRecord`
- **Unique Key**: `ticker + fiscalYear + fiscalQuarter`
- **Fields**: All optional except ticker, fiscalYear, fiscalQuarter

### Performance
- **Chunked**: 50 rows per chunk, 5 chunks in parallel
- **Direct**: Server processes in 1000-row chunks
- **Transaction**: Each chunk processed in single transaction
- **Upsert**: Efficient database operations

## ✅ Verification Checklist

- [x] CSV template created with all required columns
- [x] Frontend CSV parser handles all field aliases
- [x] Backend CSV parser handles all field aliases
- [x] Data transformation correct (string numbers, dates)
- [x] Validation rules enforced (required fields)
- [x] Duplicate handling (upsert logic)
- [x] Error handling (skipped rows, error messages)
- [x] Progress tracking (chunked and direct)
- [x] Success dialog shows correct counts
- [x] Authentication refresh during upload
- [x] Cancel functionality works
- [x] Response format matches frontend expectations

## 🎉 Ready to Use!

The complete bulk upload functionality is now fully implemented and tested. Use the `EARNINGS_CSV_TEMPLATE.csv` file to get started!

