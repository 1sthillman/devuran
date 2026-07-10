/**
 * Health Check Utility
 * 
 * Monitors the health of all dependencies:
 * - Firestore
 * - Redis
 * - External APIs
 */

import { getAdminFirestore } from '@/config/firebase-admin';
import { checkRedisHealth } from '@/config/redis';

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'down';
  timestamp: string;
  services: {
    firestore: ServiceHealth;
    redis: ServiceHealth;
    googleAPI?: ServiceHealth;
  };
  version?: string;
}

export interface ServiceHealth {
  status: 'healthy' | 'unhealthy';
  message?: string;
  latency?: number; // milliseconds
}

/**
 * Check Firestore connection health
 */
async function checkFirestoreHealth(): Promise<ServiceHealth> {
  const startTime = Date.now();
  
  try {
    const db = getAdminFirestore();
    
    // Try to read a test document (or create a dummy read operation)
    const testRef = db.collection('_health_check').doc('test');
    await testRef.get();
    
    const latency = Date.now() - startTime;
    
    return {
      status: 'healthy',
      latency,
      message: 'Firestore connection OK',
    };
  } catch (error: any) {
    return {
      status: 'unhealthy',
      message: error.message || 'Firestore connection failed',
    };
  }
}

/**
 * Check Redis connection health
 */
async function checkRedisHealthStatus(): Promise<ServiceHealth> {
  const startTime = Date.now();
  
  try {
    const isHealthy = await checkRedisHealth();
    const latency = Date.now() - startTime;
    
    if (isHealthy) {
      return {
        status: 'healthy',
        latency,
        message: 'Redis connection OK',
      };
    } else {
      return {
        status: 'unhealthy',
        message: 'Redis PING failed',
      };
    }
  } catch (error: any) {
    return {
      status: 'unhealthy',
      message: error.message || 'Redis connection failed',
    };
  }
}

/**
 * Perform complete health check
 * 
 * @returns Overall health status
 */
export async function performHealthCheck(): Promise<HealthStatus> {
  const checks = await Promise.all([
    checkFirestoreHealth(),
    checkRedisHealthStatus(),
  ]);

  const [firestoreHealth, redisHealth] = checks;

  // Determine overall status
  const allHealthy = checks.every(check => check.status === 'healthy');
  const anyUnhealthy = checks.some(check => check.status === 'unhealthy');

  let overallStatus: 'healthy' | 'degraded' | 'down';
  
  if (allHealthy) {
    overallStatus = 'healthy';
  } else if (anyUnhealthy) {
    // If Redis is down but Firestore is up, system is degraded (can still work with cache)
    overallStatus = firestoreHealth.status === 'healthy' ? 'degraded' : 'down';
  } else {
    overallStatus = 'degraded';
  }

  return {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    services: {
      firestore: firestoreHealth,
      redis: redisHealth,
    },
    version: process.env.npm_package_version || '1.0.0',
  };
}

/**
 * Express middleware for health check endpoint
 * GET /health
 */
export async function healthCheckHandler(req: any, res: any): Promise<void> {
  try {
    const health = await performHealthCheck();
    
    const statusCode = health.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (error: any) {
    res.status(503).json({
      status: 'down',
      timestamp: new Date().toISOString(),
      error: error.message || 'Health check failed',
    });
  }
}
