// Type definitions for node-ical
declare module 'node-ical' {
  export interface VEvent {
    type: 'VEVENT';
    start: Date | string;
    end?: Date | string;
    summary: string;
    description?: string;
    location?: string;
    uid?: string;
    [key: string]: any;
  }

  export interface CalendarComponent {
    type: string;
    [key: string]: any;
  }

  export namespace async {
    function fromURL(url: string): Promise<Record<string, CalendarComponent | VEvent>>;
  }

  export function parseICS(icsData: string): Record<string, CalendarComponent | VEvent>;
}

// Fix for Framer Motion type issues with React 19
declare module 'framer-motion' {
  import * as React from 'react';
  
  export interface MotionProps {
    initial?: any;
    animate?: any;
    exit?: any;
    transition?: any;
    whileHover?: any;
    whileTap?: any;
    whileInView?: any;
    variants?: any;
    [key: string]: any;
  }

  export const motion: {
    [K in keyof JSX.IntrinsicElements]: React.ForwardRefExoticComponent<
      JSX.IntrinsicElements[K] & MotionProps & React.RefAttributes<any>
    >;
  };

  export const AnimatePresence: React.FC<{
    children?: React.ReactNode;
    mode?: 'wait' | 'sync' | 'popLayout';
    initial?: boolean;
    custom?: any;
    onExitComplete?: () => void;
  }>;
}
