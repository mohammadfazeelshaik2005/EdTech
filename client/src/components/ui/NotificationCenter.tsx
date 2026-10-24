import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell,
  Clock,
  Sparkles,
  CheckCircle2,
  X,
  ExternalLink,
  RotateCcw,
  Check,
} from 'lucide-react';
import {
  getStoredNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  dismissNotification,
  NotificationItem,
} from '@/services/notificationService';

export const NotificationCenter: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>(() =>
    getStoredNotifications()
  );
  const [activeFilter, setActiveFilter] = useState<'All' | 'Deadlines' | 'Matches' | 'Updates'>('All');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAsRead = (id: string) => {
    const updated = markNotificationAsRead(id);
    setNotifications(updated);
  };

  const handleMarkAllRead = () => {
    const updated = markAllNotificationsAsRead();
    setNotifications(updated);
  };

  const handleDismiss = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = dismissNotification(id);
    setNotifications(updated);
  };

  const filteredNotifications = notifications.filter((n) => {
    if (activeFilter === 'Deadlines') return n.type === 'DEADLINE_URGENT';
    if (activeFilter === 'Matches') return n.type === 'NEW_MATCH';
    if (activeFilter === 'Updates') return n.type === 'SAVED_UPDATE';
    return true;
  });

  return (
    <div className="relative" ref={dropdownRef}>
      
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-slate-subtle hover:text-charcoal hover:bg-subtle rounded-full relative cursor-pointer transition-colors"
        aria-label="Notifications"
        title="Open notifications & deadline intelligence"
      >
        <Bell className="w-4.5 h-4.5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-600 text-white font-bold text-[9px] flex items-center justify-center ring-2 ring-surface shadow-2xs animate-in zoom-in-75">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Flyout Dropdown Popover */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 sm:w-[420px] bg-surface rounded-2xl border border-border-default shadow-xl z-50 overflow-hidden animate-in fade-in-0 zoom-in-95 duration-200">
          
          {/* Header */}
          <div className="p-4 bg-alternate border-b border-border-subtle flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold text-charcoal text-sm">
                Deadline Intelligence & Alerts
              </span>
              {unreadCount > 0 && (
                <span className="text-[10px] font-bold bg-primary text-white px-2 py-0.5 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-[11px] text-primary hover:underline font-bold cursor-pointer flex items-center gap-1"
              >
                <Check className="w-3 h-3" />
                <span>Mark all as read</span>
              </button>
            )}
          </div>

          {/* Filter Pills Row */}
          <div className="flex items-center gap-1.5 px-4 py-2 border-b border-border-subtle bg-surface text-xs overflow-x-auto scrollbar-none">
            {(['All', 'Deadlines', 'Matches', 'Updates'] as const).map((filter) => {
              const count =
                filter === 'All'
                  ? notifications.length
                  : filter === 'Deadlines'
                  ? notifications.filter((n) => n.type === 'DEADLINE_URGENT').length
                  : filter === 'Matches'
                  ? notifications.filter((n) => n.type === 'NEW_MATCH').length
                  : notifications.filter((n) => n.type === 'SAVED_UPDATE').length;

              return (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setActiveFilter(filter)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                    activeFilter === filter
                      ? 'bg-primary text-white shadow-2xs'
                      : 'text-slate-muted hover:text-charcoal hover:bg-alternate'
                  }`}
                >
                  {filter} ({count})
                </button>
              );
            })}
          </div>

          {/* Notifications List */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-border-subtle">
            {filteredNotifications.length > 0 ? (
              filteredNotifications.map((notif) => {
                const isDeadline = notif.type === 'DEADLINE_URGENT';
                const isMatch = notif.type === 'NEW_MATCH';
                const isUpdate = notif.type === 'SAVED_UPDATE';

                return (
                  <div
                    key={notif.id}
                    onClick={() => handleMarkAsRead(notif.id)}
                    className={`p-4 transition-colors hover:bg-alternate/80 cursor-pointer flex items-start gap-3 relative ${
                      !notif.read ? 'bg-primary-subtle/20' : 'bg-surface'
                    }`}
                  >
                    {/* Unread indicator dot */}
                    {!notif.read && (
                      <span className="w-2 h-2 rounded-full bg-primary absolute top-4 left-2 shrink-0" />
                    )}

                    {/* Icon container */}
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                        isDeadline
                          ? 'bg-rose-100 text-rose-700'
                          : isMatch
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {isDeadline && <Clock className="w-4 h-4" />}
                      {isMatch && <Sparkles className="w-4 h-4" />}
                      {isUpdate && <RotateCcw className="w-4 h-4" />}
                    </div>

                    {/* Notification content */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-xs font-bold text-charcoal leading-snug">
                          {notif.title}
                        </h4>
                        <button
                          type="button"
                          onClick={(e) => handleDismiss(notif.id, e)}
                          className="text-slate-subtle hover:text-charcoal p-0.5 rounded cursor-pointer shrink-0"
                          title="Dismiss"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>

                      <p className="text-[11px] text-slate-muted leading-relaxed line-clamp-2">
                        {notif.message}
                      </p>

                      {/* Opportunity meta badge */}
                      {notif.opportunityTitle && (
                        <div className="text-[10px] text-slate-subtle pt-0.5 flex flex-wrap items-center gap-1.5">
                          <span className="font-semibold text-charcoal">{notif.organization}</span>
                          {notif.daysRemaining !== undefined && (
                            <span
                              className={`px-2 py-0.2 rounded-full font-bold ${
                                notif.daysRemaining <= 5
                                  ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                  : 'bg-amber-100 text-amber-900 border border-amber-200'
                              }`}
                            >
                              {notif.daysRemaining} days remaining
                            </span>
                          )}
                        </div>
                      )}

                      {/* Footer CTA & Timestamp */}
                      <div className="flex items-center justify-between pt-1.5 text-[10px]">
                        <span className="text-slate-subtle">{notif.timestamp}</span>
                        <Link
                          to={notif.actionUrl}
                          onClick={() => setIsOpen(false)}
                          className="text-primary hover:underline font-bold flex items-center gap-1"
                        >
                          <span>{notif.actionLabel}</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <div className="text-xs font-bold text-charcoal">All Caught Up</div>
                <p className="text-[11px] text-slate-muted">
                  No notifications in this category. We only notify you about urgent deadlines and high-match opportunities.
                </p>
              </div>
            )}
          </div>

          {/* Footer Navigation */}
          <div className="p-3 bg-alternate border-t border-border-subtle flex items-center justify-between text-xs">
            <span className="text-[10px] text-slate-subtle">
              Strictly non-spammy deadline intelligence
            </span>
            <Link
              to="/applications"
              onClick={() => setIsOpen(false)}
              className="text-primary hover:underline font-bold text-xs"
            >
              View Application Tracker →
            </Link>
          </div>

        </div>
      )}

    </div>
  );
};
