#!/usr/bin/env python3
"""Test the locale detection on both English and Chinese test pages."""

from playwright.sync_api import sync_playwright
import sys

def test_locale_page(url, expected_locale):
    """Navigate to a locale test page and extract the locale information."""
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        print(f"\n{'='*60}")
        print(f"Testing URL: {url}")
        print(f"Expected locale: {expected_locale}")
        print(f"{'='*60}\n")

        try:
            # Navigate and wait for page to load
            page.goto(url, wait_until='networkidle', timeout=30000)

            # Take a screenshot
            screenshot_path = f"/tmp/locale_test_{expected_locale}.png"
            page.screenshot(path=screenshot_path, full_page=True)
            print(f"Screenshot saved to: {screenshot_path}\n")

            # Extract the locale information from the page
            page_content = page.content()

            # Try to find the locale value
            try:
                locale_element = page.locator('text=/Current Locale:.*/')
                if locale_element.count() > 0:
                    locale_text = locale_element.first.text_content()
                    print(f"Found: {locale_text}")
                else:
                    print("Could not find 'Current Locale' text")
            except Exception as e:
                print(f"Error finding locale text: {e}")

            # Extract all visible text for analysis
            body_text = page.locator('body').text_content()
            print(f"\n--- Page Content Preview ---")
            lines = body_text.strip().split('\n')[:20]  # First 20 lines
            for line in lines:
                if line.strip():
                    print(line.strip())

            # Check for specific translation markers
            print(f"\n--- Translation Check ---")
            if 'Features' in body_text:
                print("✓ Found 'Features' (English)")
            if '功能特性' in body_text:
                print("✓ Found '功能特性' (Chinese)")
            if 'Pricing' in body_text:
                print("✓ Found 'Pricing' (English)")
            if '价格方案' in body_text:
                print("✓ Found '价格方案' (Chinese)")

        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path=f"/tmp/error_{expected_locale}.png", full_page=True)

        finally:
            browser.close()

if __name__ == '__main__':
    # Test both English and Chinese pages
    test_locale_page('http://localhost:3001/test-locale', 'en')
    test_locale_page('http://localhost:3001/zh/test-locale', 'zh')

    print(f"\n{'='*60}")
    print("Testing complete!")
    print("Check the screenshots at:")
    print("  - /tmp/locale_test_en.png")
    print("  - /tmp/locale_test_zh.png")
    print(f"{'='*60}\n")
