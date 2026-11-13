#!/usr/bin/env node
/**
 * Windrose Paperclip Unblock Helper
 * Resolves execution blockers, recovery actions and resumes stuck issues.
 *
 * Usage:
 *   node scripts/paperclip-unblock.mjs [--issue=<idOrIdentifier>] [--comment="..."]
 *   node scripts/paperclip-unblock.mjs --status
 */

const rawApiUrl = process.env.PAPERCLIP_API_URL || 'http://127.0.0.1:3100/api';
const PAPERCLIP_API = rawApiUrl.endsWith('/api') ? rawApiUrl : `${rawApiUrl.replace(/\/$/, '')}/api`;
const COMPANY_ID = '7cc4de9e-1eb0-44ea-8d5b-43d3d0d91655';
const PROJECT_ID = '7e340278-e6dd-4fcd-b1e5-578d569e1d12';

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

const getWindroseIssues = async () => {
  const all = await api(`/companies/${COMPANY_ID}/issues`);
  return all.filter((i) => i.projectId === PROJECT_ID);
};

const parseFlags = (args) => {
  const flags = {};
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--status') flags.statusOnly = true;
    else if (arg.startsWith('--issue=')) flags.issue = arg.slice('--issue='.length);
    else if (arg === '--issue' && args[i + 1]) flags.issue = args[++i];
    else if (arg.startsWith('--comment=')) flags.comment = arg.slice('--comment='.length);
    else if (arg === '--comment' && args[i + 1]) flags.comment = args[++i];
  }
  return flags;
};

const resolveBlocker = async (issue, comment) => {
  const resolutionNote = comment || 'Bloqueio de execução resolvido via script paperclip-unblock.';
  let recovered = false;

  // 1. Try recovery-actions/resolve if available
  try {
    await api(`/issues/${issue.id}/recovery-actions/resolve`, {
      method: 'POST',
      body: JSON.stringify({ resolutionNote }),
    });
    console.log(`✅ Recovery action resolvida com sucesso para ${issue.identifier}`);
    recovered = true;
  } catch {
    // endpoint may not be active if no explicit recovery action is pending
  }

  // 2. Clear execution blocker and reset status to todo if blocked
  const updatePayload = {};
  if (issue.executionBlocker) {
    updatePayload.executionBlocker = null;
  }
  if (issue.status === 'blocked') {
    updatePayload.status = 'todo';
  }

  if (Object.keys(updatePayload).length > 0) {
    await api(`/issues/${issue.id}`, {
      method: 'PATCH',
      body: JSON.stringify(updatePayload),
    });
    console.log(`✅ Status/ExecutionBlocker atualizado para ${issue.identifier}:`, updatePayload);
    recovered = true;
  }

  // 3. Post audit comment
  await api(`/issues/${issue.id}/comments`, {
    method: 'POST',
    body: JSON.stringify({
      body: `**Desbloqueio de Execução**\n\n${resolutionNote}`,
    }),
  });

  return recovered;
};

const main = async () => {
  const flags = parseFlags(process.argv.slice(2));
  const issues = await getWindroseIssues();

  console.log(`\nWindrose Unblock Tool (Project: ${PROJECT_ID})`);
  console.log('='.repeat(60));

  const blockedIssues = issues.filter(
    (i) => i.executionBlocker || i.status === 'blocked'
  );

  if (flags.statusOnly) {
    if (blockedIssues.length === 0) {
      console.log('Nenhum card com executionBlocker ou status=blocked no momento. Tudo limpo! ✅');
    } else {
      console.log(`Encontrados ${blockedIssues.length} card(s) bloqueado(s):`);
      for (const i of blockedIssues) {
        console.log(`  - ${i.identifier} [${i.status}]: ${i.title} (Blocker: ${JSON.stringify(i.executionBlocker)})`);
      }
    }
    return;
  }

  let targets = [];
  if (flags.issue) {
    const target = issues.find(
      (i) => i.id === flags.issue || i.identifier?.toUpperCase() === flags.issue.toUpperCase()
    );
    if (!target) {
      throw new Error(`Issue "${flags.issue}" não encontrada no projeto Windrose.`);
    }
    targets = [target];
  } else {
    targets = blockedIssues;
  }

  if (targets.length === 0) {
    console.log('Nenhuma issue bloqueada para destravar.');
    return;
  }

  for (const t of targets) {
    console.log(`Desbloqueando ${t.identifier}...`);
    await resolveBlocker(t, flags.comment);
  }

  console.log('Desbloqueio concluído com sucesso.');
};

main().catch((err) => {
  console.error('❌ paperclip-unblock error:', err.message || err);
  process.exit(1);
});
