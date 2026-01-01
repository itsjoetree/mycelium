import createClient from 'openapi-fetch';
import type { paths } from './schema';

export const client = createClient<paths>({
    baseUrl: '/' // Proxy handles the rest
});
