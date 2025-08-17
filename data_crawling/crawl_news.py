#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Crawl JupViec "Tin mới cập nhật" news links with Selenium, fetch details by requests+BeautifulSoup,
then export to CSV (and optionally generate SQL INSERT statements).

Usage examples (PowerShell):
    python .\data_crawling\crawl_news.py --out .\data_crawling\output\news_latest.csv
    python .\data_crawling\crawl_news.py --out .\data_crawling\output\news_latest.csv --headless
    python .\data_crawling\crawl_news.py --out .\data_crawling\output\news_latest.csv --gen-sql .\data_crawling\output\jupviec_news_insert.sql

Dependencies: pandas, requests, beautifulsoup4, selenium
"""

import argparse
import csv
import os
import sys
import time
from typing import List, Dict, Optional
import shutil

import pandas as pd
import requests
from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

DEFAULT_BASE_URL = "https://jupviec.vn/tin-moi-cap-nhat"


def setup_driver(chromedriver_path: Optional[str] = None, headless: bool = False):
    options = webdriver.ChromeOptions()

    # Headless and common flags for containerized Chrome
    if headless:
        # use the newer headless mode when available
        try:
            options.add_argument("--headless=new")
        except Exception:
            options.add_argument("--headless")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--disable-gpu")
    options.add_argument("--disable-blink-features=AutomationControlled")
    options.add_experimental_option("excludeSwitches", ["enable-automation"])
    options.add_experimental_option('useAutomationExtension', False)
    options.add_argument("--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0 Safari/537.36")

    # Try to detect chrome binary and chromedriver
    chrome_bin = os.environ.get('CHROME_BIN') or shutil.which('google-chrome') or shutil.which('chromium') or shutil.which('chromium-browser')
    chromedriver_bin = chromedriver_path or os.environ.get('CHROMEDRIVER_BIN') or shutil.which('chromedriver')

    if chrome_bin:
        options.binary_location = chrome_bin

    # Build service
    try:
        service = Service(chromedriver_bin) if chromedriver_bin else Service()
    except TypeError:
        # selenium's Service may raise on bad path types
        raise RuntimeError(f"Invalid chromedriver path: {chromedriver_bin}")

    try:
        driver = webdriver.Chrome(service=service, options=options)
    except Exception as e:
        # surface helpful debug info
        msg = f"Failed to start Chrome WebDriver. chrome_bin={chrome_bin} chromedriver_bin={chromedriver_bin} error={e}"
        raise RuntimeError(msg)

    # Hide webdriver flag
    try:
        driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
    except Exception:
        pass

    return driver


def get_news_links_from_page(driver) -> List[str]:
    links: List[str] = []
    try:
        time.sleep(3)
        parent_container = driver.find_element(By.XPATH, "/html/body/div[1]/div/div/div/div/div")
        news_boxes = parent_container.find_elements(By.XPATH, "./div")
        for box in news_boxes:
            try:
                a_tag = box.find_element(By.TAG_NAME, "a")
                href = a_tag.get_attribute("href")
                if href and "/tin-moi-cap-nhat/" in href:
                    links.append(href)
            except Exception:
                continue
        # De-duplicate
        links = list(dict.fromkeys(links))
    except Exception as e:
        print(f"[WARN] get_news_links_from_page error: {e}")
    return links


def click_next_page(driver) -> bool:
    try:
        next_button = driver.find_element(
            By.CSS_SELECTOR,
            "#__layout > div > div > div > div > div.flex.items-center.justify-center > div:nth-child(8) > svg"
        )
        driver.execute_script("arguments[0].scrollIntoView();", next_button)
        time.sleep(1)
        next_button.click()
        time.sleep(3)
        return True
    except Exception as e:
        print(f"[INFO] Cannot click next page: {e}")
        return False


def scrape_news_detail_bs4(url: str) -> Optional[Dict[str, Optional[str]]]:
    try:
        resp = requests.get(url, timeout=10)
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, 'html.parser')

        title = soup.title.text.strip() if soup.title else ''

        content_div = soup.find('div', attrs={"__typename": "ComponentPostContent"})
        content = ''
        if content_div:
            content = content_div.get_text("\n", strip=True)
        else:
            # Fallback: try main tag or article
            main = soup.find('main') or soup.find('article')
            if main:
                content = main.get_text("\n", strip=True)

        image_url = None
        if content_div:
            img = content_div.find('img')
            if img and img.has_attr('src'):
                image_url = img['src']

        return {
            'news_id': url,
            'title': title,
            'content': content,
            'image_url': image_url,
        }
    except Exception as e:
        print(f"[ERROR] scrape_news_detail_bs4 {url}: {e}")
        return None


def scrape_all_news(base_url: str, chromedriver_path: Optional[str], headless: bool, max_items: int = 10, max_pages: int = 10) -> List[Dict[str, Optional[str]]]:
    driver = setup_driver(chromedriver_path, headless=headless)
    all_links: List[str] = []
    all_news: List[Dict[str, Optional[str]]] = []
    try:
        driver.get(base_url)
        time.sleep(5)
        current_page = 1
        while current_page <= max_pages:
            page_links = get_news_links_from_page(driver)
            all_links.extend(page_links)
            # Stop early if we already collected enough links
            if len(all_links) >= max_items:
                break
            if click_next_page(driver):
                current_page += 1
                time.sleep(1)
            else:
                break
        driver.quit()

        # Unique links and cap to max_items
        all_links = list(dict.fromkeys(all_links))[:max_items]
        print(f"[INFO] Total unique links to fetch (max {max_items}): {len(all_links)}")

        for i, link in enumerate(all_links, 1):
            print(f"[INFO] Fetching {i}/{len(all_links)}: {link}")
            item = scrape_news_detail_bs4(link)
            if item:
                all_news.append(item)
            time.sleep(0.5)
        return all_news
    except Exception as e:
        print(f"[ERROR] scrape_all_news: {e}")
        try:
            driver.quit()
        except Exception:
            pass
        return all_news


def to_sql_inserts(df: pd.DataFrame, table_name: str = "news") -> List[str]:
    stmts: List[str] = []
    create_table = f"""
CREATE TABLE IF NOT EXISTS {table_name} (
    news_id      INT AUTO_INCREMENT PRIMARY KEY,
    title        VARCHAR(255) NOT NULL,
    content      TEXT NOT NULL,
    image_url    VARCHAR(255) DEFAULT NULL,
    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
    source       VARCHAR(255) DEFAULT NULL
);
"""
    stmts.append(create_table)

    for _, row in df.iterrows():
        title = (row['title'] or '').replace("'", "\\'")
        content = (row['content'] or '').replace("'", "\\'")
        image_url = row['image_url'] if pd.notna(row['image_url']) and row['image_url'] else None
        if image_url is None:
            image_val = 'NULL'
        else:
            image_val = "'" + str(image_url).replace("'", "\\'") + "'"
        insert = f"""
INSERT INTO {table_name} (title, content, image_url, source) VALUES (
    '{title}',
    '{content}',
    {image_val},
    'Nguồn: JupViec'
);
"""
        stmts.append(insert)
    return stmts


def main():
    parser = argparse.ArgumentParser(description="Crawl JupViec news and output CSV/SQL")
    parser.add_argument('--base-url', default=DEFAULT_BASE_URL, help='Base list URL')
    parser.add_argument('--out', required=True, help='Output CSV file path')
    parser.add_argument('--gen-sql', default=None, help='Optional SQL output file path')
    parser.add_argument('--chromedriver', default=None, help='Path to chromedriver.exe')
    parser.add_argument('--headless', action='store_true', help='Run Chrome in headless mode')
    parser.add_argument('--max-items', type=int, default=10, help='Max number of articles to fetch (default 10)')
    parser.add_argument('--max-pages', type=int, default=10, help='Max pages to paginate (default 10)')

    args = parser.parse_args()

    os.makedirs(os.path.dirname(os.path.abspath(args.out)), exist_ok=True)

    items = scrape_all_news(
        base_url=args.base_url,
        chromedriver_path=args.chromedriver,
    headless=args.headless,
    max_items=args.max_items,
    max_pages=args.max_pages,
    )

    df = pd.DataFrame(items, columns=['news_id', 'title', 'content', 'image_url'])
    # Basic cleaning like in notebook
    if not df.empty:
        df.dropna(subset=['title', 'content'], inplace=True)

    df.to_csv(args.out, index=False, encoding='utf-8')
    print(f"[DONE] CSV saved: {args.out} with {len(df)} rows")

    if args.gen_sql:
        stmts = to_sql_inserts(df, table_name='news')
        with open(args.gen_sql, 'w', encoding='utf-8') as f:
            for s in stmts:
                f.write(s + '\n')
        print(f"[DONE] SQL saved: {args.gen_sql} with {len(stmts)} statements")


if __name__ == '__main__':
    main()
