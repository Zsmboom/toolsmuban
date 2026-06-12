"""
健壮的按钮和页面测试 - 能够处理错误并继续测试
"""
from playwright.sync_api import sync_playwright, Page
import time
import os
import json

# 创建截图和报告目录
SCREENSHOT_DIR = "/tmp/webapp_test_screenshots"
REPORT_FILE = "/tmp/webapp_test_report.json"
os.makedirs(SCREENSHOT_DIR, exist_ok=True)

# 测试报告
test_report = {
    "summary": {
        "total_tests": 0,
        "passed": 0,
        "failed": 0,
        "warnings": 0
    },
    "tests": []
}

def add_test_result(name, status, details="", screenshot=""):
    """添加测试结果"""
    test_report["tests"].append({
        "name": name,
        "status": status,
        "details": details,
        "screenshot": screenshot,
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")
    })
    test_report["summary"]["total_tests"] += 1
    test_report["summary"][status] += 1

def take_screenshot(page: Page, name: str):
    """保存截图"""
    try:
        filepath = f"{SCREENSHOT_DIR}/{name}.png"
        page.screenshot(path=filepath, full_page=True)
        print(f"  📸 截图: {name}.png")
        return filepath
    except Exception as e:
        print(f"  ⚠️  截图失败: {str(e)}")
        return ""

def safe_goto(page: Page, url: str, timeout=10000):
    """安全地导航到页面"""
    try:
        page.goto(url, timeout=timeout, wait_until="domcontentloaded")
        page.wait_for_load_state('networkidle', timeout=timeout)
        return True, "成功"
    except Exception as e:
        return False, str(e)

def test_page_load(page: Page, path: str, name: str):
    """测试页面加载"""
    print(f"\n{'='*60}")
    print(f"📄 测试页面: {name}")
    print(f"   路径: {path}")
    print(f"{'='*60}")

    url = f'http://localhost:3000{path}'
    success, message = safe_goto(page, url)

    if success:
        try:
            # 等待一下让页面渲染完成
            time.sleep(1)

            # 检查是否有错误页面
            error_selectors = [
                'text=Runtime Error',
                'text=Internal Server Error',
                'text=404',
                'text=Error'
            ]

            has_error = False
            error_type = ""
            for selector in error_selectors:
                if page.locator(selector).count() > 0:
                    has_error = True
                    error_type = selector.replace('text=', '')
                    break

            # 截图
            screenshot = take_screenshot(page, f"page_{name.replace(' ', '_').lower()}")

            if has_error:
                print(f"  ⚠️  页面加载但显示错误: {error_type}")
                add_test_result(f"页面加载: {name}", "warnings", f"页面显示错误: {error_type}", screenshot)
                return False
            else:
                # 获取页面信息
                title = page.title()
                print(f"  ✅ 页面标题: {title}")

                # 统计页面元素
                buttons = page.locator('button').count()
                links = page.locator('a[href]').count()
                inputs = page.locator('input').count()

                details = f"标题: {title}, 按钮: {buttons}, 链接: {links}, 输入框: {inputs}"
                print(f"  📊 元素统计: 按钮={buttons}, 链接={links}, 输入框={inputs}")

                add_test_result(f"页面加载: {name}", "passed", details, screenshot)
                return True
        except Exception as e:
            screenshot = take_screenshot(page, f"error_{name.replace(' ', '_').lower()}")
            print(f"  ❌ 页面检查失败: {str(e)}")
            add_test_result(f"页面加载: {name}", "failed", str(e), screenshot)
            return False
    else:
        print(f"  ❌ 页面加载失败: {message}")
        add_test_result(f"页面加载: {name}", "failed", message, "")
        return False

def test_navigation_buttons(page: Page):
    """测试导航栏按钮"""
    print(f"\n{'='*60}")
    print(f"🔘 测试导航栏按钮")
    print(f"{'='*60}")

    # 先回到主页
    success, _ = safe_goto(page, 'http://localhost:3000')
    if not success:
        print("  ❌ 无法访问主页")
        return

    # 导航栏按钮测试
    nav_items = [
        {"text": "Features", "expected_hash": "#features", "name": "Features 链接"},
        {"text": "Pricing", "expected_path": "/pricing", "name": "Pricing 链接"},
        {"text": "Blog", "expected_path": "/blog", "name": "Blog 链接"},
        {"text": "About", "expected_path": "/about", "name": "About 链接"},
    ]

    for item in nav_items:
        print(f"\n  测试: {item['name']}")

        # 回到主页
        safe_goto(page, 'http://localhost:3000')
        time.sleep(0.5)

        # 查找并点击链接
        try:
            link = page.get_by_text(item['text'], exact=True).first
            if link.is_visible():
                print(f"    找到链接，点击中...")

                # 截图点击前
                before_url = page.url

                # 点击
                link.click()
                time.sleep(1)

                # 截图点击后
                screenshot = take_screenshot(page, f"nav_{item['text'].lower()}_after_click")
                after_url = page.url

                print(f"    点击前 URL: {before_url}")
                print(f"    点击后 URL: {after_url}")

                # 检查是否跳转成功
                expected = item.get('expected_path', '') or item.get('expected_hash', '')
                if expected in after_url:
                    print(f"    ✅ 导航成功")
                    add_test_result(item['name'], "passed", f"从 {before_url} 跳转到 {after_url}", screenshot)
                else:
                    print(f"    ⚠️  URL 未按预期更改")
                    add_test_result(item['name'], "warnings", f"期望包含 {expected}，实际是 {after_url}", screenshot)
            else:
                print(f"    ⚠️  链接不可见")
                add_test_result(item['name'], "warnings", "链接不可见", "")
        except Exception as e:
            print(f"    ❌ 测试失败: {str(e)}")
            add_test_result(item['name'], "failed", str(e), "")

def test_cta_buttons(page: Page):
    """测试 CTA (Call-to-Action) 按钮"""
    print(f"\n{'='*60}")
    print(f"🔘 测试 CTA 按钮")
    print(f"{'='*60}")

    # 回到主页
    success, _ = safe_goto(page, 'http://localhost:3000')
    if not success:
        return

    time.sleep(1)

    # 查找 "Get Started" 按钮
    try:
        get_started_buttons = page.get_by_text("Get Started").all()
        print(f"\n  找到 {len(get_started_buttons)} 个 'Get Started' 按钮")

        for i, button in enumerate(get_started_buttons[:3]):  # 测试前3个
            if button.is_visible():
                print(f"\n  测试 Get Started 按钮 #{i+1}")

                # 滚动到按钮
                button.scroll_into_view_if_needed()
                time.sleep(0.3)

                # 截图前
                before_url = page.url

                # 点击
                button.click()
                time.sleep(1)

                # 截图后
                screenshot = take_screenshot(page, f"cta_get_started_{i+1}")
                after_url = page.url

                print(f"    点击前: {before_url}")
                print(f"    点击后: {after_url}")

                if after_url != before_url:
                    print(f"    ✅ 按钮触发了导航")
                    add_test_result(f"Get Started 按钮 #{i+1}", "passed", f"跳转到 {after_url}", screenshot)
                else:
                    print(f"    ⚠️  URL 未改变")
                    add_test_result(f"Get Started 按钮 #{i+1}", "warnings", "URL 未改变", screenshot)

                # 返回主页准备测试下一个按钮
                safe_goto(page, 'http://localhost:3000')
                time.sleep(0.5)
    except Exception as e:
        print(f"  ❌ CTA 按钮测试失败: {str(e)}")
        add_test_result("CTA 按钮测试", "failed", str(e), "")

def test_mobile_menu(page: Page):
    """测试移动端菜单"""
    print(f"\n{'='*60}")
    print(f"📱 测试移动端菜单")
    print(f"{'='*60}")

    # 设置移动端视口
    page.set_viewport_size({"width": 375, "height": 667})

    success, _ = safe_goto(page, 'http://localhost:3000')
    if not success:
        page.set_viewport_size({"width": 1280, "height": 720})
        return

    time.sleep(1)

    try:
        # 查找菜单按钮
        menu_button = page.locator('button[aria-label="Toggle menu"]')
        if menu_button.is_visible():
            print("  找到移动端菜单按钮")

            # 截图关闭状态
            screenshot_closed = take_screenshot(page, "mobile_menu_closed")

            # 点击打开
            menu_button.click()
            time.sleep(0.5)

            # 截图打开状态
            screenshot_open = take_screenshot(page, "mobile_menu_open")

            # 检查菜单是否打开
            mobile_menu = page.locator('#mobile-menu')
            if mobile_menu.is_visible():
                print("  ✅ 移动端菜单成功打开")
                links = page.locator('#mobile-menu a').count()
                print(f"  📊 菜单中有 {links} 个链接")
                add_test_result("移动端菜单", "passed", f"菜单打开成功，包含 {links} 个链接", screenshot_open)
            else:
                print("  ⚠️  菜单按钮点击后菜单未显示")
                add_test_result("移动端菜单", "warnings", "菜单未显示", screenshot_open)
        else:
            print("  ⚠️  未找到移动端菜单按钮")
            add_test_result("移动端菜单", "warnings", "菜单按钮不可见", "")
    except Exception as e:
        print(f"  ❌ 移动端菜单测试失败: {str(e)}")
        add_test_result("移动端菜单", "failed", str(e), "")

    # 恢复桌面视口
    page.set_viewport_size({"width": 1280, "height": 720})

def generate_report():
    """生成测试报告"""
    with open(REPORT_FILE, 'w', encoding='utf-8') as f:
        json.dump(test_report, f, indent=2, ensure_ascii=False)

    print(f"\n{'='*60}")
    print(f"📊 测试报告摘要")
    print(f"{'='*60}")
    print(f"总测试数: {test_report['summary']['total_tests']}")
    print(f"✅ 通过: {test_report['summary']['passed']}")
    print(f"⚠️  警告: {test_report['summary']['warnings']}")
    print(f"❌ 失败: {test_report['summary']['failed']}")
    print(f"\n详细报告已保存到: {REPORT_FILE}")
    print(f"截图目录: {SCREENSHOT_DIR}")
    print(f"{'='*60}")

def main():
    print("🚀 开始全面测试 SaaS 应用")
    print(f"截图保存到: {SCREENSHOT_DIR}")
    print(f"报告保存到: {REPORT_FILE}\n")

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1280, "height": 720})
        page = context.new_page()

        # 记录控制台错误
        errors = []
        page.on("console", lambda msg:
            errors.append(msg.text) if msg.type in ["error", "warning"] else None
        )

        try:
            # 1. 测试主要页面加载
            pages_to_test = [
                ("/", "主页"),
                ("/about", "关于页"),
                ("/blog", "博客页"),
                ("/login", "登录页"),
                ("/terms", "服务条款页"),
                ("/privacy", "隐私政策页"),
                ("/pricing", "定价页"),  # 这个可能会失败
            ]

            for path, name in pages_to_test:
                test_page_load(page, path, name)

            # 2. 测试导航栏按钮
            test_navigation_buttons(page)

            # 3. 测试 CTA 按钮
            test_cta_buttons(page)

            # 4. 测试移动端菜单
            test_mobile_menu(page)

            # 5. 生成报告
            generate_report()

            # 6. 显示控制台错误
            if errors:
                print(f"\n⚠️  浏览器控制台错误/警告 ({len(errors)} 条):")
                for error in errors[:10]:  # 只显示前10条
                    print(f"  - {error[:100]}")

        except Exception as e:
            print(f"\n❌ 测试过程中出现严重错误: {str(e)}")
            import traceback
            traceback.print_exc()

        finally:
            browser.close()

if __name__ == "__main__":
    main()
