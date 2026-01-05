# Rio m² Insights

A fast, modern frontend showing m² price insights for Rio de Janeiro (ITBI dataset).

## Features
- Search by street
- Last 24 months median R$/m² chart + monthly transaction counts
- Trend assessment (up/down/flat)
- Peak detection (possible empreendimentos released)

## Run
1. Install dependencies: `npm install`
2. Start dev server: `npm run dev`
3. Open `http://localhost:5173`

## Notes
- The app fetches data from the ArcGIS ITBI endpoint. First load may take time if the dataset is large.
- Field names in the dataset vary; parsing uses heuristics for date/value/area/address.
- Improvements: server-side filtering, full-text address index, caching, better peak detection and smoothing.
