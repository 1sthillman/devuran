import { useState } from 'react';
import { Calendar, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { Reservation } from '@/types';
import {
  reservationToCalendarEvent,
  getDefaultCalendarAction,
  getCalendarButtonText
} from '@/utils/calendarUtils';

interface AddToCalendarButtonProps {
  reservation: Reservation;
  variant?: 'default' | 'compact';
  className?: string;
}

export function AddToCalendarButton({ 
  reservation, 
  variant = 'default',
  className 
}: AddToCalendarButtonProps) {
  const [isAdded, setIsAdded] = useState(false);
  
  const event = reservationToCalendarEvent(reservation);
  const calendarAction = getDefaultCalendarAction(event);
  const buttonText = getCalendarButtonText();

  const handleClick = () => {
    calendarAction();
    setIsAdded(true);
    
    // Reset after 3 seconds
    setTimeout(() => {
      setIsAdded(false);
    }, 3000);
  };

  return (
    <motion.button
      onClick={handleClick}
      disabled={isAdded}
      whileHover={{ scale: isAdded ? 1 : 1.01 }}
      whileTap={{ scale: isAdded ? 1 : 0.99 }}
      className={cn(
        "relative overflow-hidden rounded-2xl font-heading font-semibold transition-all duration-200",
        "flex items-center justify-center gap-2.5",
        "text-white",
        variant === 'default' && "h-12 px-6 w-full",
        variant === 'compact' && "h-10 px-4 text-sm",
        isAdded 
          ? "bg-gradient-to-r from-emerald-500 to-teal-500 cursor-default"
          : "bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 hover:shadow-lg hover:shadow-purple-500/25",
        className
      )}
    >
      {isAdded ? (
        <>
          <Check size={variant === 'default' ? 18 : 16} className="animate-scale-in" />
          <span>Takvime Eklendi</span>
        </>
      ) : (
        <>
          <Calendar size={variant === 'default' ? 18 : 16} />
          <span>{buttonText}</span>
        </>
      )}
    </motion.button>
  );
}
