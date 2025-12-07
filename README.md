# 📊 FinBoard - Dynamic Financial Dashboard

A customizable, real-time financial dashboard built with **Next.js**, featuring drag-and-drop widgets, API response caching, and interactive data visualization for Indian stock market data.

![Tech Stack](https://img.shields.io/badge/Next.js-14-black) ![React](https://img.shields.io/badge/React-18-blue) ![Zustand](https://img.shields.io/badge/Zustand-4.x-orange) ![Chart.js](https://img.shields.io/badge/Chart.js-4.x-red) ![Tailwind](https://img.shields.io/badge/Tailwind-3.x-cyan)

---

## 🎯 Project Overview

FinBoard is a **widget-based financial dashboard** that allows users to create, customize, and arrange different types of data visualizations (charts, tables, cards) using live stock market APIs. Built with modern React patterns and optimized for performance.

### **Key Features**
✅ **Dynamic Widget Creation** - Add unlimited chart, table, and card widgets  
✅ **API Response Caching** - Prevents redundant API calls, improves performance  
✅ **Drag & Drop** - Reorder widgets with react-dnd  
✅ **State Persistence** - Dashboard state saved to localStorage via Zustand  
✅ **Real-time Testing** - Test API endpoints before creating widgets  
✅ **Field Extraction** - Automatically discovers available fields in API responses (up to 10 levels deep)  
✅ **Paginated Tables** - Shows 7 rows per page with navigation  
✅ **Responsive Charts** - Interactive Chart.js visualizations with gradient styling  

---

## 🚀 Quick Start

### **Prerequisites**
- Node.js 18+ and npm
- API Key from [Indian Stock API](https://stock.indianapi.in)

### **Installation**

```bash
# Clone repository
git clone <your-repo-url>
cd finboard

# Install dependencies
npm install

# Create environment file
cp .env.example .env.local
```

### **Environment Variables**

Create `.env.local` in the root directory:

```env
NEXT_PUBLIC_API_BASE_URL=https://stock.indianapi.in
NEXT_PUBLIC_API_KEY=your_api_key_here
```

### **Run Development Server**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the dashboard.

---

## 📚 API Endpoints Used

### **1. Historical Data (Chart Widget)**
```
GET https://stock.indianapi.in/historical_data?stock_name=TCS&period=1m&filter=price
```
**Use Case**: Time-series price charts  
**Response Format**:
```json
{
  "datasets": [
    {
      "metric": "Price",
      "label": "Price on NSE",
      "values": [
        ["2025-11-07", "2991.80"],
        ["2025-11-10", "3025.20"]
      ]
    }
  ]
}
```

### **2. Stock Details (Card Widget)**
```
GET https://stock.indianapi.in/stock?name=Tata+Steel
```
**Use Case**: Display specific stock metrics  
**Response Format**:
```json
{
  "price": "856.20",
  "high": "856.65",
  "low": "828.15",
  "volume": "10881426",
  "percent_change": "3.39"
}
```

### **3. Trending Stocks (Table Widget)**
```
GET https://stock.indianapi.in/trending
```
**Use Case**: Paginated table of top gainers/losers  
**Response Format**:
```json
{
  "trending_stocks": {
    "top_gainers": [
      {
        "ticker_id": "S0003077",
        "company_name": "Shriram Finance",
        "price": "856.20",
        "percent_change": "3.39"
      }
    ]
  }
}
```

---

## 🏗️ Technical Architecture

### **Tech Stack**
| Technology | Purpose |
|------------|---------|
| **Next.js 14** | React framework with App Router (Server/Client Components) |
| **React 18** | UI library with hooks (useState, useEffect, useRef, useMemo) |
| **Zustand** | Lightweight state management with localStorage persistence |
| **react-dnd** | Drag-and-drop functionality with HTML5 backend |
| **Chart.js** | Interactive charts with react-chartjs-2 wrapper |
| **Tailwind CSS** | Utility-first CSS framework (dark slate theme) |

### **Project Structure**
```
finboard/
├── app/
│   ├── layout.js          # Root layout with Navbar
│   ├── page.js            # Homepage with DashboardLayout
│   └── globals.css        # Global styles
├── components/
│   ├── Navbar.js          # Top navigation with "Add Widget" button
│   ├── AddWidgetModal.js  # Widget creation form with API testing
│   ├── DashboardLayout.js # Main grid that renders all widgets
│   ├── WidgetWrapper.js   # Drag-drop container for each widget
│   └── widgets/
│       ├── FinanceCardWidget.js   # Card display (key-value pairs)
│       ├── StockChartWidget.js    # Chart.js line chart
│       └── StockTableWidget.js    # Paginated data table
├── store/
│   └── dashboardStore.js  # Zustand store with persist middleware
├── lib/
│   └── dataExtractor.js   # Utility functions for API data processing
└── .env.local             # Environment variables (not in Git)
```

---

## 🔑 Core Functionality Breakdown

### **1️⃣ State Management (Zustand)**

**File**: `store/dashboardStore.js`

Zustand provides a simple, Redux-like store without the boilerplate:

```javascript
const useDashboardStore = create(
  persist(
    (set, get) => ({
      widgets: [],  // Array of widget configurations
      
      addWidget: (widget) => set((state) => ({
        widgets: [...state.widgets, { ...widget, id: Date.now() }]
      })),
      
      removeWidget: (id) => set((state) => ({
        widgets: state.widgets.filter(w => w.id !== id)
      })),
      
      moveWidget: (dragId, hoverId) => { /* Reorder logic */ },
      
      updateWidgetConfig: (id, config) => { /* Update logic */ }
    }),
    { name: 'finboard-dashboard-storage' } // localStorage key
  )
);
```

**Why Zustand?**
- ✅ No Provider wrapper needed
- ✅ Automatic persistence to localStorage
- ✅ Selective re-renders (components only update when their slice changes)
- ✅ Simple API with minimal boilerplate

**Persistence**: All widgets are saved to `localStorage` automatically. Refresh the page and your dashboard persists!

---

### **2️⃣ API Response Caching**

**Problem**: Creating a widget would trigger multiple API calls (test + initial fetch = wasted requests)

**Solution**: Cache the test response and pass it to the widget as `initialData`

**Implementation** (`AddWidgetModal.js`):

```javascript
const [cachedApiResponse, setCachedApiResponse] = useState(null);

// When user tests API
const testApiConnection = async () => {
  const response = await fetch(apiUrl, { headers });
  const data = await response.json();
  
  setCachedApiResponse(data);  // Cache the response
  // Extract fields for user selection...
};

// When creating widget
const handleAddWidget = () => {
  addWidget({
    title: widgetName,
    apiUrl: finalUrl,
    fields: selectedFields,
    initialData: cachedApiResponse  // Pass cached data
  });
};
```

**Widget Usage** (`StockChartWidget.js`):

```javascript
useEffect(() => {
  if (hasFetchedOnce.current) return;  // Prevent re-fetching
  
  if (initialData) {
    // Use cached data, no API call needed!
    const processedData = processChartData(initialData, fields, title);
    setChartData(processedData);
    hasFetchedOnce.current = true;
  } else {
    // Fallback: fetch if no cached data
    fetchData();
  }
}, [initialData, apiUrl]);
```

**Benefits**:
- 🚀 **50% fewer API calls** on widget creation
- ⚡ **Instant widget display** (no loading state)
- 💰 **Reduced API costs** and rate limit issues

---

### **3️⃣ Field Extraction (Deep Nested Data)**

**Challenge**: API responses have varying structures with nested objects/arrays

**Solution**: Recursive field extraction up to 10 levels deep

**File**: `lib/dataExtractor.js`

```javascript
export const extractFields = (obj, prefix = '', depth = 0, maxDepth = 10) => {
  if (depth > maxDepth) return [];
  
  const fields = [];
  
  if (Array.isArray(obj)) {
    // Extract fields from first array item
    if (obj[0] && typeof obj[0] === 'object') {
      fields.push(...extractFields(obj[0], prefix, depth + 1, maxDepth));
    }
  } else if (typeof obj === 'object') {
    for (const [key, value] of Object.entries(obj)) {
      const newPrefix = prefix ? `${prefix}.${key}` : key;
      
      if (Array.isArray(value)) {
        fields.push(newPrefix);  // Add array field
        // Also explore array items
        if (value[0] && typeof value[0] === 'object') {
          fields.push(...extractFields(value[0], newPrefix, depth + 1));
        }
      } else if (typeof value === 'object') {
        fields.push(...extractFields(value, newPrefix, depth + 1));
      } else {
        fields.push(newPrefix);  // Primitive field
      }
    }
  }
  
  return fields;
};
```

**Example**:
```javascript
const apiResponse = {
  datasets: [
    { metric: "Price", values: [[...]] }
  ],
  meta: { timestamp: "2025-12-07" }
};

extractFields(apiResponse);
// Returns:
[
  "datasets",
  "datasets.metric",
  "datasets.values",
  "meta",
  "meta.timestamp"
]
```

**Why 10 levels?**
- Prevents infinite loops on circular references
- Handles deeply nested APIs without freezing the browser
- Balances thoroughness with performance

---

### **4️⃣ Drag & Drop (react-dnd)**

**File**: `components/WidgetWrapper.js`

Uses **HTML5 Drag and Drop API** via react-dnd hooks:

```javascript
import { useDrag, useDrop } from 'react-dnd';

export default function WidgetWrapper({ id, children, onMove }) {
  const ref = useRef(null);
  
  const [, drop] = useDrop({
    accept: 'WIDGET',
    hover: (draggedItem) => {
      if (draggedItem.id !== id) {
        onMove(draggedItem.id, id);  // Trigger Zustand action
      }
    }
  });
  
  const [{ isDragging }, drag] = useDrag({
    type: 'WIDGET',
    item: { id },
    collect: (monitor) => ({ isDragging: monitor.isDragging() })
  });
  
  // Attach both drag and drop to same element
  drag(drop(ref));
  
  return (
    <div ref={ref} style={{ opacity: isDragging ? 0.5 : 1 }}>
      {children}
    </div>
  );
}
```

**Flow**:
1. User drags widget A over widget B
2. `useDrop` hook detects hover
3. Calls `onMove(A_id, B_id)`
4. Zustand updates widget order in store
5. Dashboard re-renders with new order
6. localStorage automatically saves new arrangement

**Why react-dnd?**
- Native HTML5 drag events (performant)
- Smooth animations
- Mobile-friendly fallbacks available

---

### **5️⃣ Chart Visualization (Chart.js)**

**File**: `components/widgets/StockChartWidget.js`

**Data Processing**:

```javascript
export const processChartData = (rawData, fields, title) => {
  // 1. Extract target array
  let targetData = getFieldValue(rawData, fields[0]);
  
  // 2. Unwrap nested structures
  if (Array.isArray(targetData) && targetData[0]?.values) {
    targetData = targetData[0].values;  // [[date, price], ...]
  }
  
  // 3. Parse into labels and data points
  const labels = targetData.map(item => item[0]);      // ["2025-11-07", ...]
  const dataPoints = targetData.map(item => parseFloat(item[1])); // [2991.80, ...]
  
  // 4. Limit to last 50 points for performance
  if (labels.length > 50) {
    labels = labels.slice(-50);
    dataPoints = dataPoints.slice(-50);
  }
  
  // 5. Return Chart.js format
  return {
    labels,
    datasets: [{
      label: title,
      data: dataPoints,
      borderColor: '#10b981',        // Emerald green
      backgroundColor: <gradient>,    // Fade to transparent
      tension: 0.4,                   // Smooth curves
      fill: true
    }]
  };
};
```

**Chart Component**:

```javascript
import { Line } from 'react-chartjs-2';

<Line 
  data={chartData} 
  options={{
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { mode: 'index' }
    },
    scales: {
      x: { grid: { display: false } },
      y: { grid: { color: '#334155' } }
    }
  }}
/>
```

**Chart Features**:
- **Gradient fill** (emerald green fading to transparent)
- **Responsive sizing** (fills container)
- **No point dots** (cleaner look at scale)
- **Hover tooltips** with value display
- **Dark theme** matching dashboard aesthetic

---

### **6️⃣ Table Widget with Pagination**

**File**: `components/widgets/StockTableWidget.js`

**Pagination Logic**:

```javascript
const ROWS_PER_PAGE = 7;
const [currentPage, setCurrentPage] = useState(1);

// Calculate slice indices
const totalPages = Math.ceil(data.length / ROWS_PER_PAGE);
const startIndex = (currentPage - 1) * ROWS_PER_PAGE;
const endIndex = startIndex + ROWS_PER_PAGE;
const paginatedData = data.slice(startIndex, endIndex);

// Render only current page
{paginatedData.map((row, idx) => (
  <tr key={idx}>
    {headers.map(header => (
      <td>{row[header]}</td>
    ))}
  </tr>
))}
```

**Navigation**:

```javascript
<button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}>
  ← Prev
</button>
<span>Page {currentPage} of {totalPages}</span>
<button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}>
  Next →
</button>
```

**Dynamic Headers**:

```javascript
// Extract all unique keys from all rows
const allHeaders = useMemo(() => {
  const headerSet = new Set();
  data.forEach(item => {
    Object.keys(item).forEach(key => headerSet.add(key));
  });
  return Array.from(headerSet);
}, [data]);
```

This ensures **all columns** are displayed even if some rows have missing fields.

---

## 🎨 Design Patterns & Best Practices

### **1. Component Separation**
- **Smart Components** (DashboardLayout) - Handle state and logic
- **Dumb Components** (WidgetWrapper) - Pure presentation
- **Utility Functions** (dataExtractor.js) - Reusable business logic

### **2. Performance Optimizations**
- `useMemo` for expensive calculations (headers, API keys)
- `useRef` to prevent re-renders (hasFetchedOnce, abortController)
- `AbortController` to cancel in-flight requests on unmount
- Limit chart data to 50 points
- Paginate tables (7 rows/page)

### **3. Error Handling**
- Try-catch blocks around all API calls
- AbortError filtering (ignore cancelled requests)
- User-friendly error messages with retry buttons
- Rate limit detection (429 status code)

### **4. Code Reusability**
All data processing centralized in `lib/dataExtractor.js`:
- `getFieldValue()` - Used by all widgets
- `extractFields()` - Used by modal
- `processChartData()` - Used by chart widget
- `processTableData()` - Used by table widget
- `processCardData()` - Used by card widget

### **5. Type Safety (Runtime)**
```javascript
if (!obj || !path) return undefined;  // Guard clauses
if (!Array.isArray(targetData)) throw new Error(...);  // Type checks
```

---

## 🔐 Security & Environment Variables

All API keys are stored in `.env.local` (gitignored):

```env
NEXT_PUBLIC_API_BASE_URL=https://stock.indianapi.in
NEXT_PUBLIC_API_KEY=your_secret_key
```

**Why `NEXT_PUBLIC_` prefix?**
- Next.js only exposes env vars with this prefix to the browser
- Server-side vars remain secure
- Prevents accidental exposure of secrets

**Usage in Code**:
```javascript
const API_KEY = process.env.NEXT_PUBLIC_API_KEY || '';
```

---

## 🧪 Testing Workflow

### **Manual Testing Steps**
1. Click "Add Widget" button in navbar
2. Enter API URL: `/trending`
3. Click "Test API Connection"
4. Verify fields are extracted correctly
5. Select field (e.g., `trending_stocks.top_gainers`)
6. Choose display mode (table)
7. Click "Create Widget"
8. Verify widget appears with cached data
9. Test drag-and-drop reordering
10. Refresh page → verify persistence

### **Potential Test Cases**
- ✅ Widget creation with cached data
- ✅ Widget deletion
- ✅ Drag-drop reordering
- ✅ Pagination navigation
- ✅ API error handling
- ✅ LocalStorage persistence
- ✅ Empty state handling
- ✅ Chart gradient rendering
- ✅ Responsive layout


---

##  Future Enhancements

- [ ] **Widget Editing** - Modify existing widgets without deleting
- [ ] **Custom Refresh Intervals** - Per-widget auto-refresh settings
- [ ] **Export Dashboard** - Save/load configurations as JSON
- [ ] **Theme Customization** - Light mode, color schemes
- [ ] **Advanced Filters** - Search/filter table data
- [ ] **Multiple Dashboards** - Switch between different layouts
- [ ] **Real-time WebSocket Support** - Live price updates
- [ ] **Chart Type Options** - Bar, pie, candlestick charts
- [ ] **Responsive Grid** - Auto-adjust layout on mobile
- [ ] **Widget Resize** - Variable widget sizes

---



##  Acknowledgments

- **Indian Stock API** - Real-time stock data provider
- **Chart.js** - Beautiful chart visualizations
- **Zustand** - Simplified state management
- **react-dnd** - Drag-and-drop functionality
- **Tailwind CSS** - Rapid UI development

