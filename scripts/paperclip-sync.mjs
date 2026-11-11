#!/usr/bin/env node
/**
 * Windrose GitHub <-> Paperclip Bridge
 * Commands:
 *   node scripts/paperclip-sync.mjs status
 *   node scripts/paperclip-sync.mjs board
 *   node scripts/paperclip-sync.mjs sync
 *   node scripts/paperclip-sync.mjs dispatch [--issue=<num>] [--force]
 *   node scripts/paperclip-sync.mjs close [--issue=<num>] [--dispatch-next] [--message="..."]
 */

import { execSync } from 'node:child_process';

const GITHUB_REPO = 'leozizz/windrose-app';
const PAPERCLIP_API = process.env.PAPERCLIP_API_URL || 'http://127.0.0.1:3100/api';
const COMPANY_ID = '7cc4de9e-1eb0-44ea-8d5b-43d3d0d91655';
const PROJECT_ID = '7e340278-e6dd-4fcd-b1e5-578d569e1d12';

const AGENTS = {
  pm: 'eaa2fe83-dd33-4c4c-87f9-206ba5723563',
  'tech-lead': '18c40f15-f125-46ce-85ef-eef9c8cbc50c',
  backend: 'a20cf7aa-bb12-4453-be23-82795e74f0c7',
  frontend: 'c2fbe0d3-2ed0-42e9-8d7f-34efae769f19',
  'ux-reviewer': '059aa595-6618-420f-a784-0dc74923229e',
  qa: '08ece889-b8c0-4763-9da7-05af3b3fff29',
  devops: '5ab20574-3ab4-4aed-a638-af0ec0ee6981',
};

const AGENT_LABELS = {
  [AGENTS.pm]: 'Windrose | PM',
  [AGENTS['tech-lead']]: 'Windrose | Tech Lead',
  [AGENTS.backend]: 'Windrose | Backend',
  [AGENTS.frontend]: 'Windrose | Frontend',
  [AGENTS['ux-reviewer']]: 'Windrose | UX Reviewer',
  [AGENTS.qa]: 'Windrose | QA',
  [AGENTS.devops]: 'Windrose | DevOps',
};

function resolveGitHubToken() {
  if (process.env.GITHUB_TOKEN) return process.env.GITHUB_TOKEN;
  if (process.env.GH_TOKEN) return process.env.GH_TOKEN;
  try {
    const token = execSync('gh auth token', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    return token || null;
  } catch {
    return null;
  }
}

async function githubFetch(path, options = {}, requireAuth = false) {
  const token = resolveGitHubToken();
  if (requireAuth && !token) {
    return null;
  }
  const headers = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'windrose-paperclip-bridge',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };
  const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}${path}`, {
    ...options,
    headers,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub ${options.method || 'GET'} ${path} -> HTTP ${res.status}: ${text}`);
  }
  return res.json();
}

async function paperclipFetch(path, options = {}) {
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
    throw new Error(`Paperclip ${options.method || 'GET'} ${path} -> HTTP ${res.status}: ${typeof data === 'string' ? data : JSON.stringify(data)}`);
  }
  return data;
}

async function getWindroseIssues() {
  const all = await paperclipFetch(`/companies/${COMPANY_ID}/issues`);
  return all.filter((i) => i.projectId === PROJECT_ID);
}

async function getOpenGitHubIssues() {
  const items = await githubFetch('/issues?state=open&per_page=100');
  return items
    .filter((i) => !i.pull_request)
    .sort((a, b) => a.number - b.number);
}

function extractGitHubNumber(paperclipIssue) {
  const match = paperclipIssue.title?.match(/^\[#(\d+)\]/);
  return match ? Number(match[1]) : null;
}

function inferPriority(ghIssue) {
  const labels = (ghIssue.labels || []).map((l) => l.name.toLowerCase());
  if (labels.some((l) => l.includes('critical') || l.includes('urgent') || l.includes('p0'))) return 'critical';
  if (labels.some((l) => l.includes('high') || l.includes('p1') || l.includes('bug'))) return 'high';
  if (labels.some((l) => l.includes('low') || l.includes('p3'))) return 'low';
  return 'medium';
}

function buildWorkflowPrompt(ghIssue) {
  const labels = (ghIssue.labels || []).map((l) => `\`${l.name}\``).join(', ') || 'nenhuma';
  return `## GitHub Issue #${ghIssue.number}: ${ghIssue.title}
- **URL:** ${ghIssue.html_url}
- **Labels:** ${labels}

### Escopo Original
${ghIssue.body || '_Sem descrição detalhada na issue original._'}

---

## Fluxo Autônomo de 7 Etapas (Windrose SDD + Anti-Slop UX Gate)
Cada agente deve atuar estritamente dentro do seu escopo isolado (\`.agents/<persona>/\`) e avançar o card via \`pnpm task:handoff\`:

1. **PM** (\`Windrose | PM\` — \`${AGENTS.pm}\`)
   - Refinar especificação funcional e critérios de aceite em \`specs/\`.
   - Handoff: \`pnpm task:handoff tech-lead "Spec e critérios de aceite prontos para #${ghIssue.number}."\`
2. **Tech Lead** (\`Windrose | Tech Lead\` — \`${AGENTS['tech-lead']}\`)
   - Definir contratos TypeScript/Zod, arquitetura em \`apps/web\`, \`apps/edge-api\`, \`libs/\` e plano técnico.
   - Handoff: \`pnpm task:handoff backend "..."\` (ou \`frontend\` se não houver API).
3. **Backend** (\`Windrose | Backend\` — \`${AGENTS.backend}\`)
   - Implementar endpoints Hono / Cloudflare Workers em \`apps/edge-api\` + testes Vitest.
   - Handoff: \`pnpm task:handoff frontend "..."\`
4. **Frontend** (\`Windrose | Frontend\` — \`${AGENTS.frontend}\`)
   - Implementar UI React 19 + Design System Windrose Wanderlust (\`#fbfbf9\` / \`#f97316\`), respeitando \`unslop\` e \`unslop-copy\`.
   - Handoff: \`pnpm task:handoff ux-reviewer "..."\`
5. **UX Reviewer** (\`Windrose | UX Reviewer\` — \`${AGENTS['ux-reviewer']}\`)
   - Gate visual Anti-Slop obrigatório via Playwright MCP / \`playwright-cli\` (\`ui-visual-critic\`, \`ui-visual-qa\`) em desktop e mobile antes do QA.
   - Se reprovar UI: \`pnpm task:handoff frontend "Ajustes visuais solicitados..."\`
   - Se aprovar UI: \`pnpm task:handoff qa "Gate visual Anti-Slop aprovado..."\`
6. **QA** (\`Windrose | QA\` — \`${AGENTS.qa}\`)
   - Executar \`pnpm lint\`, \`pnpm test\`, \`pnpm build\`, \`pnpm build:edge\`, Playwright E2E, WCAG AA e \`pnpm standards:review\`.
   - Se aprovar: \`pnpm task:handoff devops "Todos os testes, build e standards:review aprovados."\`
7. **DevOps** (\`Windrose | DevOps\` — \`${AGENTS.devops}\`)
   - Verificar pipeline Cloudflare Pages/Workers, preparar release/merge e encerrar ciclo com \`pnpm sync:close --dispatch-next\`.`;
}

function parseFlags(args) {
  const flags = { commands: [] };
  for (const arg of args) {
    if (arg === '--force') flags.force = true;
    else if (arg === '--status' || arg === 'status') flags.commands.push('status');
    else if (arg === '--board' || arg === 'board') flags.commands.push('board');
    else if (arg === '--sync' || arg === 'sync') flags.commands.push('sync');
    else if (arg === '--dispatch' || arg === 'dispatch' || arg === '--dispatch-next') {
      flags.dispatchNext = true;
      flags.commands.push('dispatch');
    } else if (arg === '--close' || arg === 'close' || arg === '--close-current') {
      flags.commands.push('close');
    } else if (arg.startsWith('--issue=')) flags.issue = Number(arg.slice('--issue='.length));
    else if (arg.startsWith('--message=')) flags.message = arg.slice('--message='.length);
  }
  return flags;
}

async function cmdStatus() {
  const [ghIssues, pcIssues] = await Promise.all([getOpenGitHubIssues(), getWindroseIssues()]);
  const syncedByNum = new Map();
  for (const issue of pcIssues) {
    const num = extractGitHubNumber(issue);
    if (num !== null) syncedByNum.set(num, issue);
  }

  console.log(`\nWindrose Sync Status (GitHub: ${GITHUB_REPO} | Paperclip Project: ${PROJECT_ID})`);
  console.log('='.repeat(78));
  console.log(`GitHub open issues: ${ghIssues.length} | Paperclip Windrose issues: ${pcIssues.length}\n`);

  for (const gh of ghIssues) {
    const pc = syncedByNum.get(gh.number);
    const state = pc
      ? `${pc.identifier} [${pc.status}] -> ${AGENT_LABELS[pc.assigneeAgentId] || 'Unassigned'}`
      : 'PENDING SYNC';
    console.log(`#${gh.number} ${gh.title}`);
    console.log(`   Paperclip: ${state}`);
  }
}

async function cmdBoard() {
  const pcIssues = await getWindroseIssues();
  console.log(`\nWindrose Paperclip Board (${pcIssues.length} issues)`);
  console.log('='.repeat(78));
  if (pcIssues.length === 0) {
    console.log('No issues in Windrose project yet. Run `pnpm sync:board` or `pnpm sync:dispatch`.');
    return;
  }

  const order = ['in_progress', 'todo', 'in_review', 'blocked', 'backlog', 'done', 'cancelled'];
  for (const status of order) {
    const group = pcIssues.filter((i) => i.status === status);
    if (group.length === 0) continue;
    console.log(`\n[${status.toUpperCase()}] (${group.length})`);
    for (const issue of group) {
      const owner = AGENT_LABELS[issue.assigneeAgentId] || 'Unassigned';
      console.log(`  - ${issue.identifier} (${issue.priority || 'medium'}) -> ${owner}: ${issue.title}`);
    }
  }
}

async function createOrPromotePaperclipIssue(ghIssue, assignToPm) {
  const payload = {
    title: `[#${ghIssue.number}] ${ghIssue.title}`,
    description: buildWorkflowPrompt(ghIssue),
    status: assignToPm ? 'todo' : 'backlog',
    priority: inferPriority(ghIssue),
    projectId: PROJECT_ID,
    assigneeAgentId: assignToPm ? AGENTS.pm : null,
  };
  return paperclipFetch(`/companies/${COMPANY_ID}/issues`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

async function cmdSync() {
  const [ghIssues, pcIssues] = await Promise.all([getOpenGitHubIssues(), getWindroseIssues()]);
  const existingNums = new Set(pcIssues.map(extractGitHubNumber).filter((n) => n !== null));

  let created = 0;
  for (const gh of ghIssues) {
    if (existingNums.has(gh.number)) continue;
    const pc = await createOrPromotePaperclipIssue(gh, false);
    console.log(`Created backlog issue ${pc.identifier} for GitHub #${gh.number}: ${gh.title}`);
    created += 1;
  }
  console.log(`Sync complete. Created ${created} new Paperclip backlog issue(s).`);
}

async function cmdDispatch(flags) {
  const [ghIssues, pcIssues] = await Promise.all([getOpenGitHubIssues(), getWindroseIssues()]);

  const active = pcIssues.filter((i) => i.status === 'in_progress' || i.status === 'todo');
  if (active.length > 0 && !flags.force) {
    console.log('Active Windrose issue already in progress/todo (use --force to dispatch another):');
    for (const i of active) {
      console.log(`  - ${i.identifier} [${i.status}] -> ${AGENT_LABELS[i.assigneeAgentId] || 'Unassigned'}: ${i.title}`);
    }
    return null;
  }

  let targetGh = null;
  if (flags.issue) {
    targetGh = ghIssues.find((g) => g.number === flags.issue);
    if (!targetGh) {
      throw new Error(`Open GitHub issue #${flags.issue} not found in ${GITHUB_REPO}.`);
    }
  } else {
    const doneOrActiveNums = new Set(
      pcIssues
        .filter((i) => i.status !== 'backlog')
        .map(extractGitHubNumber)
        .filter((n) => n !== null)
    );
    targetGh = ghIssues.find((g) => !doneOrActiveNums.has(g.number));
  }

  if (!targetGh) {
    console.log('No pending GitHub issues left to dispatch.');
    return null;
  }

  const existingBacklog = pcIssues.find(
    (i) => extractGitHubNumber(i) === targetGh.number && i.status === 'backlog'
  );

  let dispatched;
  if (existingBacklog) {
    dispatched = await paperclipFetch(`/issues/${existingBacklog.id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        status: 'todo',
        assigneeAgentId: AGENTS.pm,
      }),
    });
  } else {
    dispatched = await createOrPromotePaperclipIssue(targetGh, true);
  }

  console.log(`Dispatched ${dispatched.identifier} (#${targetGh.number}: ${targetGh.title}) -> Windrose | PM`);
  return dispatched;
}

async function cmdClose(flags) {
  const pcIssues = await getWindroseIssues();
  let targetPc;
  if (flags.issue) {
    targetPc = pcIssues.find((i) => extractGitHubNumber(i) === flags.issue);
  } else {
    const active = pcIssues.filter((i) => i.status === 'in_progress' || i.status === 'todo' || i.status === 'in_review');
    if (active.length === 1) targetPc = active[0];
    else if (active.length > 1) {
      throw new Error('Multiple active issues found. Pass --issue=<githubIssueNumber>.');
    }
  }

  if (!targetPc) {
    throw new Error('No matching active Windrose issue found to close.');
  }

  const note = flags.message || 'Pipeline Windrose de 7 etapas concluído e validado com sucesso.';
  await paperclipFetch(`/issues/${targetPc.id}/comments`, {
    method: 'POST',
    body: JSON.stringify({ body: `**Ciclo Encerrado**\n\n${note}` }),
  });
  await paperclipFetch(`/issues/${targetPc.id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'done' }),
  });
  console.log(`Closed Paperclip issue ${targetPc.identifier} -> done`);

  const ghNumber = extractGitHubNumber(targetPc);
  if (ghNumber !== null) {
    const token = resolveGitHubToken();
    if (token) {
      await githubFetch(`/issues/${ghNumber}/comments`, {
        method: 'POST',
        body: JSON.stringify({ body: `Concluído via esteira Paperclip (${targetPc.identifier}).\n\n${note}` }),
      }, true);
      await githubFetch(`/issues/${ghNumber}`, {
        method: 'PATCH',
        body: JSON.stringify({ state: 'closed' }),
      }, true);
      console.log(`Closed GitHub issue #${ghNumber}`);
    } else {
      console.log(`Note: GITHUB_TOKEN / gh CLI auth not detected; skipped closing GitHub issue #${ghNumber}.`);
    }
  }

  if (flags.dispatchNext) {
    await cmdDispatch({ force: false });
  }
}

async function main() {
  const args = process.argv.slice(2);
  const flags = parseFlags(args);
  const command = flags.commands.includes('close')
    ? 'close'
    : flags.commands[0];

  switch (command) {
    case 'status':
      await cmdStatus();
      break;
    case 'board':
      await cmdBoard();
      break;
    case 'sync':
      await cmdSync();
      break;
    case 'dispatch':
      await cmdDispatch(flags);
      break;
    case 'close':
      await cmdClose(flags);
      break;
    default:
      console.log(`
Windrose GitHub <-> Paperclip Bridge
Usage:
  node scripts/paperclip-sync.mjs --status | status
  node scripts/paperclip-sync.mjs --board | board
  node scripts/paperclip-sync.mjs --sync | sync
  node scripts/paperclip-sync.mjs --dispatch-next | dispatch [--issue=<num>] [--force]
  node scripts/paperclip-sync.mjs --close-current | close [--issue=<num>] [--dispatch-next] [--message="..."]
`);
  }
}

main().catch((err) => {
  console.error('❌ paperclip-sync error:', err.message || err);
  process.exit(1);
});
