# Historical Timeline Project

A modern, interactive, and extensible web-based horizontal timeline application. This project visualizes events and periods with advanced features like zooming, filtering, and dynamic styling.

## Features

-   **Horizontal Layout:** Visualize history linearly with a clean, scrollable interface.
-   **Multiple Timelines:** Switch between different timelines (Mathematics, Computer Science, etc.) via dropdown or URL parameters.
-   **Dual Data Types:**
    -   **Events:** Specific points in time (e.g., "Born", "Publication").
    -   **Periods:** Durations with start and end dates (e.g., "Lifespan", "War").
-   **Smart Stacking:** Automatic vertical stacking prevents overlaps and ensures readability.
-   **Dynamic Zoom:**
    -   Smoothly zoom in to see days or zoom out to see centuries.
    -   Adaptive axis labels switch between Days, Months, Years, and Decades based on zoom level.
-   **Tag-Based Filtering:** Toggle visibility of items based on categories (e.g., "Science", "Biography").
-   **Auto-Coloring:** Items are automatically colored based on their tags for quick visual distinction.
-   **Details Modal:** Click any item to view complete metadata.

## Project Structure

```
/
├── index.html          # Main entry point
├── README.md           # Project documentation
├── data/
│   ├── mathematics.json  # Mathematics timeline data
│   ├── demo.json         # Computer Science timeline data
│   └── index.json        # (Legacy) Index of data files
└── src/
    ├── style.css       # Core styling
    ├── script.js       # Main application logic
    └── timeline.js     # Timeline class and rendering engine
```

## Setup & Usage

1.  **Clone or Download** this repository.
2.  **Run a Local Server:**
    Because this project uses ES6 modules (`import/export`) and `fetch` for data, it requires a local web server to avoid Cross-Origin Resource Sharing (CORS) errors.

    **Quick Start (Recommended):**
    ```bash
    ./serve.sh
    ```
    or
    ```bash
    npm run serve
    ```

    **Alternative Methods:**
    *   **Python 3:** `python3 -m http.server 8000`
    *   **Node.js (http-server):** `npx http-server -p 8000`
    *   **VS Code:** Use the "Live Server" extension.

3.  **Open in Browser:** Navigate to `http://localhost:8000` (or whatever port your server uses).

## Customization

### Switching Timelines

You can switch between timelines in two ways:

1. **Using the Dropdown:** Select a timeline from the dropdown menu in the controls area.
2. **Using URL Parameters:** Access a specific timeline directly:
   - Mathematics (default): `http://localhost:8000/` or `http://localhost:8000/?timeline=mathematics`
   - Computer Science: `http://localhost:8000/?timeline=demo`

### Adding a New Timeline

1. Create a new JSON file in the `data/` directory (e.g., `data/physics.json`)
2. Add your events and periods following the format below
3. Update the dropdown in `index.html` to include the new timeline option:
   ```html
   <option value="physics">Physics</option>
   ```

### Data Format

Edit JSON files in `data/` to add your own events.
Format:
```json
{
  "id": 1,
  "type": "event", // or "period"
  "title": "My Event",
  "start": "2023-01-01",
  "end": "2023-01-05", // Optional, for periods
  "tags": ["category1"],
  "position": "above" // or "below"
}
```

### Changing Colors
Modify the `this.colors` array in `src/timeline.js` to update the palette used for tags.
