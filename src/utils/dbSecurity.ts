import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { sanitizeInput, sanitizeObject, sanitizeSqlParam } from './security';

/**
 * DATABASE SECURITY & PARAMETERIZED RPC UTILITY MODULE
 * 
 * Enforces strict parameterized RPC queries for Supabase custom database calls
 * and provides input sanitization middleware for all form fields.
 */

export interface RpcParameterMap {
  [key: string]: string | number | boolean | null | undefined | object | any[];
}

export interface RpcResponse<T = any> {
  data: T | null;
  error: Error | null;
  isSuccess: boolean;
}

/**
 * Enforces parameterized queries for all custom Supabase RPC calls to prevent SQL injection.
 * 
 * @param functionName The PostgreSQL RPC function name (e.g., 'search_books_by_author', 'process_order_transaction')
 * @param params Object containing key-value pairs representing parameters. All string values are automatically parameterized and sanitized.
 */
export async function executeParameterizedRpc<T = any>(
  functionName: string,
  params: RpcParameterMap = {}
): Promise<RpcResponse<T>> {
  try {
    // 1. Validate function name against SQL injection patterns
    const cleanFnName = sanitizeSqlParam(functionName);
    if (!cleanFnName || !/^[a-zA-Z0-9_]+$/.test(cleanFnName)) {
      throw new Error(`[DB Security Error] Invalid or unsafe RPC function name: "${functionName}"`);
    }

    // 2. Build strictly typed & parameterized RPC payload
    const parameterizedParams: RpcParameterMap = {};
    
    for (const key of Object.keys(params)) {
      // Validate argument identifier format
      if (!/^[a-zA-Z0-9_]+$/.test(key)) {
        console.warn(`[DB Security Warning] Ignored non-conforming RPC parameter key: ${key}`);
        continue;
      }

      const val = params[key];
      if (typeof val === 'string') {
        // Sanitize string parameters to neutralize inline SQL manipulation
        parameterizedParams[key] = sanitizeInput(val, 2000);
      } else if (typeof val === 'object' && val !== null) {
        parameterizedParams[key] = sanitizeObject(val as Record<string, any>, 2000);
      } else {
        parameterizedParams[key] = val;
      }
    }

    console.log(`[DB Security] Executing Parameterized RPC: "${cleanFnName}"`, parameterizedParams);

    // 3. Execute via Supabase RPC client (uses Postgres prepared statements under the hood)
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.rpc(cleanFnName, parameterizedParams);
      if (error) {
        return { data: null, error: new Error(error.message), isSuccess: false };
      }
      return { data: data as T, error: null, isSuccess: true };
    }

    // Fallback response when Supabase is running in local offline demo mode
    return {
      data: null,
      error: null,
      isSuccess: true,
    };
  } catch (err: any) {
    console.error(`[DB Security Failure] RPC execution failed for function "${functionName}":`, err);
    return {
      data: null,
      error: err instanceof Error ? err : new Error(String(err)),
      isSuccess: false,
    };
  }
}

/**
 * Input sanitization middleware function for form fields.
 * Intercepts form submit events or raw form data objects, sanitizes every field,
 * and strips HTML, script tags, and SQL injection syntax.
 */
export function sanitizeFormData<T extends Record<string, any>>(formData: T): T {
  if (!formData || typeof formData !== 'object') {
    return formData;
  }
  return sanitizeObject(formData, 2000);
}

/**
 * High-Order Function / Middleware wrapper for form submit handlers.
 * Wraps a FormEvent handler to automatically sanitize form target elements or state before execution.
 */
export function withSanitizedInput<T extends Record<string, any>>(
  handler: (cleanData: T) => void
) {
  return (rawData: T) => {
    const cleanData = sanitizeFormData(rawData);
    handler(cleanData);
  };
}
