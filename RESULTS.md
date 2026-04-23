# E-Commerce Product Scraper — Results

## Execution Summary

**Date:** Automated execution
**Target Website:** http://books.toscrape.com
**Total Products Scraped:** 1,000
**Total Pages:** 50

## Scraper Output Log

```
============================================================
E-Commerce Product Scraper
============================================================
Target: http://books.toscrape.com
Output: products.csv
============================================================

[INFO] Fetching page 1: http://books.toscrape.com/catalogue/page-1.html
[INFO] Found 20 products on page 1.
...
[INFO] Fetching page 50: http://books.toscrape.com/catalogue/page-50.html
[INFO] Found 20 products on page 50.
[INFO] No more pages to scrape.

[INFO] Scraping complete. Total products extracted: 1000

[SUCCESS] Product data successfully saved to 'products.csv'.
          Total records: 1000

============================================================
EXTRACTION SUMMARY
============================================================
Total products:    1000
Average price:     £35.07
Price range:       £10.00 - £59.99
Average rating:    2.92 / 5
============================================================
```

## CSV Data Structure

| Column | Description | Example |
|--------|-------------|---------|
| Name | Product (book) title | A Light in the Attic |
| Price | Price in GBP | £51.77 |
| Rating | Star rating | 3 / 5 |
| Availability | Stock status | In stock |
| URL | Direct product link | http://books.toscrape.com/... |
| Image | Thumbnail image URL | http://books.toscrape.com/media/cache/... |

## Website Features

The included `website/` folder contains a full interactive product catalog:

- **Statistics Dashboard:** Animated counters for total products, average price, average rating, and in-stock count
- **Search:** Real-time product name search with debouncing
- **Sorting:** Price (low/high), Rating (high/low), Name (A-Z)
- **Filtering:** Availability (In Stock / Out of Stock), Minimum Rating (1-5 stars)
- **Product Cards:** Responsive grid with real book cover images, prices, star ratings, availability badges
- **Pagination:** 24 items per page with intuitive navigation
- **Responsive Design:** Optimized for desktop, tablet, and mobile

## How to Run

### 1. Run the Scraper
```bash
cd ecommerce_scraper
python scraper.py
```

### 2. Launch the Website
```bash
cd ecommerce_scraper/website
python -m http.server 8080
```

Then open **http://localhost:8080** in your browser.

## Files Overview

```
ecommerce_scraper/
├── scraper.py              # Python scraper (requests + BeautifulSoup)
├── products.csv            # Scraped data (1,000 products)
├── requirements.txt        # Python dependencies
├── README.md               # Project documentation
├── scraper_output.txt      # Execution log
└── website/
    ├── index.html          # Product catalog webpage
    ├── style.css           # Responsive styling
    ├── app.js              # Interactive features
    └── products.csv        # Copy of data for web server
```

## Technical Implementation

### Data Extraction
- **requests:** HTTP session with descriptive User-Agent header
- **BeautifulSoup + lxml:** HTML parsing with CSS selectors
- **Pagination:** Automatic navigation through all 50 catalog pages
- **Rate Limiting:** 1-second delay between page requests
- **Error Handling:** Timeouts, connection errors, HTTP errors, and parsing exceptions

### Data Processing
- Price cleaning: extracts numeric value from currency string
- Rating parsing: maps CSS classes (One, Two, Three, Four, Five) to integers
- Missing data: gracefully falls back to "N/A"

### Data Storage
- CSV format with UTF-8 encoding
- Proper quoted fields for titles containing commas
- Column headers: Name, Price, Rating, Availability, URL, Image

## Ethical Scraping Practices

- Target site (`books.toscrape.com`) is explicitly designed for web scraping practice
- Descriptive User-Agent identifies scraper and educational purpose
- Rate limiting respects server resources
- 30-second request timeout prevents hanging connections

