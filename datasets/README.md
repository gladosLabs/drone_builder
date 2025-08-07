# DroneBuilder Datasets

This folder contains web scrapers and datasets for collecting drone component information from various sources.

## 📁 Contents

- `getfpv-motor-scraper.js` - Scraper for GetFPV.com motors
- `config.js` - Configuration settings for scrapers
- `README.md` - This documentation file

## 🚀 GetFPV Motor Scraper

A comprehensive web scraper for collecting motor specifications from GetFPV.com.

### Features

- **Comprehensive Data Collection**: Extracts motor specifications including KV rating, weight, dimensions, power ratings, and more
- **Multiple Output Formats**: Saves data as CSV, JSON, and generates detailed reports
- **Respectful Scraping**: Includes delays and user agent spoofing to avoid overwhelming servers
- **Error Handling**: Robust error handling with detailed logging
- **Pagination Support**: Automatically handles multi-page product listings
- **Category Filtering**: Can scrape specific motor categories or all motors

### Data Fields Collected

| Field | Description | Example |
|-------|-------------|---------|
| `name` | Product name | "T-Motor U11-II KV120" |
| `brand` | Manufacturer | "T-Motor" |
| `kv` | KV rating | "120" |
| `weight` | Motor weight in grams | "320" |
| `shaft_diameter` | Shaft diameter in mm | "8" |
| `mounting_holes` | Mounting hole pattern | "M4 x 25mm" |
| `max_current` | Maximum current in amps | "45" |
| `max_power` | Maximum power in watts | "2000" |
| `thrust` | Maximum thrust in grams | "3500" |
| `price` | Price in USD | "89.99" |
| `availability` | Stock status | "In Stock" |
| `url` | Product page URL | "https://www.getfpv.com/..." |
| `image_url` | Product image URL | "https://www.getfpv.com/..." |
| `description` | Product description | "High-performance motor..." |
| `specifications` | Full specifications JSON | `{"KV": "120", "Weight": "320g"}` |

### Usage

#### Basic Usage

```bash
# Run the scraper
node getfpv-motor-scraper.js
```

#### Programmatic Usage

```javascript
const { GetFPVMotorScraper } = require('./getfpv-motor-scraper');

async function runScraper() {
    const scraper = new GetFPVMotorScraper();
    
    try {
        await scraper.initialize();
        
        // Scrape all motors
        await scraper.scrapeMotorListings();
        
        // Or scrape specific categories
        await scraper.scrapeByCategory('https://www.getfpv.com/motors/brushless-motors/2204-2206.html');
        
        // Save data
        await scraper.saveToCSV();
        
        // Generate report
        const report = await scraper.generateReport();
        console.log(report);
        
    } finally {
        await scraper.close();
    }
}

runScraper();
```

#### Configuration

Edit `config.js` to customize:

- Scraper behavior (delays, timeouts, headless mode)
- Target URLs and categories
- Output file names
- CSS selectors for data extraction

### Output Files

The scraper generates several output files:

1. **`getfpv-motors.csv`** - Main dataset in CSV format
2. **`getfpv-motors.json`** - Backup data in JSON format
3. **`scraping-report.json`** - Summary statistics and metadata

### Motor Categories Available

The scraper can target specific motor categories:

- **Brushless Motors**: General brushless motor category
- **Brushed Motors**: Brushed motor category
- **Micro Motors**: Small format motors
- **Size Categories**: 
  - 2204-2206 (5" props)
  - 2207-2208 (5-6" props)
  - 2306-2308 (5-6" props)
  - 2407-2408 (6" props)
  - 2506-2508 (6-7" props)
  - 2806-2808 (7" props)
  - 3008-3010 (7-8" props)
  - 3508-3510 (8-10" props)
  - 4008-4010 (10-12" props)
  - 5008-5010 (12-15" props)

### Ethical Considerations

- **Rate Limiting**: Built-in delays between requests (2-5 seconds)
- **User Agent**: Uses realistic browser user agent
- **Resource Filtering**: Blocks unnecessary resources (images, CSS) for faster scraping
- **Respectful**: Only scrapes publicly available product information

### Troubleshooting

#### Common Issues

1. **Timeout Errors**: Increase timeout in config.js
2. **Selector Not Found**: Website structure may have changed - update selectors in config.js
3. **Rate Limiting**: Increase delays in config.js
4. **Browser Issues**: Try running in headless mode

#### Debug Mode

Set `headless: false` in config.js to see the browser in action and debug issues.

### Data Analysis

The collected data can be used for:

- **Price Analysis**: Track motor pricing trends
- **Performance Comparison**: Compare motor specifications
- **Inventory Management**: Monitor stock levels
- **Market Research**: Analyze product availability and trends
- **Drone Design**: Find motors matching specific requirements

### Future Enhancements

- [ ] Add support for other component types (ESCs, props, frames)
- [ ] Implement database storage
- [ ] Add price tracking over time
- [ ] Create data visualization tools
- [ ] Add support for other drone component retailers

## 📊 Data Quality

The scraper includes validation and cleaning:

- **Duplicate Detection**: Prevents duplicate entries
- **Data Validation**: Ensures required fields are present
- **Format Standardization**: Normalizes units and formats
- **Error Logging**: Detailed error reporting for debugging

## 🔧 Dependencies

- `puppeteer` - Browser automation
- `cheerio` - HTML parsing
- `axios` - HTTP requests
- `csv-writer` - CSV file generation

Install with:
```bash
npm install puppeteer cheerio axios csv-writer
``` 