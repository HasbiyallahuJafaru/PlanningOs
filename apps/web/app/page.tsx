const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

/**
 * Home page — Batch 1.1 scaffold placeholder.
 *
 * Confirms the web app boots. The real Phase 1 UI (upload flow, project list,
 * extracted fields, missing items, summary) is built in Batch 1.6 against the
 * design system. No business UI here yet, per the scope fence.
 */
export default function Page() {
  return (
    <main>
      <h1>PlanningOS</h1>
      <p>UK planning and permitting operations platform — web app scaffold.</p>
      <p>
        API health check:{' '}
        <a href={`${API_URL}/health`}>{API_URL}/health</a>
      </p>
    </main>
  );
}
