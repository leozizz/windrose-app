#!/usr/bin/env node
/**
 * Windrose Paperclip Task Helper
 * Usage:
 *   node scripts/paperclip-task.mjs handoff <pm|tech-lead|backend|frontend|ux-reviewer|qa|devops> "<message>" [issueIdOrIdentifier]
 *   node scripts/paperclip-task.mjs status <todo|in_progress|blocked|done|cancelled> "<message>" [issueIdOrIdentifier]
 *   node scripts/paperclip-task.mjs comment "<message>" [issueIdOrIdentifier]
 */

const rawApiUrl = process.env.PAPERCLIP_API_URL || 'http://127.0.0.1:3100/api';
const PAPERCLIP_API = rawApiUrl.endsWith('/api') ? rawApiUrl : `${rawApiUrl.replace(/\/$/, '')}/api`;
const COMPANY_ID = '7cc4de9e-1eb0-44ea-8d5b-43d3d0d91655';
const PROJECT_ID = '7e340278-e6dd-4fcd-b1e5-578d569e1d12';

export const AGENTS = {
  pm: 'eaa2fe83-dd33-4c4c-87f9-206ba5723563',
  'tech-lead': '18c40f15-f125-46ce-85ef-eef9c8cbc50c',
  backend: 'a20cf7aa-bb12-4453-be23-82795e74f0c7',
  frontend: 'c2fbe0d3-2ed0-42e9-8d7f-34efae769f19',
  'ux-reviewer': '059aa595-6618-420f-a784-0dc74923229e',
  qa: '08ece889-b8c0-4763-9da7-05af3b3fff29',
  devops: '5ab20574-3ab4-4aed-a638-af0ec0ee6981',
};

const ALIASES = {
  tl: 'tech-lead',
  techlead: 'tech-lead',
  be: 'backend',
  fe: 'frontend',
  ux: 'ux-reviewer',
  reviewer: 'ux-reviewer',
  ops: 'devops',
};

async function api(path, options = {}) {
  const res = await fetch(`${PAPERCLIP_API}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  if (!res.ok) {
    throw new Error(`${options.method || 'GET'} ${path} -> HTTP ${res.status}: ${typeof data === 'string' ? data : JSON.stringify(data)}`);
  }
  return data;
}

async function resolveWindroseIssue(explicitRef) {
  const allIssues = await api(`/companies/${COMPANY_ID}/issues`);
  const projectIssues = allIssues.filter((issue) => issue.projectId === PROJECT_ID);

  const ref = explicitRef || process.env.PAPERCLIP_ISSUE_ID;
  if (ref) {
    const match = projectIssues.find(
      (i) => i.id === ref || i.identifier?.toUpperCase() === ref.toUpperCase()
    );
    if (!match) {
      throw new Error(`Issue "${ref}" not found in Windrose project (${PROJECT_ID}).`);
    }
    return match;
  }

  const active = projectIssues.filter((i) => i.status === 'in_progress' || i.status === 'todo');
  if (active.length === 1) {
    return active[0];
  }
  if (active.length === 0) {
    throw new Error('No active (in_progress or todo) issue found in Windrose project. Pass explicit issue ID/identifier.');
  }
  const summary = active.map((i) => `${i.identifier} (${i.status}): ${i.title}`).join('\n  - ');
  throw new Error(`Multiple active Windrose issues found. Specify one explicitly:\n  - ${summary}`);
}

function resolveAgentKey(raw) {
  const normalized = (raw || '').toLowerCase().trim();
  const key = ALIASES[normalized] || normalized;
  if (!AGENTS[key]) {
    throw new Error(`Unknown agent "${raw}". Valid keys: ${Object.keys(AGENTS).join(', ')}`);
  }
  return { key, id: AGENTS[key] };
}

async function postComment(issueId, body) {
  return api(`/issues/${issueId}/comments`, {
    method: 'POST',
    body: JSON.stringify({ body }),
  });
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === '--help' || command === '-h') {
    console.log(`
Windrose Paperclip Task Helper
Commands:
  handoff <agent> "<message>" [issueId]   Pass issue to next persona and set status=todo
  status <status> "<message>" [issueId]   Update issue status (todo|in_progress|blocked|done|cancelled)
  comment "<message>" [issueId]           Add comment to active Windrose issue

Agents: ${Object.keys(AGENTS).join(', ')}
`);
    return;
  }

  const normalizedFirst = command.toLowerCase().trim();
  const isShorthandAgent = Boolean(AGENTS[normalizedFirst] || ALIASES[normalizedFirst]);

  if (command === 'handoff' || isShorthandAgent) {
    const [, a1, a2, a3] = args;
    const rawAgent = isShorthandAgent ? command : a1;
    const message = isShorthandAgent ? a1 : a2;
    const issueRef = isShorthandAgent ? a2 : a3;
    if (!rawAgent || !message) {
      throw new Error('Usage: [handoff] <agent> "<message>" [issueIdOrIdentifier]');
    }
    const target = resolveAgentKey(rawAgent);
    const issue = await resolveWindroseIssue(issueRef);

    await postComment(issue.id, `**Handoff -> ${target.key}**\n\n${message}`);
    await api(`/issues/${issue.id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        status: 'todo',
        assigneeAgentId: target.id,
      }),
    });

    console.log(`Handoff complete: ${issue.identifier} -> Windrose | ${target.key} (${target.id})`);
    return;
  }

  if (command === 'status') {
    const [, newStatus, message, issueRef] = args;
    const valid = ['backlog', 'todo', 'in_progress', 'in_review', 'blocked', 'done', 'cancelled'];
    if (!valid.includes(newStatus)) {
      throw new Error(`Invalid status "${newStatus}". Valid: ${valid.join(', ')}`);
    }
    const issue = await resolveWindroseIssue(issueRef);
    if (message) {
      await postComment(issue.id, `**Status -> ${newStatus}**\n\n${message}`);
    }
    await api(`/issues/${issue.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: newStatus }),
    });
    console.log(`Updated ${issue.identifier} status -> ${newStatus}`);
    return;
  }

  if (command === 'comment') {
    const [, message, issueRef] = args;
    if (!message) {
      throw new Error('Usage: comment "<message>" [issueIdOrIdentifier]');
    }
    const issue = await resolveWindroseIssue(issueRef);
    await postComment(issue.id, message);
    console.log(`Comment posted on ${issue.identifier}`);
    return;
  }

  throw new Error(`Unknown command "${command}". Run with --help for usage.`);
}

main().catch((err) => {
  console.error('❌ paperclip-task error:', err.message || err);
  process.exit(1);
});
