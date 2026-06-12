/// <reference types="vite/client" />

import { StartClient } from '@tanstack/react-start';
import { hydrateRoot } from 'react-dom/client';

hydrateRoot(document.getElementById('root')!, <StartClient />);
