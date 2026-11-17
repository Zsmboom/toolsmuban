import { createFileRoute, notFound } from '@tanstack/react-router';

/**
 * R2 产物的回落读取通道。
 *
 * 给 bucket 绑了自定义域名（R2_PUBLIC_BASE_URL）时用不到这条路由 ——
 * 那种情况下文件由 R2 直接吐给用户，不经过 Worker，更快也更省请求数。
 */
export const Route = createFileRoute('/api/files/$')({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const key = (params as { _splat?: string })._splat;
        if (!key) throw notFound();

        const { getObject } = await import('~/lib/storage');
        const object = await getObject(key);
        if (!object) return new Response('Not found', { status: 404 });

        const headers = new Headers();
        object.writeHttpMetadata(headers);
        headers.set('etag', object.httpEtag);
        return new Response(object.body, { headers });
      },
    },
  },
});
