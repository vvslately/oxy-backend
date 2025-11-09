import { TWAngpao } from '@pichxyaponn/tw-angpao';
import { Elysia } from 'elysia';

/**
 * Redeem TrueWallet angpao voucher
 * @param {string} phoneNumber - Thai phone number (e.g., "0881234567")
 * @param {string} voucherCode - Voucher code from TrueWallet link
 * @returns {Promise<Object>} Response with status and data
 */
export async function redeemAngpao(phoneNumber, voucherCode) {
  try {
    // Create Elysia app with TWAngpao plugin
    const app = new Elysia()
      .use(TWAngpao('TWA'))
      .get('/_redeem', async ({ TWA }) => {
        if (!TWA) {
          throw new Error('TWA instance not available');
        }
        const result = await TWA.redeem(phoneNumber, voucherCode);
        return result;
      });

    // Use fetch if available, otherwise use handle
    let response;
    if (typeof app.fetch === 'function') {
      // Use fetch method (newer Elysia versions)
      response = await app.fetch(new Request('http://localhost/_redeem', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      }));
    } else {
      // Fallback to handle method
      response = await app.handle(new Request('http://localhost/_redeem', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      }));
    }

    // Elysia returns a Response object, parse it
    if (response instanceof Response) {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        return data;
      } else {
        const text = await response.text();
        // Try to parse as JSON
        try {
          return JSON.parse(text);
        } catch {
          throw new Error(`Unexpected response format: ${text}`);
        }
      }
    }

    // If it's not a Response, return as-is (might be the data directly)
    return response;
  } catch (error) {
    console.error('Error in redeemAngpao:', error);
    throw error;
  }
}

export default { redeemAngpao };