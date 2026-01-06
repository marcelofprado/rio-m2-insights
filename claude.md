# Claude.md - Development Notes

## Recent Changes (2026-01-06)

### Fixed Graph Data Aggregation and Display Issues

The graph had multiple issues preventing correct data display. The following fixes were implemented:

#### 1. Data Filtering
- **Parking Spaces Filtered Out**: Records with `principais_tipologias = "VAGA DE GARAGEM"` are now excluded from all calculations ([App.tsx:35](src/App.tsx#L35))
- **Property Type Toggle**: The Residencial/Comercial toggle correctly filters the `uso` column:
  - Residencial: filters for `uso = "RESIDENCIAL"`
  - Comercial: filters for `uso = "NAO RESIDENCIAL"`
  - Implementation: [App.tsx:40-47](src/App.tsx#L40-L47)

#### 2. Correct Price per m² Aggregation
Previously, the code was incorrectly calculating the average price per m² by simply averaging the individual record prices. This is incorrect when aggregating multiple records.

**New Methodology** (implemented in [itbi.ts:83-93](src/api/itbi.ts#L83-L93) and [PriceChart.tsx:57-66](src/components/PriceChart.tsx#L57-L66)):
```
For each month:
1. Calculate A = sum(média_valor_imóvel × total_transações)
2. Calculate B = sum(média_área_construída × total_transações)
3. Average price per m² = A / B
```

This properly weights each transaction by its count, giving accurate aggregated prices.

#### 3. Transaction Count Aggregation
The number of transactions for each month is correctly calculated as:
```
sum(total_transações) for all records in that month
```
Implementation: [PriceChart.tsx:40-44](src/components/PriceChart.tsx#L40-L44)

#### 4. Fixed Month Range Display Bug
**Issue**: The chart was showing data for the wrong months. The months array generation was starting from 23 months ago instead of 24 months ago.

**Root Cause**: The loop `for (let i = 23; i >= 0; i--)` was generating months starting from February 2024 instead of January 2024, causing all data to be shifted by one month.

**Fix** ([PriceChart.tsx:28](src/components/PriceChart.tsx#L28)):
```javascript
// Changed from: for (let i = 23; i >= 0; i--)
for (let i = 24; i >= 1; i--)
```

This now correctly generates the last 24 complete months of data.

#### 5. Fixed Timezone Issue with Chart Labels
**Issue**: Chart labels were showing incorrect months (e.g., "dez 2023" instead of "jan 2024") due to timezone conversion issues.

**Root Cause**: Creating dates with `new Date('2024-01-01')` interprets the string as UTC midnight. When `date-fns` format function converts to local time (Brazil is UTC-3), the date shifts back to December 31, 2023, displaying as "dez 2023".

**Fix** ([PriceChart.tsx:80-84](src/components/PriceChart.tsx#L80-L84)):
```javascript
const chartLabels = last24.months.map((m) => {
  const [year, month] = m.split('-')
  // Use local timezone to avoid timezone shift issues
  return format(new Date(parseInt(year), parseInt(month) - 1, 1), 'MMM yyyy', { locale: ptBR })
})
```

By constructing the Date object directly with year and month integers, we create it in the local timezone, avoiding any UTC conversion.

#### 6. Code Cleanup
- Removed all `console.log` debugging statements from:
  - [App.tsx](src/App.tsx)
  - [PriceChart.tsx](src/components/PriceChart.tsx)
  - [itbi.ts](src/api/itbi.ts)
- Kept `console.error` statements for proper error handling

## Data Structure

Each record from the API contains:
- `logradouro`: Street name
- `ano_transação`, `mês_transação`: Year and month
- `média_valor_imóvel`: Average property value
- `média_área_construída`: Average built area
- `total_transações`: Number of transactions
- `uso`: Property usage (RESIDENCIAL or NAO RESIDENCIAL)
- `principais_tipologias`: Property types (filtered to exclude VAGA DE GARAGEM)
- `bairro`: Neighborhood name

## Technical Notes

### Why the new aggregation method is correct:
When combining multiple records representing different property segments (e.g., different property types on the same street in the same month), we need to:
1. Weight each segment by its transaction count
2. Sum the total values and total areas across all segments
3. Divide to get the overall average

Example:
- Segment A: 2 transactions, R$500k average value, 100m² average area
- Segment B: 8 transactions, R$400k average value, 80m² average area

**Wrong way** (simple average): (5000 + 5000) / 2 = 5000 R$/m²
**Correct way** (weighted):
- Total value: (500k × 2) + (400k × 8) = 4,200k
- Total area: (100 × 2) + (80 × 8) = 840m²
- Average: 4,200k / 840 = 5,000 R$/m² (in this case happens to be the same, but differs with different weights)

This ensures larger transaction volumes have appropriate influence on the final average.
