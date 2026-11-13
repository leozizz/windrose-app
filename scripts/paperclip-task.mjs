#!/usr/bin/env node
/**
 * Windrose Paperclip Task Helper
 * Supports both flag-based and positional arguments:
 *
 * Flag style (recommended in AGENTS.md):
 *   node scripts/paperclip-task.mjs --assign <role> --comment "<message>" [--issue <id>]
 *   node scripts/paperclip-task.mjs handoff --assign <role> --comment "<message>" [--issue <id>]
 *   node scripts/paperclip-task.mjs --status <status> [--comment "<message>"] [--issue <id>]
 *   node scripts/paperclip-task.mjs --comment "<message>" [--issue <id>]
 *
 * Positional style:
 *   node scripts/paperclip-task.mjs handoff <role> "<message>" [issueId]
 *   node scripts/paperclip-task.mjs <role> "<message>" [issueId]
 *   node scripts/paperclip-task.mjs status <status> "<message>" [issueId]
 *   node scripts/paperclip-task.mjs comment "<message>" [issueId]
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

const api = async (path, options = {}) => {
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
};

const resolveWindroseIssue = async (explicitRef) => {
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
};

const resolveAgentKey = (raw) => {
  const normalized = (raw || '').toLowerCase().trim();
  const key = ALIASES[normalized] || normalized;
  if (!AGENTS[key]) {
    throw new Error(`Unknown agent "${raw}". Valid keys: ${Object.keys(AGENTS).join(', ')}`);
  }
  return { key, id: AGENTS[key] };
};

const postComment = async (issueId, body) => {
  return api(`/issues/${issueId}/comments`, {
    method: 'POST',
    body: JSON.stringify({ body }),
  });
};

const parseArgs = (args) => {
  const parsed = {
    command: null,
    assign: null,
    comment: null,
    status: null,
    issue: null,
    positionals: [],
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--assign' && args[i + 1]) {
      parsed.assign = args[++i];
    } else if (arg.startsWith('--assign=')) {
      parsed.assign = arg.slice('--assign='.length);
    } else if (arg === '--comment' && args[i + 1]) {
      parsed.comment = args[++i];
    } else if (arg.startsWith('--comment=')) {
      parsed.comment = arg.slice('--comment='.length);
    } else if (arg === '--status' && args[i + 1]) {
      parsed.status = args[++i];
    } else if (arg.startsWith('--status=')) {
      parsed.status = arg.slice('--status='.length);
    } else if (arg === '--issue' && args[i + 1]) {
      parsed.issue = args[++i];
    } else if (arg.startsWith('--issue=')) {
      parsed.issue = arg.slice('--issue='.length);
    } else if (arg.startsWith('--')) {
      // ignore unknown flag
    } else {
      parsed.positionals.push(arg);
    }
  }

  return parsed;
};

const main = async () => {
  const rawArgs = process.argv.slice(2);
  if (rawArgs.length === 0 || rawArgs.includes('--help') || rawArgs.includes('-h')) {
    console.log(`
Windrose Paperclip Task Helper

Usage (Flags - Recommended in AGENTS.md):
  node scripts/paperclip-task.mjs --assign <role> --comment "<message>" [--issue <id>]
  node scripts/paperclip-task.mjs --status <status> [--comment "<message>"] [--issue <id>]
  node scripts/paperclip-task.mjs --comment "<message>" [--issue <id>]

Usage (Positional):
  node scripts/paperclip-task.mjs handoff <role> "<message>" [issueId]
  node scripts/paperclip-task.mjs <role> "<message>" [issueId]
  node scripts/paperclip-task.mjs status <status> "<message>" [issueId]
  node scripts/paperclip-task.mjs comment "<message>" [issueId]

Agents: ${Object.keys(AGENTS).join(', ')}
Valid Statuses: backlog, todo, in_progress, in_review, blocked, done, cancelled
`);
    return;
  }

  const parsed = parseArgs(rawArgs);

  // 1. Flag-driven handoff (--assign <role>)
  if (parsed.assign) {
    const message = parsed.comment || 'Handoff via task runner';
    const target = resolveAgentKey(parsed.assign);
    const issue = await resolveWindroseIssue(parsed.issue);

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

  // 2. Flag-driven status update (--status <status>)
  if (parsed.status) {
    const valid = ['backlog', 'todo', 'in_progress', 'in_review', 'blocked', 'done', 'cancelled'];
    if (!valid.includes(parsed.status)) {
      throw new Error(`Invalid status "${parsed.status}". Valid: ${valid.join(', ')}`);
    }
    const issue = await resolveWindroseIssue(parsed.issue);
    if (parsed.comment) {
      await postComment(issue.id, `**Status -> ${parsed.status}**\n\n${parsed.comment}`);
    }
    await api(`/issues/${issue.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: parsed.status }),
    });
    console.log(`Updated ${issue.identifier} status -> ${parsed.status}`);
    return;
  }

  // 3. Flag-driven comment only (--comment <message>)
  if (parsed.comment && parsed.positionals.length === 0) {
    const issue = await resolveWindroseIssue(parsed.issue);
    await postComment(issue.id, parsed.comment);
    console.log(`Comment posted on ${issue.identifier}`);
    return;
  }

  // 4. Positional fallback handling
  const first = parsed.positionals[0];
  const normalizedFirst = (first || '').toLowerCase().trim();
  const isShorthandAgent = Boolean(AGENTS[normalizedFirst] || ALIASES[normalizedFirst]);

  if (first === 'handoff' || isShorthandAgent) {
    const rawAgent = isShorthandAgent ? first : parsed.positionals[1];
    const message = isShorthandAgent ? parsed.positionals[1] : parsed.positionals[2];
    const issueRef = parsed.issue || (isShorthandAgent ? parsed.positionals[2] : parsed.positionals[3]);

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

  if (first === 'status') {
    const newStatus = parsed.positionals[1];
    const message = parsed.positionals[2];
    const issueRef = parsed.issue || parsed.positionals[3];
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

  if (first === 'comment') {
    const message = parsed.positionals[1];
    const issueRef = parsed.issue || parsed.positionals[2];
    if (!message) {
      throw new Error('Usage: comment "<message>" [issueIdOrIdentifier]');
    }
    const issue = await resolveWindroseIssue(issueRef);
    await postComment(issue.id, message);
    console.log(`Comment posted on ${issue.identifier}`);
    return;
  }

  throw new Error(`Unknown command or arguments: "${rawArgs.join(' ')}". Run with --help for usage.`);
};

main().catch((err) => {
  console.error('❌ paperclip-task error:', err.message || err);
  process.exit(1);
});
