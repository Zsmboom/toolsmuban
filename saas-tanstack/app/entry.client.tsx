/// <reference types="vite/client" />

import { StartClient } from '@tanstack/react-start/client';
import { hydrateRoot } from 'react-dom/client';

// __root 渲染的是整个 <html>，所以水合目标必须是 document 本身，
// 而不是某个容器元素。
hydrateRoot(document, <StartClient />);
