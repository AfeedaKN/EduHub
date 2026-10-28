import React from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarCheck,
  Calendar,
  CreditCard,
  Award,
  FileText,
  MessageSquare,
  ArrowUpRight,
} from 'lucide-react';

export const ParentQuickAccess: React.FC = () => {
  const quickShortcuts = [
    {
      title: 'Attendance',
      subtitle: 'Daily & monthly logs',
      icon: CalendarCheck,
      path: '/parent/attendance',
    },
    {
      title: 'Timetable',
      subtitle: 'Class periods & rooms',
      icon: Calendar,
      path: '/parent/timetable',
    },
    {
      title: 'Assignments',
      subtitle: 'Homework & tasks',
      icon: FileText,
      path: '/parent/assignments',
    },
    {
      title: 'Exams & Results',
      subtitle: 'Marks & report cards',
      icon: Award,
      path: '/parent/exams',
    },
    {
      title: 'Fees',
      subtitle: 'Invoices & dues',
      icon: CreditCard,
      path: '/parent/fees',
    },
    {
      title: 'Communication',
      subtitle: 'Notices & messages',
      icon: MessageSquare,
      path: '/parent/communication/notices',
    },
  ];

  return (
    <section className="parent-dashboard-section">
      <div className="parent-section-header-row">
        <div>
          <h3 className="parent-section-title">Quick Access</h3>
          <p className="parent-section-subtitle">
            Essential academic shortcuts and student tools.
          </p>
        </div>
      </div>

      <div className="parent-quick-minimal-grid">
        {quickShortcuts.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.path} to={item.path} className="parent-quick-minimal-card">
              <div className="parent-quick-m-icon-box">
                <Icon size={18} />
              </div>
              <div className="parent-quick-m-info">
                <div className="parent-quick-m-title-row">
                  <h4 className="parent-quick-m-title">{item.title}</h4>
                  <ArrowUpRight size={14} className="parent-quick-m-arrow" />
                </div>
                <p className="parent-quick-m-sub">{item.subtitle}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
};
