import { env } from 'cloudflare:workers';
import { generateId } from '~/lib/auth';

/**
 * 工具产物存储（Cloudflare R2）。
 *
 * 图片生成之类的工具需要把产物存下来再返回链接给用户。R2 免费额度
 * 10 GB + **出口流量全免** —— 出口费才是这类站点在别家真正烧钱的地方。
 *
 * 用法（在 tools/server-fns.ts 的 handler 里）：
 *   const { key, url } = await putObject({
 *     userId, toolId: 'imageGen', body: pngBytes, contentType: 'image/png', ext: 'png',
 *   });
 *   return url;
 */

function bucket(): R2Bucket {
  const b = (env as { BUCKET?: R2Bucket }).BUCKET;
  if (!b) {
    throw new Error(
      'R2 binding "BUCKET" 未配置。在 wrangler.toml 里加 [[r2_buckets]] binding = "BUCKET"，' +
        '并用 `wrangler r2 bucket create <name>` 建桶。'
    );
  }
  return b;
}

/**
 * 对象 key 一律带上 userId 前缀。
 * 这样删号时可以按前缀批量清理，也方便按用户统计用量。
 */
export function buildObjectKey(userId: string, toolId: string, ext: string): string {
  const date = new Date().toISOString().slice(0, 10);
  return `${toolId}/${date}/${userId}/${generateId()}.${ext.replace(/^\./, '')}`;
}

export interface PutObjectResult {
  key: string;
  /** 可直接给用户的地址；未配公开域名时为 null，需走 getObject 代理 */
  url: string | null;
  size: number;
}

export async function putObject(params: {
  userId: string;
  toolId: string;
  body: ArrayBuffer | ArrayBufferView | ReadableStream | string;
  contentType: string;
  ext: string;
  /** 缓存时长，默认一年（产物内容不可变） */
  maxAge?: number;
}): Promise<PutObjectResult> {
  const key = buildObjectKey(params.userId, params.toolId, params.ext);

  const object = await bucket().put(key, params.body, {
    httpMetadata: {
      contentType: params.contentType,
      cacheControl: `public, max-age=${params.maxAge ?? 31_536_000}, immutable`,
    },
    customMetadata: { userId: params.userId, toolId: params.toolId },
  });

  return { key, url: publicUrl(key), size: object?.size ?? 0 };
}

/**
 * 公开访问地址。
 *
 * 建议给 bucket 绑一个自定义域名并配到 R2_PUBLIC_BASE_URL —— 这样文件由
 * R2 直接吐给用户，不经过 Worker，既不消耗 Worker 请求数也更快。
 * 没配的话返回 null，调用方回落到 /api/files/$key 由 Worker 代理。
 */
export function publicUrl(key: string): string | null {
  const base = env.R2_PUBLIC_BASE_URL;
  if (typeof base !== 'string' || !base) return null;
  return `${base.replace(/\/$/, '')}/${key}`;
}

export async function getObject(key: string): Promise<R2ObjectBody | null> {
  return bucket().get(key);
}

export async function deleteObject(key: string): Promise<void> {
  await bucket().delete(key);
}

/** 删号时按前缀清理该用户的全部产物 */
export async function deleteUserObjects(userId: string, toolId?: string): Promise<number> {
  const prefix = toolId ? `${toolId}/` : '';
  let deleted = 0;
  let cursor: string | undefined;

  do {
    const listing = await bucket().list({ prefix, cursor, limit: 500 });
    const keys = listing.objects
      .filter((o) => o.customMetadata?.userId === userId)
      .map((o) => o.key);
    if (keys.length > 0) {
      await bucket().delete(keys);
      deleted += keys.length;
    }
    cursor = listing.truncated ? listing.cursor : undefined;
  } while (cursor);

  return deleted;
}
