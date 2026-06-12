# 🖼️ OG 图片优化指南

本指南说明如何使用优化的 WebP 格式 OG 图片以提升网站性能。

## 📊 优化效果

生成的图片统计：
- **WebP 总大小**: 36.21 KB
- **PNG 总大小**: 170.12 KB
- **节省空间**: 133.90 KB (**78.7%**)

每张图片的节省比例：
- `og-image`: 79.6% 节省
- `og-pricing`: 66.3% 节省
- `og-about`: 82.4% 节省
- `og-blog`: 82.3% 节省

## 🚀 快速开始

### 1. 生成优化图片

```bash
# 生成所有 OG 图片（WebP + PNG）
npm run images:optimize

# 检查图片大小
npm run images:check
```

### 2. 使用优化的图片

有两种方式使用优化后的图片：

#### 方式 A：使用帮助函数（推荐）

```typescript
import { getOptimizedOgMetadata } from '@/lib/og-image-utils';

export const metadata = {
  ...getOptimizedOgMetadata({
    title: 'My Page',
    description: 'Page description',
    image: 'og-image', // 不包含扩展名
    url: '/page'
  })
};
```

#### 方式 B：手动配置

```typescript
import { getOptimizedOgImage, getOptimizedTwitterImage } from '@/lib/og-image-utils';

export const metadata = {
  openGraph: {
    images: getOptimizedOgImage('og-image', 'My Page'),
  },
  twitter: {
    images: getOptimizedTwitterImage('og-image'),
  },
};
```

## 📁 文件结构

```
public/
├── og-image.webp      # 主页 OG 图片（WebP）
├── og-image.png       # 主页 OG 图片（PNG 后备）
├── og-pricing.webp    # 定价页 OG 图片（WebP）
├── og-pricing.png     # 定价页 OG 图片（PNG 后备）
├── og-about.webp      # 关于页 OG 图片（WebP）
├── og-about.png       # 关于页 OG 图片（PNG 后备）
├── og-blog.webp       # 博客 OG 图片（WebP）
└── og-blog.png        # 博客 OG 图片（PNG 后备）
```

## 🎨 自定义图片

### 使用自己的图片

1. 创建目录：
   ```bash
   mkdir -p public/og-images-source
   ```

2. 添加源图片（PNG 或 JPG）：
   ```bash
   public/og-images-source/
   ├── og-image.png
   ├── og-pricing.png
   ├── og-about.png
   └── og-blog.png
   ```

3. 运行优化：
   ```bash
   npm run images:optimize
   ```

脚本会自动：
- 调整大小到 1200x630px
- 生成 WebP 版本（高压缩）
- 生成 PNG 版本（后备）
- 报告节省的空间

### 图片规格要求

- **尺寸**: 1200 x 630 像素（标准 OG 图片尺寸）
- **格式**: PNG, JPG, 或 WebP（源文件）
- **建议大小**:
  - WebP: < 50 KB
  - PNG: < 100 KB

## 🔧 配置选项

### 修改图片质量

编辑 `scripts/optimize-og-images.js`：

```javascript
const QUALITY = {
  webp: 85,  // 85% 质量（推荐 80-90）
  png: 90,   // 90% 质量（推荐 85-95）
  jpeg: 85,  // 85% 质量（仅在使用 JPEG 时）
};
```

### 添加新的 OG 图片

编辑 `scripts/optimize-og-images.js`：

```javascript
const OG_IMAGES = [
  { name: 'og-image', title: 'SaaS Template', subtitle: 'Launch Your Product 10x Faster' },
  { name: 'og-pricing', title: 'Pricing Plans', subtitle: 'Choose Your Perfect Plan' },
  { name: 'og-about', title: 'About Us', subtitle: 'Our Mission & Story' },
  { name: 'og-blog', title: 'Blog', subtitle: 'Insights & Tutorials' },
  // 添加新图片
  { name: 'og-contact', title: 'Contact Us', subtitle: 'Get in Touch' },
];
```

然后运行 `npm run images:optimize`。

## 🌐 浏览器兼容性

### WebP 支持
- Chrome: ✅ 32+
- Firefox: ✅ 65+
- Safari: ✅ 14+
- Edge: ✅ 18+
- **全球覆盖率**: 96%+

### 后备机制

元数据配置提供多个图片格式，浏览器会自动选择：

```typescript
images: [
  {
    url: '/og-image.webp',
    type: 'image/webp',  // 支持 WebP 的浏览器优先使用
  },
  {
    url: '/og-image.png',
    type: 'image/png',   // 不支持时后备到 PNG
  },
]
```

## 📱 社交媒体支持

### 支持 WebP 的平台
- ✅ Twitter/X (2019+)
- ✅ Facebook (2020+)
- ✅ LinkedIn (2021+)
- ✅ Discord
- ✅ Slack

### 测试工具

测试你的 OG 图片：

1. **Twitter Card Validator**
   - https://cards-dev.twitter.com/validator

2. **Facebook Sharing Debugger**
   - https://developers.facebook.com/tools/debug/

3. **LinkedIn Post Inspector**
   - https://www.linkedin.com/post-inspector/

4. **Open Graph Debugger**
   - https://www.opengraph.xyz/

## 📈 性能影响

### 加载时间对比

| 图片类型 | 大小 | 3G 网络 | 4G 网络 |
|---------|------|---------|---------|
| PNG (170 KB) | 170 KB | ~1.4s | ~0.3s |
| WebP (36 KB) | 36 KB | ~0.3s | ~0.06s |
| **节省** | **-78.7%** | **-1.1s** | **-0.24s** |

### SEO 影响
- ✅ 更快的页面加载
- ✅ 更好的 Core Web Vitals
- ✅ 提升搜索排名
- ✅ 更好的用户体验

## 🛠️ 故障排除

### 问题：脚本报错 "sharp not found"

解决方案：
```bash
npm install sharp --save-dev
```

### 问题：生成的图片太大

解决方案：
1. 降低质量设置（80-85）
2. 使用更简单的设计
3. 减少渐变和复杂图案

### 问题：WebP 图片在某些地方不显示

这是正常的 - 老旧浏览器会自动使用 PNG 后备图片。

### 问题：想要不同的图片尺寸

编辑 `scripts/optimize-og-images.js`：
```javascript
const OG_WIDTH = 1200;  // 修改宽度
const OG_HEIGHT = 630;  // 修改高度
```

## 📚 更多资源

- [WebP 官方文档](https://developers.google.com/speed/webp)
- [Open Graph Protocol](https://ogp.me/)
- [Twitter Cards 文档](https://developer.twitter.com/en/docs/twitter-for-websites/cards)
- [Sharp 图片处理库](https://sharp.pixelplumbing.com/)

## ✅ 检查清单

优化完成后，确保：

- [ ] 所有 OG 图片都有 WebP 和 PNG 版本
- [ ] WebP 文件 < 50 KB
- [ ] PNG 文件 < 100 KB
- [ ] 图片尺寸为 1200x630px
- [ ] 元数据正确引用图片
- [ ] 在社交媒体工具中测试过
- [ ] 在不同浏览器中验证过

## 🎉 完成！

你的 OG 图片现在已经优化，可以提供：
- ✅ 78.7% 更小的文件
- ✅ 更快的加载速度
- ✅ 更好的 SEO
- ✅ 更好的用户体验

享受你优化后的网站！🚀
