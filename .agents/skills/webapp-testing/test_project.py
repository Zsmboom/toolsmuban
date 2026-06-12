#!/usr/bin/env python3
"""
SaaS 项目自动化测试 - 简化版
测试营销页面和核心功能
"""

from playwright.sync_api import sync_playwright
from pathlib import Path
import sys

# 截图输出目录
OUTPUT_DIR = Path("/tmp/saas-test-results")
OUTPUT_DIR.mkdir(exist_ok=True)

def test_page(page, url, name, description):
    """测试单个页面的通用函数"""
    print(f"\n📄 测试 {description}...")
    try:
        page.goto(url, timeout=10000)
        page.wait_for_load_state('networkidle', timeout=10000)

        # 截图
        screenshot_path = OUTPUT_DIR / f"{name}.png"
        page.screenshot(path=str(screenshot_path), full_page=True)

        # 获取页面标题
        title = page.title()
        print(f"   ✓ 页面标题: {title}")

        # 检查基本元素
        h1_count = page.locator('h1').count()
        button_count = page.locator('button').count()
        link_count = page.locator('a').count()

        print(f"   ✓ 发现 {h1_count} 个标题, {button_count} 个按钮, {link_count} 个链接")
        print(f"   ✓ 截图已保存: {screenshot_path.name}")

        return True
    except Exception as e:
        print(f"   ⚠️  警告: {str(e)[:100]}")
        return False

def main():
    print("=" * 70)
    print("🚀 SaaS 项目自动化测试")
    print("=" * 70)

    base_url = "http://localhost:3000"
    success_count = 0
    total_count = 0

    # 定义要测试的页面
    test_pages = [
        (f"{base_url}/en", "01-homepage", "首页"),
        (f"{base_url}/en/pricing", "02-pricing", "定价页面"),
        (f"{base_url}/en/about", "03-about", "关于页面"),
        (f"{base_url}/en/blog", "04-blog", "博客页面"),
        (f"{base_url}/en/privacy", "05-privacy", "隐私政策"),
        (f"{base_url}/en/terms", "06-terms", "服务条款"),
    ]

    with sync_playwright() as p:
        print("\n🌐 启动浏览器...")
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={"width": 1920, "height": 1080},
            user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
        )
        page = context.new_page()

        # 监听控制台错误
        errors = []
        page.on("pageerror", lambda exc: errors.append(str(exc)))

        try:
            # 测试所有页面
            for url, name, description in test_pages:
                total_count += 1
                if test_page(page, url, name, description):
                    success_count += 1

            # 测试响应式设计
            print(f"\n📱 测试响应式设计...")
            viewports = [
                ("mobile", 375, 667, "移动端"),
                ("tablet", 768, 1024, "平板"),
                ("desktop", 1920, 1080, "桌面端"),
            ]

            for name, width, height, desc in viewports:
                page.set_viewport_size({"width": width, "height": height})
                page.goto(f"{base_url}/en", timeout=10000)
                page.wait_for_load_state('networkidle', timeout=10000)
                screenshot_path = OUTPUT_DIR / f"responsive-{name}.png"
                page.screenshot(path=str(screenshot_path), full_page=True)
                print(f"   ✓ {desc} ({width}x{height}) - {screenshot_path.name}")

            # 显示JavaScript错误
            if errors:
                print(f"\n⚠️  发现 {len(errors)} 个JavaScript错误:")
                for error in errors[:5]:
                    print(f"   - {error[:100]}")
            else:
                print(f"\n✅ 未发现JavaScript错误")

        finally:
            browser.close()

    # 测试总结
    print("\n" + "=" * 70)
    print(f"📊 测试完成: {success_count}/{total_count} 页面测试通过")
    print("=" * 70)
    print(f"\n📁 所有截图已保存到: {OUTPUT_DIR}")
    print("\n生成的截图:")
    for screenshot in sorted(OUTPUT_DIR.glob("*.png")):
        print(f"   • {screenshot.name}")

    return 0 if success_count == total_count else 1

if __name__ == "__main__":
    sys.exit(main())
