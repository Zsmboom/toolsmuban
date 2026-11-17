/**
 * 缝隙网格的补位格。
 *
 * `grid-hairline` 的缝隙是容器底色（border 色）透出来的，所以**空格子
 * 会变成一块灰色矩形**。只要卡片数量不是列数的整数倍，最后一行就会露馅。
 *
 * 解法是补上若干张 card 色的空格子。列数一律取 4 —— 4 能被 2 和 1 整除，
 * 所以补到 4 的整数倍之后，1 列 / 2 列 / 4 列三个断点都不会留洞。
 */
export const HAIRLINE_COLS = 4;

export function GridFill({ count, per = HAIRLINE_COLS }: { count: number; per?: number }) {
  const missing = (per - (count % per)) % per;
  if (missing === 0) return null;
  return (
    <>
      {Array.from({ length: missing }, (_, i) => (
        <li key={`fill-${i}`} className="bg-card" aria-hidden="true" />
      ))}
    </>
  );
}
