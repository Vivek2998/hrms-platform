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
      align: 'center' as const,
      popoverClass: 'hrms-tour-popover hrms-tour-no-arrow',
    },
  },
  {
    element: '#tour-notifications',
    popover: {
      title: 'Notifications',
      description: 'Stay on top of leave requests, announcements, and approvals. The badge shows unread items.',
      side: 'bottom' as const,
      align: 'center' as const,
      popoverClass: 'hrms-tour-popover hrms-tour-no-arrow',
    },
  },
  {
    element: '#tour-setup-guide',
    popover: {
      title: 'Setup Guide',
      description: 'Follow this checklist to finish setting up your HRMS. Each step links directly to the relevant page.',
      side: 'bottom' as const,
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
      side: 'bottom' as const,
      align: 'start' as const,
    },
  },
]);

export function useProductTour() {
  const { state, markTourDone, collapseGuide } = useSetupGuide();
  const role = useAuthStore((s) => s.user?.role);

  const start = useCallback(() => {
    const isHR = role && ['SUPER_ADMIN', 'ORG_ADMIN', 'HR'].includes(role);
    const steps = isHR ? HR_STEPS : EMPLOYEE_STEPS;

    // Only set true when the Next/Done button is clicked on the very last step.
    // X-button clicks never set this, so closing early never triggers completion.
    let completedByDone = false;

    // In dark mode, a higher opacity makes the spotlight cutout more visible
    // because the page background is already dark (close to the overlay colour).
    const isDark = document.documentElement.classList.contains('dark');

    const driverObj = driver({
      showProgress: true,
      animate: true,
      smoothScroll: true,
      overlayOpacity: isDark ? 0.72 : 0.6,
      stagePadding: 6,        // breathing room around the highlighted element
      stageRadius: 6,         // rounded spotlight corners
      popoverClass: 'hrms-tour-popover',
      progressText: '{{current}} of {{total}}',
      nextBtnText: 'Next →',
      prevBtnText: '← Back',
      doneBtnText: 'Done',
      steps: steps.filter((s) => document.querySelector(s.element) !== null),
      onNextClick: () => {
        if (!driverObj.hasNextStep()) completedByDone = true;
        driverObj.moveNext();
      },
      onPopoverRender: (popover) => {
        const el = popover.wrapper as HTMLElement;
        requestAnimationFrame(() => {
          const rect = el.getBoundingClientRect();
          const gap = 8;
          const vw = window.innerWidth;
          const vh = window.innerHeight;
          if (rect.right  > vw - gap) el.style.left = `${parseFloat(el.style.left || '0') - (rect.right  - vw + gap)}px`;
          if (rect.bottom > vh - gap) el.style.top  = `${parseFloat(el.style.top  || '0') - (rect.bottom - vh + gap)}px`;
          if (rect.left   < gap)      el.style.left = `${gap}px`;
          if (rect.top    < gap)      el.style.top  = `${gap}px`;
        });
      },
      onDestroyStarted: () => {
        if (completedByDone) {
          markTourDone();
          collapseGuide();
          // Let the collapse animation start, then scroll the main content area
          // (not window — the sidebar layout scrolls inside <main>) back to top.
          setTimeout(() => {
            document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' });
          }, 50);
        }
        driverObj.destroy();
      },
    });

    driverObj.drive();
  }, [role, markTourDone, collapseGuide]);

  return { start, tourDone: state.tourDone };
}

export function AutoTour() {
  const { start, tourDone } = useProductTour();

  useEffect(() => {
    if (tourDone) return;
    let id: number;
    if (typeof requestIdleCallback !== 'undefined') {
      id = requestIdleCallback(start, { timeout: 3000 });
    } else {
      id = window.setTimeout(start, 0);
    }
    return () => {
      if (typeof requestIdleCallback !== 'undefined') cancelIdleCallback(id);
      else window.clearTimeout(id);
    };
  }, [tourDone]); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}
