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

    if (token) {
        if (headers instanceof Headers) {
            headers.set('Authorization', `Bearer ${token}`);
        } else {
            headers['Authorization'] = `Bearer ${token}`;
        }
    }

    return fetch(url, {
        ...options,
        headers,
    });
};
