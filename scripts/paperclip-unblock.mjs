#!/usr/bin/env node
/**
 * Paperclip Task Unblock & Reconciliation Helper (Windrose)
 * Clears execution blockers caused by operator cancellations or machine restarts
 * and smoothly resumes task execution without triggering duplicate on-demand runs.
 *
 * Usage:
 *   pnpm task:unblock
 *   pnpm task:unblock --status
 *   pnpm task:unblock --issue <ISSUE_ID_OR_IDENTIFIER> [--comment="..."]
 */

const API_URL = (process.env.PAPERCLIP_API_URL || 'http://127.0.0.1:3100').replace(/\/+$/, '').replace(/\/api$/, '');
const COMPANY_ID = process.env.PAPERCLIP_COMPANY_ID || '7cc4de9e-1eb0-44ea-8d5b-43d3d0d91655';
const PROJECT_ID = process.env.PAPERCLIP_PROJECT_ID || '7e340278-e6dd-4fcd-b1e5-578d569e1d12';

const parseFlags = (args) => {
  const flags = { statusOnly: false, issueRef: null, comment: null };
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--status') {
      flags.statusOnly = true;
    } else if (arg.startsWith('--issue=')) {
      flags.issueRef = arg.slice('--issue='.length);
    } else if (arg === '--issue' && args[i + 1]) {
      flags.issueRef = args[++i];
    } else if (arg.startsWith('--comment=')) {
      flags.comment = arg.slice('--comment='.length);
    } else if (arg === '--comment' && args[i + 1]) {
      flags.comment = args[++i];
    }
  }
  return flags;
};

const fetchProjectActiveIssues = async () => {
  const listRes = await fetch(`${API_URL}/api/companies/${COMPANY_ID}/issues`);
  if (!listRes.ok) {
    throw new Error(`Falha ao listar issues: ${await listRes.text()}`);
  }
  const issues = await listRes.json();
  return issues.filter(
    (i) => i.projectId === PROJECT_ID && i.status !== 'done' && i.status !== 'cancelled'
  );
};

const fetchIssueDetail = async (issueId) => {
  const res = await fetch(`${API_URL}/api/issues/${issueId}`);
  if (!res.ok) {
    throw new Error(`Falha ao buscar detalhes da issue ${issueId}: ${await res.text()}`);
  }
  return res.json();
};

const resolveTargetIssue = async (issueRef, activeProjectIssues) => {
  if (issueRef) {
    const match = activeProjectIssues.find(
      (i) => i.id === issueRef || i.identifier?.toUpperCase() === issueRef.toUpperCase()
    );
    const targetId = match ? match.id : issueRef;
    return fetchIssueDetail(targetId);
  }

  for (const issue of activeProjectIssues) {
    const detail = await fetchIssueDetail(issue.id);
    if (detail.executionBlocker || detail.status === 'blocked') {
      console.log(`[Unblock Helper] Detectada issue ativa com Execution Blocker: ${detail.identifier} (${detail.title})`);
      return detail;
    }
  }

  return null;
};

const main = async () => {
  const flags = parseFlags(process.argv.slice(2));
  const activeProjectIssues = await fetchProjectActiveIssues();

  if (flags.statusOnly) {
    const blocked = [];
    for (const issue of activeProjectIssues) {
      const detail = await fetchIssueDetail(issue.id);
      if (detail.executionBlocker || detail.status === 'blocked') {
        blocked.push(detail);
      }
    }
    if (blocked.length === 0) {
      console.log('[Unblock Helper] Nenhuma issue ativa com Execution Blocker encontrada no projeto Windrose.');
    } else {
      console.log(`[Unblock Helper] Encontrada(s) ${blocked.length} issue(s) bloqueada(s):`);
      for (const item of blocked) {
        console.log(`  - ${item.identifier} [${item.status}]: ${item.title} (Cause: ${item.executionBlocker?.cause || 'blocked'})`);
      }
    }
    return;
  }

  const issue = await resolveTargetIssue(flags.issueRef, activeProjectIssues);

  if (!issue) {
    console.log('[Unblock Helper] Nenhuma issue ativa com Execution Blocker encontrada no projeto Windrose.');
    return;
  }

  const blocker = issue.executionBlocker;

  if (!blocker && issue.status !== 'blocked') {
    console.log(`[Unblock Helper] A issue ${issue.identifier} não possui blocker ativo.`);
    return;
  }

  const resolutionNote = flags.comment || 'Desbloqueio manual após verificação do operador.';

  if (blocker) {
    console.log(`[Unblock Helper] Resolvendo blocker na issue ${issue.identifier}...`);
    console.log(`Causa: ${blocker.cause}, Run: ${blocker.runId}`);

    // Se o task owner divergir do agente da run bloqueada, alinhar para reconciliação
    if (blocker.agentId && issue.assigneeAgentId !== blocker.agentId) {
      const assignRes = await fetch(`${API_URL}/api/issues/${issue.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assigneeAgentId: blocker.agentId }),
      });
      if (!assignRes.ok) {
        throw new Error(`Falha ao alinhar assigneeAgentId: HTTP ${assignRes.status} - ${await assignRes.text()}`);
      }
    }

    const payload = {
      actionId: blocker.recoveryActionId || blocker.actionId || undefined,
      outcome: 'restored',
      sourceIssueStatus: 'todo',
      resolutionNote,
      executionReconciliation: blocker.runId
        ? {
            runId: blocker.runId,
            providerStopped: true,
            actionOutcome: 'mixed',
            outcomeEvidence: 'Workspace e integridade dos arquivos verificados pelo operador.',
          }
        : undefined,
    };

    const resolveRes = await fetch(`${API_URL}/api/issues/${issue.id}/recovery-actions/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!resolveRes.ok) {
      console.error(`[Unblock Helper] Falha ao resolver recovery action: HTTP ${resolveRes.status} - ${await resolveRes.text()}`);
      process.exit(1);
    }

    console.log(`[Unblock Helper] Sucesso! Execution Blocker removido da issue ${issue.identifier}.`);
  }

  // Se havia assignee, mover para in_progress para acionar via wakeOnAssignment com o contexto da task
  // Nota: Não chamamos heartbeat/invoke avulso para evitar disparo concorrente duplicado em 'on_demand'.
  const targetAssignee = blocker?.agentId || issue.assigneeAgentId;
  if (targetAssignee) {
    console.log(`[Unblock Helper] Reativando agente ${targetAssignee} via task assignment...`);
    const patchRes = await fetch(`${API_URL}/api/issues/${issue.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'in_progress',
        assigneeAgentId: targetAssignee,
        comment: 'Execução retomada pelo operador.',
      }),
    });

    if (!patchRes.ok) {
      throw new Error(`Falha ao mover issue para in_progress: HTTP ${patchRes.status} - ${await patchRes.text()}`);
    }

    console.log('[Unblock Helper] Tarefa movida para in_progress. Agente acionado via automação com contexto da task.');
  }
};

main().catch((err) => {
  console.error('[Unblock Helper] Erro:', err.message || err);
  process.exit(1);
});
