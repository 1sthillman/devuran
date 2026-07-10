/**
 * Vertical Configuration - Firestore Document Structure
 * Bu dosya Firestore'daki verticalConfigs koleksiyonunun tam şemasını tanımlar
 */

import type { Timestamp } from 'firebase/firestore';
import type { VerticalConfig, BusinessType } from './wizard';

// Firestore document interface
export interface VerticalConfigDocument extends Omit<VerticalConfig, 'metadata'> {
  metadata: {
    createdAt: Timestamp;
    updatedAt: Timestamp;
    isActive: boolean;
    createdBy?: string;
    lastModifiedBy?: string;
  };
}

// Helper: Config ID generator
export function generateConfigId(businessType: BusinessType, version: number): string {
  return `${businessType}_v${version}`;
}

// Config validation
export interface ConfigValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateVerticalConfig(config: VerticalConfig): ConfigValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Step sırası kontrolü
  const orders = config.steps.map(s => s.order);
  if (new Set(orders).size !== orders.length) {
    errors.push('Step order değerleri benzersiz olmalı');
  }

  // Her step'in order değeri ardışık olmalı
  const sortedOrders = [...orders].sort((a, b) => a - b);
  for (let i = 0; i < sortedOrders.length; i++) {
    if (sortedOrders[i] !== i + 1) {
      errors.push(`Step order değerleri ardışık olmalı (${i + 1} eksik)`);
      break;
    }
  }

  // ReviewConfirm step son sırada olmalı
  const lastStep = config.steps[config.steps.length - 1];
  if (lastStep?.type !== 'ReviewConfirm') {
    warnings.push('Son step ReviewConfirm olmalı');
  }

  // Payment step varsa ReviewConfirm'den önce olmalı
  const paymentStepIndex = config.steps.findIndex(s => s.type === 'Payment');
  const reviewStepIndex = config.steps.findIndex(s => s.type === 'ReviewConfirm');
  
  if (paymentStepIndex > reviewStepIndex && reviewStepIndex !== -1) {
    errors.push('Payment step ReviewConfirm stepinden önce olmalı');
  }

  // Pricing rules kontrolü
  if (config.pricingRules.length === 0) {
    warnings.push('En az bir pricing rule tanımlanmalı');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}
