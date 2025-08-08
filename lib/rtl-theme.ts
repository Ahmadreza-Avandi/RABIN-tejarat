import { prefixer } from 'stylis';
import rtlPlugin from 'stylis-plugin-rtl';
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';

// ایجاد cache برای RTL
export function createRtlCache() {
    return createCache({
        key: 'muirtl',
        stylisPlugins: [prefixer, rtlPlugin],
    });
}

export const rtlCache = createRtlCache();