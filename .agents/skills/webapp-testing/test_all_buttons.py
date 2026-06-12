"""
全面测试 SaaS 应用的所有按钮和页面跳转
"""
from playwright.sync_api import sync_playwright, Page
import time
import os

# 创建截图目录
SCREENSHOT_DIR = "/tmp/webapp_test_screenshots"
os.makedirs(SCREENSHOT_DIR, exist_ok=True)

def take_screenshot(page: Page, name: str):
    """保存截图"""
    filepath = f"{SCREENSHOT_DIR}/{name}.png"
    page.screenshot(path=filepath, full_page=True)
    print(f"✅ 截图已保存: {filepath}")

def test_navigation_links(page: Page):
    """测试导航栏链接"""
    print("\n=== 测试导航栏链接 ===")

    # 主页链接
    links = [
        ("Features", "/#features"),
        ("Pricing", "/pricing"),
        ("Blog", "/blog"),
        ("About", "/about"),
        ("Sign In", "/login"),
    ]

    for name, expected_url in links:
        print(f"\n测试链接: {name}")
        page.goto('http://localhost:3000')
        page.wait_for_load_state('networkidle')

        # 查找并点击链接
        link = page.get_by_text(name, exact=True).first
        if link.is_visible():
            print(f"  找到链接: {name}")
            link.click()
            page.wait_for_load_state('networkidle')
            time.sleep(0.5)

            current_url = page.url
            print(f"  当前 URL: {current_url}")

            # 截图
            take_screenshot(page, f"nav_{name.replace(' ', '_').lower()}")

            if expected_url in current_url:
                print(f"  ✅ 导航成功到 {name}")
            else:
                print(f"  ⚠️  URL 不匹配，期望包含 {expected_url}，实际是 {current_url}")
        else:
            print(f"  ❌ 未找到可见的链接: {name}")

def test_buttons_on_page(page: Page, page_name: str):
    """测试页面上的所有按钮"""
    print(f"\n=== 测试 {page_name} 页面的按钮 ===")

    # 等待页面完全加载
    page.wait_for_load_state('networkidle')
    time.sleep(1)

    # 截图
    take_screenshot(page, f"page_{page_name}")

    # 查找所有按钮
    buttons = page.locator('button, a[role="button"], .btn, [class*="button"]').all()
    print(f"  找到 {len(buttons)} 个按钮/按钮样式元素")

    # 获取所有链接
    links = page.locator('a[href]').all()
    print(f"  找到 {len(links)} 个链接")

    # 列出前 20 个按钮的文本
    print(f"\n  按钮列表（前 20 个）:")
    for i, button in enumerate(buttons[:20]):
        try:
            if button.is_visible():
                text = button.inner_text()[:50] if button.inner_text() else "[无文本]"
                print(f"    {i+1}. {text}")
        except:
            pass

def test_mobile_menu(page: Page):
    """测试移动端菜单"""
    print("\n=== 测试移动端菜单 ===")

    # 设置移动端视口
    page.set_viewport_size({"width": 375, "height": 667})
    page.goto('http://localhost:3000')
    page.wait_for_load_state('networkidle')

    # 查找菜单按钮
    menu_button = page.locator('button[aria-label="Toggle menu"]')
    if menu_button.is_visible():
        print("  找到移动端菜单按钮")
        take_screenshot(page, "mobile_before_menu")

        # 点击打开菜单
        menu_button.click()
        time.sleep(0.5)
        take_screenshot(page, "mobile_menu_open")
        print("  ✅ 移动端菜单已打开")

        # 测试菜单中的链接
        mobile_links = page.locator('#mobile-menu a').all()
        print(f"  移动端菜单中找到 {len(mobile_links)} 个链接")

        # 关闭菜单
        menu_button.click()
        time.sleep(0.5)
        print("  ✅ 移动端菜单已关闭")
    else:
        print("  ❌ 未找到移动端菜单按钮")

    # 恢复桌面视口
    page.set_viewport_size({"width": 1280, "height": 720})

def test_all_pages(page: Page):
    """测试所有主要页面"""
    print("\n=== 测试所有主要页面 ===")

    pages_to_test = [
        ("/", "主页"),
        ("/pricing", "定价页"),
        ("/blog", "博客页"),
        ("/about", "关于页"),
        ("/login", "登录页"),
        ("/terms", "条款页"),
        ("/privacy", "隐私页"),
    ]

    for path, name in pages_to_test:
        print(f"\n访问页面: {name} ({path})")
        try:
            page.goto(f'http://localhost:3000{path}')
            page.wait_for_load_state('networkidle')
            time.sleep(0.5)

            # 检查页面是否加载成功
            title = page.title()
            print(f"  页面标题: {title}")

            # 截图
            take_screenshot(page, f"fullpage_{name.replace(' ', '_')}")
            print(f"  ✅ {name} 加载成功")

            # 测试页面上的按钮
            test_buttons_on_page(page, name)

        except Exception as e:
            print(f"  ❌ 访问 {name} 失败: {str(e)}")

def discover_all_interactive_elements(page: Page):
    """发现页面上所有可交互元素"""
    print("\n=== 发现所有可交互元素 ===")

    page.goto('http://localhost:3000')
    page.wait_for_load_state('networkidle')

    # 收集各类元素
    element_types = {
        "按钮": 'button',
        "链接": 'a[href]',
        "输入框": 'input',
        "选择框": 'select',
        "文本域": 'textarea',
    }

    for name, selector in element_types.items():
        elements = page.locator(selector).all()
        visible_count = sum(1 for el in elements if el.is_visible())
        print(f"  {name}: 总共 {len(elements)} 个，可见 {visible_count} 个")

def main():
    print("🚀 开始测试 SaaS 应用的所有按钮和页面跳转")
    print(f"截图将保存到: {SCREENSHOT_DIR}\n")

    with sync_playwright() as p:
        # 启动浏览器
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1280, "height": 720})
        page = context.new_page()

        # 启用控制台日志
        page.on("console", lambda msg: print(f"  [浏览器控制台] {msg.type}: {msg.text}"))

        try:
            # 1. 访问主页
            print("访问主页...")
            page.goto('http://localhost:3000')
            page.wait_for_load_state('networkidle')
            take_screenshot(page, "homepage")
            print("✅ 主页加载成功")

            # 2. 发现所有可交互元素
            discover_all_interactive_elements(page)

            # 3. 测试导航链接
            test_navigation_links(page)

            # 4. 测试移动端菜单
            test_mobile_menu(page)

            # 5. 测试所有页面
            test_all_pages(page)

            print("\n" + "="*60)
            print("✅ 测试完成！")
            print(f"所有截图已保存到: {SCREENSHOT_DIR}")
            print("="*60)

        except Exception as e:
            print(f"\n❌ 测试过程中出现错误: {str(e)}")
            import traceback
            traceback.print_exc()

        finally:
            browser.close()

if __name__ == "__main__":
    main()
