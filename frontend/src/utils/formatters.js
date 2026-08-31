/**
 * frontend/src/utils/formatters.js
 * Currency, date, and badge formatting utilities.
 * Crucial: Internal money is in paise; formatted strictly in INR (₹) at UI presentation layer.
 */

export function formatCurrency(paise = 0) {
  const rupees = Number(paise) / 100;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2
  }).format(rupees);
}

export function formatDate(dateString) {
  if (!dateString) return '—';
  const d = new Date(dateString);
  return d.toLocaleString('en-IN', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function getStatusBadge(status) {
  const map = {
    detected: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20', label: 'Detected' },
    analyzing: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20', label: 'Analyzing' },
    recommended: { bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/20', label: 'Recommended' },
    pending_approval: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20', label: 'Pending Approval' },
    approved: { bg: 'bg-teal-500/10', text: 'text-teal-400', border: 'border-teal-500/20', label: 'Approved' },
    scheduled: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/20', label: 'Scheduled' },
    executing: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20', label: 'Executing' },
    recovered: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', label: 'Recovered' },
    stopped: { bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/20', label: 'Stopped' },
    failed: { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/20', label: 'Failed' },
    expired: { bg: 'bg-zinc-500/10', text: 'text-zinc-400', border: 'border-zinc-500/20', label: 'Expired' }
  };

  return map[status] || { bg: 'bg-slate-800', text: 'text-slate-300', border: 'border-slate-700', label: status };
}

export function getRiskBadge(riskLevel) {
  const map = {
    low: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', label: 'LOW RISK' },
    medium: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20', label: 'MEDIUM RISK' },
    high: { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/20', label: 'HIGH RISK' }
  };
  return map[riskLevel] || { bg: 'bg-slate-800', text: 'text-slate-300', border: 'border-slate-700', label: riskLevel };
}
