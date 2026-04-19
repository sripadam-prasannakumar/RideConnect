import { getAccessToken } from './authUtils';

/**
 * A wrapper around fetch that automatically adds the JWT Authorization header if a token exists.
 * @param {string} url - The URL to fetch.
 * @param {object} options - Fetch options (method, headers, body, etc.).
 * @returns {Promise<Response>} - The fetch response.
 */
export const authorizedFetch = async (url, options = {}) => {
    const token = getAccessToken();

    // Create a new headers object or modify existing one
    const headers = options.headers instanceof Headers
        ? new Headers(options.headers)
        : { ...(options.headers || {}) };

    if (token && token !== 'undefined' && token !== 'null') {
        if (headers instanceof Headers) {
            headers.set('Authorization', `Bearer ${token}`);
        } else {
            headers['Authorization'] = `Bearer ${token}`;
        }
    } else {
        console.warn(`authorizedFetch: No valid token found for ${url}`);
    }

    // Default to application/json for POST/PUT/PATCH if not sending FormData
    const method = (options.method || 'GET').toUpperCase();
    if (['POST', 'PUT', 'PATCH'].includes(method) && options.body && !(options.body instanceof FormData)) {
        if (headers instanceof Headers) {
            if (!headers.has('Content-Type')) {
                headers.set('Content-Type', 'application/json');
            }
        } else {
            if (!headers['Content-Type'] && !headers['content-type']) {
                headers['Content-Type'] = 'application/json';
            }
        }
    }

    return fetch(url, {
        ...options,
        headers,
    });
};
