import { useEffect, useCallback } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import { useSetupGuide } from '@/hooks/useSetupGuide';
import { useAuthStore } from '@/stores/auth.store';

const HR_STEPS = [
  {
    element: '#tour-hero',
    popover: {
      title: 'Welcome to your HRMS',
      description: 'This is your personal dashboard — a single view of everything happening across your organisation.',
      side: 'bottom' as const,
      align: 'start' as const,
    },
  },
  {
    element: '#tour-quick-actions',
    popover: {
      title: 'Quick Actions',
      description: 'Jump directly to the most common tasks with one click. These shortcuts change based on your role.',
      side: 'bottom' as const,
      align: 'start' as const,
    },
  },
  {
    element: '#tour-sidebar',
    popover: {
      title: 'Navigation',
      description: 'Everything is organised in the sidebar — People, Time & Attendance, Payroll, and more. Click any item to navigate.',
      side: 'right' as const,
      align: 'start' as const,
    },
  },
  {
    element: '#tour-search',
    popover: {
      title: 'Global Search',
      description: 'Press Ctrl+K (or ⌘K on Mac) anywhere to instantly search employees, pages, and actions.',
      side: 'bottom' as const,
      align: 'end' as const,
    },
  },
  {
    element: '#tour-notifications',
    popover: {
      title: 'Notifications',
      description: 'Stay on top of leave requests, announcements, and approvals. The badge shows unread items.',
      side: 'bottom' as const,
      align: 'end' as const,
    },
  },
  {
    element: '#tour-setup-guide',
    popover: {
      title: 'Setup Guide',
      description: 'Follow this checklist to finish setting up your HRMS. Each step links directly to the relevant page.',
      side: 'top' as const,
      align: 'start' as const,
    },
  },
];

const EMPLOYEE_STEPS = HR_STEPS.filter((s) =>
  !['#tour-setup-guide'].includes(s.element ?? ''),
).concat([
  {
    element: '#tour-setup-guide',
    popover: {
      title: 'Your Getting Started Guide',
      description: 'Complete these quick steps to make the most of your HRMS.',
      side: 'top' as const,
      align: 'start' as const,
    },
  },
]);

export function useProductTour() {
  const { state, markTourDone } = useSetupGuide();
  const role = useAuthStore((s) => s.user?.role);

  const start = useCallback(() => {
    const isHR = role && ['SUPER_ADMIN', 'ORG_ADMIN', 'HR'].includes(role);
    const steps = isHR ? HR_STEPS : EMPLOYEE_STEPS;

    const driverObj = driver({
      showProgress: true,
      animate: true,
      smoothScroll: true,
      overlayOpacity: 0.6,
      popoverClass: 'hrms-tour-popover',
      progressText: '{{current}} of {{total}}',
      nextBtnText: 'Next →',
      prevBtnText: '← Back',
      doneBtnText: 'Done',
      steps: steps.filter((s) => document.querySelector(s.element) !== null),
      onDestroyStarted: () => {
        markTourDone();
        driverObj.destroy();
      },
    });

    driverObj.drive();
  }, [role, markTourDone]);

  return { start, tourDone: state.tourDone };
}

export function AutoTour() {
  const { state } = useSetupGuide();
  const { start } = useProductTour();

  useEffect(() => {
    if (state.tourDone) return;
    const timer = setTimeout(start, 800);
    return () => clearTimeout(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}
