import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';

export default tseslint.config(
  {
    ignores: [
      'dist/**',
      'dist_bak/**',
      '.wrangler/**',
      '.tanstack/**',
      'node_modules/**',
      // 由 TanStack Router 生成，不做 lint
      'app/routeTree.gen.ts',
      '*.timestamp_*.js',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    // 构建/维护脚本跑在 Node 里
    files: ['scripts/**/*.{js,mjs}', '*.config.{js,mjs,ts}'],
    languageOptions: { globals: globals.node },
  },
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
    rules: {
      // 禁止硬编码 Tailwind 调色板颜色。
      // 换配色时只应该改 globals.css 的 @theme token；一旦有人写死
      // bg-blue-500 这类 class，换肤就会漏掉它，而且很难人工查全。
      'no-restricted-syntax': [
        'error',
        {
          selector:
            "Literal[value=/\\b(bg|text|border|ring|from|to|via|fill|stroke|divide|outline|shadow|accent|caret|decoration|placeholder)-(white|black|slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)(-[0-9]{2,3})?\\b/]",
          message:
            '不要硬编码 Tailwind 调色板颜色，请使用语义 token（primary / success / warning / destructive / info / muted / border / overlay 等，定义在 app/styles/globals.css）。',
        },
        {
          selector:
            "TemplateElement[value.raw=/\\b(bg|text|border|ring|from|to|via|fill|stroke|divide|outline|shadow|accent|caret|decoration|placeholder)-(white|black|slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)(-[0-9]{2,3})?\\b/]",
          message:
            '不要硬编码 Tailwind 调色板颜色，请使用语义 token（定义在 app/styles/globals.css）。',
        },
      ],
      // 允许以 _ 开头的未使用参数（常见于回调签名）
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  }
);
