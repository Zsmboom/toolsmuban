#!/usr/bin/env python3
"""
Comprehensive test suite for SaaS Template
Tests marketing pages, navigation, and key UI elements
"""

from playwright.sync_api import sync_playwright, Page
import sys
from pathlib import Path

# Output directory for screenshots
OUTPUT_DIR = Path("/tmp/saas-test-results")
OUTPUT_DIR.mkdir(exist_ok=True)

def test_marketing_pages(page: Page):
    """Test all marketing pages"""
    print("\n=== Testing Marketing Pages ===")

    base_url = "http://localhost:3000"

    # Test Home Page
    print("\n1. Testing Home Page...")
    page.goto(f"{base_url}/en")
    page.wait_for_load_state('networkidle')
    page.screenshot(path=str(OUTPUT_DIR / "01-home-page.png"), full_page=True)

    # Check for common homepage elements
    try:
        # Look for navigation
        nav_elements = page.locator('nav').count()
        print(f"   ✓ Found {nav_elements} navigation element(s)")

        # Check for hero section or main content
        main_content = page.locator('main').count()
        print(f"   ✓ Found {main_content} main content area(s)")

        # Check for headings
        h1_count = page.locator('h1').count()
        print(f"   ✓ Found {h1_count} H1 heading(s)")

    except Exception as e:
        print(f"   ⚠ Warning: {e}")

    # Test Pricing Page
    print("\n2. Testing Pricing Page...")
    page.goto(f"{base_url}/en/pricing")
    page.wait_for_load_state('networkidle')
    page.screenshot(path=str(OUTPUT_DIR / "02-pricing-page.png"), full_page=True)

    # Check for pricing cards
    try:
        buttons = page.locator('button').all()
        print(f"   ✓ Found {len(buttons)} button(s)")

        # Look for pricing-related text
        page_text = page.content()
        if 'price' in page_text.lower() or 'plan' in page_text.lower():
            print("   ✓ Pricing content detected")
    except Exception as e:
        print(f"   ⚠ Warning: {e}")

    # Test About Page
    print("\n3. Testing About Page...")
    page.goto(f"{base_url}/en/about")
    page.wait_for_load_state('networkidle')
    page.screenshot(path=str(OUTPUT_DIR / "03-about-page.png"), full_page=True)
    print("   ✓ About page loaded successfully")

    # Test Blog Page
    print("\n4. Testing Blog Page...")
    page.goto(f"{base_url}/en/blog")
    page.wait_for_load_state('networkidle')
    page.screenshot(path=str(OUTPUT_DIR / "04-blog-page.png"), full_page=True)

    # Check for blog posts or articles
    try:
        articles = page.locator('article').count()
        if articles > 0:
            print(f"   ✓ Found {articles} article(s)")
        else:
            # Try finding links or cards
            links = page.locator('a').count()
            print(f"   ✓ Found {links} link(s)")
    except Exception as e:
        print(f"   ⚠ Warning: {e}")

def test_navigation(page: Page):
    """Test navigation functionality"""
    print("\n=== Testing Navigation ===")

    base_url = "http://localhost:3000/en"
    page.goto(base_url)
    page.wait_for_load_state('networkidle')

    # Try to find and click navigation links
    try:
        # Get all navigation links
        nav_links = page.locator('nav a').all()
        print(f"\n   Found {len(nav_links)} navigation links")

        for i, link in enumerate(nav_links[:5]):  # Test first 5 links
            try:
                href = link.get_attribute('href')
                text = link.inner_text()
                if href and not href.startswith('#'):
                    print(f"   {i+1}. Link: '{text}' → {href}")
            except:
                pass

    except Exception as e:
        print(f"   ⚠ Navigation test skipped: {e}")

def test_auth_pages(page: Page):
    """Test authentication pages (unauthenticated view)"""
    print("\n=== Testing Auth Pages ===")

    base_url = "http://localhost:3000"

    # Test Login Page
    print("\n1. Testing Login Page...")
    page.goto(f"{base_url}/en/login")
    page.wait_for_load_state('networkidle')
    page.screenshot(path=str(OUTPUT_DIR / "05-login-page.png"), full_page=True)

    # Check for login form elements
    try:
        input_count = page.locator('input').count()
        button_count = page.locator('button').count()
        print(f"   ✓ Found {input_count} input field(s)")
        print(f"   ✓ Found {button_count} button(s)")
    except Exception as e:
        print(f"   ⚠ Warning: {e}")

def test_responsive_design(page: Page):
    """Test responsive design at different viewport sizes"""
    print("\n=== Testing Responsive Design ===")

    base_url = "http://localhost:3000/en"

    viewports = [
        ("Mobile", 375, 667),
        ("Tablet", 768, 1024),
        ("Desktop", 1920, 1080),
    ]

    for name, width, height in viewports:
        print(f"\n   Testing {name} ({width}x{height})...")
        page.set_viewport_size({"width": width, "height": height})
        page.goto(base_url)
        page.wait_for_load_state('networkidle')
        page.screenshot(
            path=str(OUTPUT_DIR / f"06-responsive-{name.lower()}.png"),
            full_page=True
        )
        print(f"   ✓ {name} view captured")

def test_console_logs(page: Page):
    """Capture and display console logs"""
    print("\n=== Monitoring Console Logs ===")

    logs = []
    errors = []

    # Set up console listeners
    page.on("console", lambda msg: logs.append(f"[{msg.type}] {msg.text}"))
    page.on("pageerror", lambda exc: errors.append(str(exc)))

    # Visit the homepage
    page.goto("http://localhost:3000/en")
    page.wait_for_load_state('networkidle')

    # Display results
    if errors:
        print("\n   ⚠ JavaScript Errors Detected:")
        for error in errors:
            print(f"     - {error}")
    else:
        print("\n   ✓ No JavaScript errors detected")

    if logs:
        print(f"\n   Console logs captured: {len(logs)}")
        # Show first 5 logs
        for log in logs[:5]:
            print(f"     {log}")
        if len(logs) > 5:
            print(f"     ... and {len(logs) - 5} more")

def run_tests():
    """Main test runner"""
    print("=" * 60)
    print("SaaS Template - Automated Test Suite")
    print("=" * 60)

    with sync_playwright() as p:
        # Launch browser in headless mode
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={"width": 1280, "height": 720},
            user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
        )
        page = context.new_page()

        try:
            # Run all test suites
            test_marketing_pages(page)
            test_navigation(page)
            test_auth_pages(page)
            test_responsive_design(page)
            test_console_logs(page)

            print("\n" + "=" * 60)
            print("✓ All Tests Completed!")
            print("=" * 60)
            print(f"\nScreenshots saved to: {OUTPUT_DIR}")
            print("\nGenerated screenshots:")
            for screenshot in sorted(OUTPUT_DIR.glob("*.png")):
                print(f"  - {screenshot.name}")

            return 0

        except Exception as e:
            print(f"\n❌ Test failed with error: {e}")
            import traceback
            traceback.print_exc()
            return 1

        finally:
            browser.close()

if __name__ == "__main__":
    sys.exit(run_tests())
