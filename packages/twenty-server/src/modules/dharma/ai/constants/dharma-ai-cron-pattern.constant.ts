// Run the Dharma AI orchestrator once an hour at minute 5.
// Solo-tenant workload: hourly cadence is enough for AI signal freshness without burning LLM budget.
export const DHARMA_AI_ORCHESTRATOR_CRON_PATTERN = '5 * * * *';
