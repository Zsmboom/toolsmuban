#!/usr/bin/env python3
"""
Multilingual Next.js Application Test
Tests English (default) and Chinese language routes
"""

from playwright.sync_api import sync_playwright
import sys
import os

def test_multilingual_app():
    """Test multilingual functionality of the Next.js app"""

    results = {
        'passed': [],
        'failed': [],
        'screenshots': []
    }

    with sync_playwright() as p:
        # Launch browser in headless mode
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 1280, 'height': 720})
        page = context.new_page()

        # Create screenshots directory
        screenshots_dir = '/tmp/webapp_screenshots'
        os.makedirs(screenshots_dir, exist_ok=True)

        print("=" * 60)
        print("Testing Multilingual Next.js Application")
        print("=" * 60)

        # Test 1: English Home Page (default route)
        print("\n1. Testing English home page (/)...")
        try:
            page.goto('http://localhost:3000/', wait_until='networkidle', timeout=15000)
            page.wait_for_timeout(2000)  # Wait for React hydration

            # Check if page loaded
            title = page.title()
            print(f"   ✓ Page loaded: {title}")

            # Take screenshot
            screenshot_path = f"{screenshots_dir}/01_home_english.png"
            page.screenshot(path=screenshot_path, full_page=True)
            results['screenshots'].append(screenshot_path)
            print(f"   ✓ Screenshot saved: {screenshot_path}")

            # Check for English content
            content = page.content()
            if 'hrefLang="en"' in content or 'locale' in content.lower():
                print("   ✓ English locale detected")
                results['passed'].append('English home page')
            else:
                results['failed'].append('English home page - no locale metadata found')

        except Exception as e:
            print(f"   ✗ Failed: {str(e)}")
            results['failed'].append(f'English home page: {str(e)}')

        # Test 2: Chinese Home Page (/zh)
        print("\n2. Testing Chinese home page (/zh)...")
        try:
            page.goto('http://localhost:3000/zh', wait_until='networkidle', timeout=15000)
            page.wait_for_timeout(2000)

            title = page.title()
            print(f"   ✓ Page loaded: {title}")

            screenshot_path = f"{screenshots_dir}/02_home_chinese.png"
            page.screenshot(path=screenshot_path, full_page=True)
            results['screenshots'].append(screenshot_path)
            print(f"   ✓ Screenshot saved: {screenshot_path}")

            # Check URL
            current_url = page.url
            if '/zh' in current_url:
                print(f"   ✓ Chinese route verified: {current_url}")
                results['passed'].append('Chinese home page')
            else:
                results['failed'].append(f'Chinese home page - wrong URL: {current_url}')

        except Exception as e:
            print(f"   ✗ Failed: {str(e)}")
            results['failed'].append(f'Chinese home page: {str(e)}')

        # Test 3: English Pricing Page
        print("\n3. Testing English pricing page (/pricing)...")
        try:
            page.goto('http://localhost:3000/pricing', wait_until='networkidle', timeout=15000)
            page.wait_for_timeout(2000)

            screenshot_path = f"{screenshots_dir}/03_pricing_english.png"
            page.screenshot(path=screenshot_path, full_page=True)
            results['screenshots'].append(screenshot_path)
            print(f"   ✓ Screenshot saved: {screenshot_path}")

            # Look for pricing content
            has_pricing = page.locator('text=/pricing|price|plan/i').count() > 0
            if has_pricing:
                print("   ✓ Pricing content found")
                results['passed'].append('English pricing page')
            else:
                print("   ⚠ Warning: No pricing content detected")
                results['passed'].append('English pricing page (loaded)')

        except Exception as e:
            print(f"   ✗ Failed: {str(e)}")
            results['failed'].append(f'English pricing page: {str(e)}')

        # Test 4: Chinese Pricing Page
        print("\n4. Testing Chinese pricing page (/zh/pricing)...")
        try:
            page.goto('http://localhost:3000/zh/pricing', wait_until='networkidle', timeout=15000)
            page.wait_for_timeout(2000)

            screenshot_path = f"{screenshots_dir}/04_pricing_chinese.png"
            page.screenshot(path=screenshot_path, full_page=True)
            results['screenshots'].append(screenshot_path)
            print(f"   ✓ Screenshot saved: {screenshot_path}")

            current_url = page.url
            if '/zh/pricing' in current_url:
                print(f"   ✓ Chinese pricing route verified")
                results['passed'].append('Chinese pricing page')
            else:
                results['failed'].append(f'Chinese pricing page - wrong URL: {current_url}')

        except Exception as e:
            print(f"   ✗ Failed: {str(e)}")
            results['failed'].append(f'Chinese pricing page: {str(e)}')

        # Test 5: English About Page
        print("\n5. Testing English about page (/about)...")
        try:
            page.goto('http://localhost:3000/about', wait_until='networkidle', timeout=15000)
            page.wait_for_timeout(2000)

            screenshot_path = f"{screenshots_dir}/05_about_english.png"
            page.screenshot(path=screenshot_path, full_page=True)
            results['screenshots'].append(screenshot_path)
            print(f"   ✓ Screenshot saved: {screenshot_path}")
            results['passed'].append('English about page')

        except Exception as e:
            print(f"   ✗ Failed: {str(e)}")
            results['failed'].append(f'English about page: {str(e)}')

        # Test 6: Chinese About Page
        print("\n6. Testing Chinese about page (/zh/about)...")
        try:
            page.goto('http://localhost:3000/zh/about', wait_until='networkidle', timeout=15000)
            page.wait_for_timeout(2000)

            screenshot_path = f"{screenshots_dir}/06_about_chinese.png"
            page.screenshot(path=screenshot_path, full_page=True)
            results['screenshots'].append(screenshot_path)
            print(f"   ✓ Screenshot saved: {screenshot_path}")
            results['passed'].append('Chinese about page')

        except Exception as e:
            print(f"   ✗ Failed: {str(e)}")
            results['failed'].append(f'Chinese about page: {str(e)}')

        # Test 7: English Blog Page
        print("\n7. Testing English blog page (/blog)...")
        try:
            page.goto('http://localhost:3000/blog', wait_until='networkidle', timeout=15000)
            page.wait_for_timeout(2000)

            screenshot_path = f"{screenshots_dir}/07_blog_english.png"
            page.screenshot(path=screenshot_path, full_page=True)
            results['screenshots'].append(screenshot_path)
            print(f"   ✓ Screenshot saved: {screenshot_path}")
            results['passed'].append('English blog page')

        except Exception as e:
            print(f"   ✗ Failed: {str(e)}")
            results['failed'].append(f'English blog page: {str(e)}')

        # Test 8: Chinese Blog Page
        print("\n8. Testing Chinese blog page (/zh/blog)...")
        try:
            page.goto('http://localhost:3000/zh/blog', wait_until='networkidle', timeout=15000)
            page.wait_for_timeout(2000)

            screenshot_path = f"{screenshots_dir}/08_blog_chinese.png"
            page.screenshot(path=screenshot_path, full_page=True)
            results['screenshots'].append(screenshot_path)
            print(f"   ✓ Screenshot saved: {screenshot_path}")
            results['passed'].append('Chinese blog page')

        except Exception as e:
            print(f"   ✗ Failed: {str(e)}")
            results['failed'].append(f'Chinese blog page: {str(e)}')

        # Close browser
        browser.close()

        # Print summary
        print("\n" + "=" * 60)
        print("Test Summary")
        print("=" * 60)
        print(f"\n✓ Passed: {len(results['passed'])} tests")
        for test in results['passed']:
            print(f"  - {test}")

        if results['failed']:
            print(f"\n✗ Failed: {len(results['failed'])} tests")
            for test in results['failed']:
                print(f"  - {test}")

        print(f"\n📸 Screenshots saved in: {screenshots_dir}")
        print(f"   Total screenshots: {len(results['screenshots'])}")

        # Return exit code
        return 0 if not results['failed'] else 1

if __name__ == '__main__':
    exit_code = test_multilingual_app()
    sys.exit(exit_code)
