/**
 * frontend/src/pages/SettingsPage.jsx
 * Production merchant settings, policy parameter audit, and webhook configuration view.
 */

import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  ShieldCheck,
  Cpu,
  Webhook,
  Sliders,
  CheckCircle2,
  Lock,
  Server,
  Sparkles,
  Info
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Badge, RoleBadge, ExecutionModeBadge } from '../components/ui/Badge';

export default function SettingsPage() {
  const { user } = useAuth();

  const policyRules = [
    { label: 'Max Recovery Retries', value: '3 Attempts', desc: 'Hard stop upon reaching limit' },
    { label: 'High-Value Escalation Threshold', value: '₹10,000.00 (1,000,000 paise)', desc: 'Routes directly to human reviewer queue' },
    { label: 'Recovery Expiry Window', value: '168 Hours (7 Days)', desc: 'Cases older than 7 days close automatically' },
    { label: 'Min AI Auto Confidence', value: '70% (0.70)', desc: 'Lower confidence requires operator authorization' },
    { label: 'Min ML Auto Probability', value: '70% (0.70)', desc: 'Low probability requires operator authorization' },
    { label: 'Max Customer Actions / Day', value: '2 Actions', desc: 'Prevents customer fatigue and spam' }
  ];

  const safetyGuarantees = [
    { title: 'AI Advisory Isolation', desc: 'LLM outputs are strictly advisory. Zero financial execution permissions.' },
    { title: 'Paise Integer Representation', desc: 'All money is computed as integer paise internally to prevent rounding errors.' },
    { title: 'Multi-Tenant Isolation', desc: 'All database queries are scoped to authenticated merchant JWT credentials.' },
    { title: 'Immutable Audit Timeline', desc: 'Every state change and reviewer note produces a non-rewritable audit log.' }
  ];

  return (
    <div className="space-y-space-8 animate-fade-in">
      {/* Header Banner */}
      <div className="bg-theme-surface border border-theme-border-subtle p-space-6 rounded-radius-lg shadow-theme-sm flex flex-col md:flex-row md:items-center justify-between gap-space-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <h2 className="text-h1 text-theme-primary tracking-tight">Merchant & Policy Configuration</h2>
            <Badge variant="neutral">Read-Only Audit</Badge>
          </div>
          <p className="text-body-sm text-theme-muted max-w-2xl mt-1 leading-relaxed">
            Inspection view for active financial policy rules, cryptographic webhook credentials, and merchant isolation settings.
          </p>
        </div>

        <div className="flex items-center space-x-2 bg-theme-surface px-space-4 py-space-2 rounded-radius-sm border border-palette-surface-alt text-caption font-mono">
          <Server className="w-4 h-4 text-palette-ink" />
          <span className="text-theme-muted">Policy Engine:</span>
          <strong className="text-palette-ink">v1.0-deterministic</strong>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-space-6">
        {/* Merchant Account & Auth Profile */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-5 h-5 text-palette-ink" />
              <CardTitle>Merchant Profile & Credentials</CardTitle>
            </div>
            <ExecutionModeBadge mode="MOCK_DEMO" />
          </CardHeader>
          <CardContent className="space-y-space-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-4 text-body-sm">
              <div className="bg-theme-surface p-space-3 rounded-radius-md border border-theme-border-subtle">
                <span className="text-caption text-theme-muted font-semibold">Merchant Tenant ID</span>
                <p className="font-mono font-bold text-theme-primary mt-0.5">{user?.merchantId || 'merch_demo'}</p>
              </div>

              <div className="bg-theme-surface p-space-3 rounded-radius-md border border-theme-border-subtle">
                <span className="text-caption text-theme-muted font-semibold">User Role</span>
                <div className="mt-1">
                  <RoleBadge role={user?.role || 'merchant_admin'} />
                </div>
              </div>

              <div className="bg-theme-surface p-space-3 rounded-radius-md border border-theme-border-subtle">
                <span className="text-caption text-theme-muted font-semibold">Account Email</span>
                <p className="font-mono font-medium text-theme-primary mt-0.5">{user?.email || 'admin@merchant.internal'}</p>
              </div>

              <div className="bg-theme-surface p-space-3 rounded-radius-md border border-theme-border-subtle">
                <span className="text-caption text-theme-muted font-semibold">Session Status</span>
                <div className="flex items-center space-x-1.5 text-palette-ink font-bold mt-0.5">
                  <CheckCircle2 className="w-4 h-4 text-badge-success-text" />
                  <span>Authenticated via Bearer JWT</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Webhook & Ingestion Pipeline */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Webhook className="w-5 h-5 text-palette-ink" />
              <CardTitle>Razorpay Webhook Endpoint</CardTitle>
            </div>
            <Badge variant="success" dot>Active</Badge>
          </CardHeader>
          <CardContent className="space-y-space-4 text-body-sm">
            <div className="space-y-space-2">
              <span className="text-caption text-theme-muted font-semibold">Target Ingestion URL</span>
              <div className="p-space-3 rounded-radius-md bg-theme-surface border border-theme-border-subtle font-mono text-body-sm text-theme-primary flex items-center justify-between">
                <span>POST /api/webhooks/razorpay</span>
                <span className="text-caption text-theme-muted font-sans font-bold">HMAC-SHA256</span>
              </div>
            </div>

            <div className="space-y-space-2">
              <span className="text-caption text-theme-muted font-semibold">Subscribed Events</span>
              <div className="flex flex-wrap gap-1.5">
                {['payment.failed', 'payment.captured', 'order.paid'].map((ev) => (
                  <span key={ev} className="px-space-2 py-1 rounded-radius-sm bg-palette-mint text-palette-ink font-mono text-caption font-bold">
                    {ev}
                  </span>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Deterministic Policy Rules Parameters Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Sliders className="w-5 h-5 text-palette-ink" />
            <div>
              <CardTitle>Deterministic Policy Engine Guardrails</CardTitle>
              <CardDescription>Strict 15-rule hierarchy enforced prior to any queuing or recovery action</CardDescription>
            </div>
          </div>
          <Badge variant="primary">15 Rules</Badge>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-4">
            {policyRules.map((r, i) => (
              <div key={i} className="p-space-4 rounded-radius-md bg-theme-surface border border-theme-border-subtle space-y-1">
                <span className="text-caption text-theme-muted font-semibold">{r.label}</span>
                <p className="text-body font-bold text-theme-primary font-mono">{r.value}</p>
                <p className="text-caption text-theme-muted">{r.desc}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Responsible FinTech Safety Architecture */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-palette-ink" />
            <div>
              <CardTitle>FinTech Architecture & Safety Principles</CardTitle>
              <CardDescription>Core non-negotiable guarantees built into RazorRecover</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-4">
            {safetyGuarantees.map((g, i) => (
              <div key={i} className="flex items-start space-x-3 p-space-4 rounded-radius-md bg-theme-surface border border-theme-border-subtle">
                <div className="p-1 rounded-radius-sm bg-palette-mint text-palette-ink mt-0.5">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-body-sm font-semibold text-theme-primary">{g.title}</h4>
                  <p className="text-caption text-theme-muted leading-relaxed mt-0.5">{g.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
