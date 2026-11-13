import PocketBase from 'pocketbase';
import logger from './logger.js';

const POCKETBASE_HOST = process.env.POCKETBASE_HOST;

if (!POCKETBASE_HOST) {
    throw new Error('POCKETBASE_HOST is required');
}

async function waitForHealth({ retries = 10, delayMs = 1000 } = {}) {
    for (let i = 1; i <= retries; i++) {
        try {
            const response = await fetch(`${POCKETBASE_HOST}/api/health`, { method: 'HEAD' });

            if (response.ok) {
                return;
            }
        } catch {
            // PocketBase not reachable yet; retry below
        }

        logger.warn(`PocketBase not ready, retrying (${i}/${retries})...`);

        await new Promise((r) => setTimeout(r, delayMs));
    }

    throw new Error(`PocketBase health check failed after ${retries} retries`);
}

const pocketbaseClient = new PocketBase(POCKETBASE_HOST);

pocketbaseClient.autoCancellation(false);

let authPromise = null;

async function authenticateSuperuser() {
    if (pocketbaseClient.authStore.isValid) {
        return;
    }

    if (!authPromise) {
        authPromise = pocketbaseClient
            .collection('_superusers')
            .authWithPassword(
                process.env.PB_SUPERUSER_EMAIL,
                process.env.PB_SUPERUSER_PASSWORD,
            )
            .finally(() => {
                authPromise = null;
            });
    }

    await authPromise;
}

pocketbaseClient.beforeSend = async function (url, options) {
    const isSuperuserLogin = url.includes(
        '/api/collections/_superusers/auth-with-password',
    );

    if (!isSuperuserLogin) {
        await authenticateSuperuser();
    }

    if (pocketbaseClient.authStore.isValid && pocketbaseClient.authStore.token) {
        options.headers = options.headers || {};
        options.headers.Authorization = pocketbaseClient.authStore.token;
    }

    return { url, options };
};

(async () => {
    try {
        await waitForHealth();
        await authenticateSuperuser();
        logger.info('PocketBase client initialized successfully');
    } catch (err) {
        logger.error('Failed to initialize PocketBase client:', err);
        process.exit(1);
    }
})();

export default pocketbaseClient;
export { pocketbaseClient };
