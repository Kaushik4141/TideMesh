export const NEON_CONNECTION_STRING = "postgresql://neondb_owner:npg_YrKdAzcb5G9v@ep-summer-field-b4mr995l.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require";

/**
 * Neon Serverless HTTP SQL Executor
 * Sends raw SQL queries & parameter bindings directly to Neon Serverless Postgres over HTTPS
 */
export async function executeNeonQuery(sql, params = []) {
  try {
    if (!NEON_CONNECTION_STRING || NEON_CONNECTION_STRING.includes('ep-xyz.neon.tech')) {
      return null;
    }

    const hostMatch = NEON_CONNECTION_STRING.match(/@([^/]+)\//);
    const host = hostMatch ? hostMatch[1] : '';
    if (!host) return null;

    const response = await fetch(`https://${host}/sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Neon-Connection-String': NEON_CONNECTION_STRING,
      },
      body: JSON.stringify({ query: sql, params }),
    });

    if (!response.ok) {
      console.warn('Neon SQL HTTP status:', response.status);
      return null;
    }

    return await response.json();
  } catch (e) {
    console.warn('Neon SQL query exception:', e);
    return null;
  }
}
