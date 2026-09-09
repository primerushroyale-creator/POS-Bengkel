'use client';

import React, { useEffect } from 'react';
import { useToastStore } from '@/stores/useToastStore';
import { useDataStore } from '@/stores/useDataStore';
import { formatRupiah } from '@/lib/utils';

// Helper to play a cash register "ka-ching" style chime using Web Audio API
const playChime = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    
    const ctx = new AudioContext();
    const gainNode = ctx.createGain();
    gainNode.connect(ctx.destination);
    gainNode.gain.setValueAtTime(0.1, ctx.currentTime);

    // High pitched short beep
    const osc1 = ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, ctx.currentTime); // A5
    osc1.connect(gainNode);
    osc1.start();
    osc1.stop(ctx.currentTime + 0.1);

    // Followed by a higher pitch
    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1318.51, ctx.currentTime + 0.1); // E6
    osc2.connect(gainNode);
    osc2.start(ctx.currentTime + 0.1);
    
    // Fade out
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    osc2.stop(ctx.currentTime + 0.6);

  } catch (err) {
    console.error('Audio chime failed:', err);
  }
};

export const RealtimeNotifications: React.FC = () => {
  const { success } = useToastStore();

  useEffect(() => {
    const handleNewTransaction = (e: Event) => {
      const customEvent = e as CustomEvent;
      const newTx = customEvent.detail;
      
      // Check if we already have it in local state (which means WE created it, so no need for notification)
      // Or if it just refreshed, it might be there. Wait, the event triggers BEFORE refreshData finishes.
      const isLocal = useDataStore.getState().transactions.some((t) => t.id === newTx.id);
      if (isLocal) {
        return; // Don't notify for our own transactions, as the kasir already knows.
      }

      // Play Sound
      playChime();

      // Show Toast Notification
      const methodStr = newTx.payment_method ? newTx.payment_method.toUpperCase() : 'TUNAI';
      const amountStr = formatRupiah(Number(newTx.total_amount));
      
      success(
        `${newTx.invoice_no} • ${amountStr} • ${methodStr}`,
        '🎉 Pembayaran Baru Masuk!'
      );
    };

    window.addEventListener('bengkel_new_transaction', handleNewTransaction);
    return () => {
      window.removeEventListener('bengkel_new_transaction', handleNewTransaction);
    };
  }, [success]);

  return null; // This is a headless component
};

