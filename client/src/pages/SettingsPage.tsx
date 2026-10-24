import React from 'react';
import { PageHeader, Card, Button } from '@/components/ui';

export const SettingsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings & Preferences"
        subtitle="Manage account preferences, notifications, and AI pathway advisor alerts."
        breadcrumbs={[
          { label: 'Platform', href: '/' },
          { label: 'Account', href: '/dashboard' },
          { label: 'Settings' },
        ]}
      />

      <div className="space-y-6 max-w-3xl">
        <Card className="p-6 space-y-4">
          <h3 className="text-base font-bold text-charcoal">Notification Preferences</h3>
          
          <div className="space-y-3 text-sm">
            <label className="flex items-center justify-between p-3 bg-alternate rounded-md cursor-pointer">
              <div>
                <span className="font-semibold text-charcoal block">Opportunity Deadline Reminders</span>
                <span className="text-xs text-slate-muted">Receive alerts 7 days before application deadlines.</span>
              </div>
              <input type="checkbox" defaultChecked className="rounded text-primary focus:ring-primary w-4 h-4" />
            </label>

            <label className="flex items-center justify-between p-3 bg-alternate rounded-md cursor-pointer">
              <div>
                <span className="font-semibold text-charcoal block">AI Mentor Milestone Digests</span>
                <span className="text-xs text-slate-muted">Weekly summaries of your skill gap progress.</span>
              </div>
              <input type="checkbox" defaultChecked className="rounded text-primary focus:ring-primary w-4 h-4" />
            </label>

            <label className="flex items-center justify-between p-3 bg-alternate rounded-md cursor-pointer">
              <div>
                <span className="font-semibold text-charcoal block">Partner Institution Announcements</span>
                <span className="text-xs text-slate-muted">New fellowship openings and campus visits.</span>
              </div>
              <input type="checkbox" className="rounded text-primary focus:ring-primary w-4 h-4" />
            </label>
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-border-subtle pb-3">
            <div>
              <h3 className="text-base font-bold text-charcoal">Profile Photo & Resume Documents</h3>
              <p className="text-xs text-slate-muted mt-0.5">
                Update your student avatar and professional resume used across the recommendation system.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 pt-1">
            <a href="/profile">
              <Button variant="primary" size="sm" pill>
                Update Resume in Profile →
              </Button>
            </a>
            <a href="/profile">
              <Button variant="outline" size="sm" pill>
                Change Profile Photo
              </Button>
            </a>
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <h3 className="text-base font-bold text-charcoal">Privacy & Verification</h3>
          <p className="text-xs text-slate-muted">
            Control which verified academic badges are visible to partner institutions during initial discovery matching.
          </p>
          <div className="flex gap-3">
            <Button variant="primary" size="sm" pill>
              Save Preferences
            </Button>
            <Button variant="outline" size="sm" pill>
              Export Profile Data
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};
