# E-Commerce Product Scraper

A Python-based web scraper that extracts product information from [books.toscrape.com](http://books.toscrape.com) and stores it in a structured CSV format.

## Features

- **Data Extraction**: Scrapes product name, price, star rating, availability, and URL
- **Multi-page Scraping**: Automatically navigates through all pagination pages
- **Error Handling**: Gracefully handles connection errors, timeouts, and invalid responses
- **Data Cleaning**: Parses and normalizes price and rating values
- **CSV Export**: Saves data with proper headers for easy analysis
- **Ethical Scraping**: Implements rate limiting and respectful User-Agent headers
- **Preview Output**: Displays a formatted preview and summary after extraction

## Requirements

- Python 3.10+
- `requests`
- `beautifulsoup4`
- `lxml`

## Installation

```bash
pip install -r requirements.txt
```

## Usage

Run the scraper from the project directory:

```bash
python scraper.py
```

The script will:
1. Fetch all product pages from the target website
2. Extract product details from each page
3. Save the results to `products.csv`
4. Display a preview and summary of the extracted data

## Output

The generated `products.csv` contains the following columns:

| Column       | Description                          |
|--------------|--------------------------------------|
| Name         | Product (book) title                 |
| Price        | Price in GBP (e.g., `£51.77`)        |
| Rating       | Star rating (e.g., `5 / 5`)          |
| Availability | Stock status                         |
| URL          | Direct link to the product page      |

## Ethical Considerations

- The target site (`books.toscrape.com`) is a demo website explicitly designed for scraping practice
- The scraper respects rate limits (1-second delay between pages)
- A descriptive User-Agent identifies the scraper and its purpose
- Always check `robots.txt` before scraping any website

## License

This project is for educational purposes.

