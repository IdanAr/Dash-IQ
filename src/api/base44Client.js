import { createClient } from '@base44/sdk';
// import { getAccessToken } from '@base44/sdk/utils/auth-utils';

// Create a client with authentication required
export const base44 = createClient({
  appId: "67e2f689d68b5aeb23b24f87", 
  requiresAuth: true // Ensure authentication is required for all operations
});
