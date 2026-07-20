// Minimal structured logger. Keeps a single place to later plug in
// pino/winston/Sentry without touching call sites.
const ts = () => new Date().toISOString();

const logger = {
    info: (...args) => console.log(`[${ts()}] INFO`, ...args),
    warn: (...args) => console.warn(`[${ts()}] WARN`, ...args),
    error: (...args) => console.error(`[${ts()}] ERROR`, ...args),
};

export default logger;
