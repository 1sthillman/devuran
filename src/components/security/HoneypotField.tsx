/**
 * Honeypot Field Component
 * Invisible field to catch bots - humans won't see or fill it
 */

import { useEffect, useState } from 'react';
import { generateHoneypotField } from '@/utils/security';

interface HoneypotFieldProps {
  onValueChange: (value: string) => void;
}

export function HoneypotField({ onValueChange }: HoneypotFieldProps) {
  const [fieldName] = useState(() => generateHoneypotField());

  return (
    <div
      style={{
        position: 'absolute',
        left: '-9999px',
        width: '1px',
        height: '1px',
        opacity: 0,
        pointerEvents: 'none',
      }}
      aria-hidden="true"
      tabIndex={-1}
    >
      <label htmlFor={fieldName}>
        Please leave this field empty
      </label>
      <input
        type="text"
        id={fieldName}
        name={fieldName}
        autoComplete="off"
        tabIndex={-1}
        onChange={(e) => onValueChange(e.target.value)}
      />
    </div>
  );
}
