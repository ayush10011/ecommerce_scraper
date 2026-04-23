"""
E-Commerce Product Scraper
===========================
Scrapes product information from books.toscrape.com and stores it in a CSV file.

Target Website: http://books.toscrape.com
- Demo e-commerce site designed for web scraping practice
- Contains books with names, prices, ratings, and availability info

Ethical Scraping Practices:
- Respects robots.txt (the site allows scraping)
- Uses descriptive User-Agent header
- Implements rate limiting (1 second delay between pages)
- Handles errors gracefully
"""

import csv
import sys
import time
import traceback
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup


# =============================================================================
# CONFIGURATION
# =============================================================================

BASE_URL = "http://books.toscrape.com"
CATALOGUE_URL = urljoin(BASE_URL, "catalogue/")
OUTPUT_FILE = "products.csv"
MAX_PAGES = 50  # Safety limit to prevent infinite loops
RATE_LIMIT_SECONDS = 1  # Delay between page requests
TIMEOUT_SECONDS = 30

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36 "
        "ECommerceScraper/1.0 (Educational Purpose)"
    ),
    "Accept": (
        "text/html,application/xhtml+xml,application/xml;"
        "q=0.9,image/webp,*/*;q=0.8"
    ),
    "Accept-Language": "en-US,en;q=0.5",
    "Accept-Encoding": "gzip, deflate",
    "Connection": "keep-alive",
}

# Map star-rating CSS classes to numeric values
RATING_MAP = {
    "One": 1,
    "Two": 2,
    "Three": 3,
    "Four": 4,
    "Five": 5,
}


# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

def fetch_page(session: requests.Session, url: str) -> BeautifulSoup | None:
    """
    Fetch a web page and return a BeautifulSoup object.

    Args:
        session: requests Session object.
        url: URL to fetch.

    Returns:
        BeautifulSoup object or None if the request fails.
    """
    try:
        response = session.get(url, headers=HEADERS, timeout=TIMEOUT_SECONDS)
        response.raise_for_status()
        return BeautifulSoup(response.content, "lxml")
    except requests.exceptions.Timeout:
        print(f"[ERROR] Request timed out for {url}")
    except requests.exceptions.ConnectionError:
        print(f"[ERROR] Connection error for {url}")
    except requests.exceptions.HTTPError as e:
        print(f"[ERROR] HTTP error for {url}: {e}")
    except requests.exceptions.RequestException as e:
        print(f"[ERROR] Failed to fetch {url}: {e}")
    return None


def parse_rating(rating_tag) -> int | None:
    """
    Extract numeric rating from a star-rating tag.

    Args:
        rating_tag: BeautifulSoup tag with star-rating classes.

    Returns:
        Integer rating (1-5) or None if not found.
    """
    if not rating_tag:
        return None

    classes = rating_tag.get("class", [])
    for cls in classes:
        if cls in RATING_MAP:
            return RATING_MAP[cls]
    return None


def parse_price(price_text: str) -> str:
    """
    Clean and validate price text.

    Args:
        price_text: Raw price string (e.g., "Â£51.77").

    Returns:
        Cleaned price string or "N/A" if invalid.
    """
    if not price_text:
        return "N/A"

    # Remove currency symbol and whitespace
    cleaned = price_text.replace("Â", "").replace("£", "").strip()
    try:
        float(cleaned)
        return f"£{cleaned}"
    except ValueError:
        return "N/A"


def parse_product(product_article) -> dict | None:
    """
    Extract product data from a single product article tag.

    Args:
        product_article: BeautifulSoup <article class="product_pod"> tag.

    Returns:
        Dictionary with product data or None if parsing fails.
    """
    try:
        # Product Name
        title_tag = product_article.select_one("h3 a")
        name = title_tag.get("title", "").strip() if title_tag else "N/A"
        if name == "N/A":
            # Fallback to text content
            name = title_tag.get_text(strip=True) if title_tag else "N/A"

        # Price
        price_tag = product_article.select_one("p.price_color")
        price = parse_price(price_tag.get_text(strip=True)) if price_tag else "N/A"

        # Rating
        rating_tag = product_article.select_one("p.star-rating")
        rating = parse_rating(rating_tag)
        rating_str = f"{rating} / 5" if rating is not None else "N/A"

        # Availability
        availability_tag = product_article.select_one("p.instock.availability")
        availability = (
            availability_tag.get_text(strip=True)
            if availability_tag
            else "N/A"
        )

        # Product URL
        relative_url = title_tag.get("href", "") if title_tag else ""
        product_url = urljoin(BASE_URL, relative_url)

        # Thumbnail Image URL
        img_tag = product_article.select_one("div.image_container img")
        img_relative = img_tag.get("src", "") if img_tag else ""
        image_url = urljoin(BASE_URL, img_relative) if img_relative else ""

        return {
            "Name": name,
            "Price": price,
            "Rating": rating_str,
            "Availability": availability,
            "URL": product_url,
            "Image": image_url,
        }

    except Exception as e:
        print(f"[WARNING] Failed to parse a product: {e}")
        return None


def get_next_page(soup: BeautifulSoup) -> str | None:
    """
    Find the URL of the next page from pagination controls.

    Args:
        soup: BeautifulSoup object of the current page.

    Returns:
        Absolute URL of the next page or None if there isn't one.
    """
    next_button = soup.select_one("li.next a")
    if next_button:
        relative_url = next_button.get("href", "")
        return urljoin(CATALOGUE_URL, relative_url)
    return None


# =============================================================================
# CORE SCRAPING LOGIC
# =============================================================================

def scrape_products() -> list[dict]:
    """
    Scrape all product pages and return a list of product dictionaries.

    Returns:
        List of product data dictionaries.
    """
    products = []
    current_url = CATALOGUE_URL + "page-1.html"
    page_count = 0

    print("=" * 60)
    print("E-Commerce Product Scraper")
    print("=" * 60)
    print(f"Target: {BASE_URL}")
    print(f"Output: {OUTPUT_FILE}")
    print("=" * 60)
    print()

    with requests.Session() as session:
        while current_url and page_count < MAX_PAGES:
            page_count += 1
            print(f"[INFO] Fetching page {page_count}: {current_url}")

            soup = fetch_page(session, current_url)
            if soup is None:
                print(f"[WARNING] Skipping page {page_count} due to fetch error.")
                break

            # Extract products from current page
            product_articles = soup.select("article.product_pod")
            print(f"[INFO] Found {len(product_articles)} products on page {page_count}.")

            for article in product_articles:
                product = parse_product(article)
                if product:
                    products.append(product)

            # Find next page
            next_page_url = get_next_page(soup)
            if next_page_url:
                # Rate limiting
                time.sleep(RATE_LIMIT_SECONDS)
                current_url = next_page_url
            else:
                print("[INFO] No more pages to scrape.")
                break

    print()
    print(f"[INFO] Scraping complete. Total products extracted: {len(products)}")
    return products


# =============================================================================
# DATA STORAGE
# =============================================================================

def save_to_csv(products: list[dict], filename: str) -> bool:
    """
    Save product data to a CSV file.

    Args:
        products: List of product dictionaries.
        filename: Output CSV filename.

    Returns:
        True if successful, False otherwise.
    """
    if not products:
        print("[ERROR] No products to save.")
        return False

    fieldnames = ["Name", "Price", "Rating", "Availability", "URL", "Image"]

    try:
        with open(filename, mode="w", newline="", encoding="utf-8") as csvfile:
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(products)
        return True
    except PermissionError:
        print(f"[ERROR] Permission denied: cannot write to '{filename}'.")
    except OSError as e:
        print(f"[ERROR] OS error while writing CSV: {e}")
    except Exception as e:
        print(f"[ERROR] Unexpected error while writing CSV: {e}")
        traceback.print_exc()

    return False


# =============================================================================
# OUTPUT & PREVIEW
# =============================================================================

def print_preview(products: list[dict], limit: int = 10) -> None:
    """
    Print a formatted preview of the extracted data.

    Args:
        products: List of product dictionaries.
        limit: Maximum number of rows to display.
    """
    if not products:
        print("No products available to preview.")
        return

    preview_count = min(limit, len(products))
    print("-" * 80)
    print(f"PREVIEW (first {preview_count} of {len(products)} products)")
    print("-" * 80)

    # Determine column widths
    name_width = min(40, max(len(p["Name"]) for p in products[:limit]))
    name_width = max(name_width, 10)

    # Header
    print(f"{'Name':<{name_width}} | {'Price':<10} | {'Rating':<10} | {'Availability'}")
    print("-" * (name_width + 40))

    # Rows
    for product in products[:limit]:
        name = product["Name"][:name_width]
        print(
            f"{name:<{name_width}} | "
            f"{product['Price']:<10} | "
            f"{product['Rating']:<10} | "
            f"{product['Availability']}"
        )

    print("-" * 80)


def print_summary(products: list[dict]) -> None:
    """Print a summary of the scraped data."""
    if not products:
        return

    # Calculate statistics
    valid_prices = []
    valid_ratings = []

    for p in products:
        price_str = p["Price"].replace("£", "").strip()
        try:
            valid_prices.append(float(price_str))
        except ValueError:
            pass

        rating_str = p["Rating"].replace("/ 5", "").strip()
        try:
            valid_ratings.append(float(rating_str))
        except ValueError:
            pass

    print()
    print("=" * 60)
    print("EXTRACTION SUMMARY")
    print("=" * 60)
    print(f"Total products:    {len(products)}")

    if valid_prices:
        avg_price = sum(valid_prices) / len(valid_prices)
        print(f"Average price:     £{avg_price:.2f}")
        print(f"Price range:       £{min(valid_prices):.2f} - £{max(valid_prices):.2f}")

    if valid_ratings:
        avg_rating = sum(valid_ratings) / len(valid_ratings)
        print(f"Average rating:    {avg_rating:.2f} / 5")

    print("=" * 60)


# =============================================================================
# MAIN ENTRY POINT
# =============================================================================

def main() -> int:
    """
    Main entry point for the scraper.

    Returns:
        Exit code (0 for success, 1 for failure).
    """
    try:
        # Scrape products
        products = scrape_products()

        if not products:
            print("[ERROR] No products were extracted. Exiting.")
            return 1

        # Save to CSV
        success = save_to_csv(products, OUTPUT_FILE)
        if not success:
            return 1

        # Confirmation message
        print()
        print(f"[SUCCESS] Product data successfully saved to '{OUTPUT_FILE}'.")
        print(f"          Total records: {len(products)}")

        # Preview
        print_preview(products, limit=10)
        print_summary(products)

        return 0

    except KeyboardInterrupt:
        print("\n[INFO] Scraping interrupted by user.")
        return 130
    except Exception as e:
        print(f"[CRITICAL] An unexpected error occurred: {e}")
        traceback.print_exc()
        return 1


if __name__ == "__main__":
    sys.exit(main())

