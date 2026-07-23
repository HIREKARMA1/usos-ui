'use client';

import { useMemo } from 'react';
import { useLocale } from './useLocale';
import { getNamespace, type ContentNamespace, type ContentTree } from '@/lib/i18n';

/**
 * Loads the merged JSON content tree for the given namespace in the active locale.
 * Components must read ALL user-facing strings from the returned tree — never hardcode.
 */
export function useContent<T extends ContentTree = ContentTree>(namespace: ContentNamespace): T {
  const { locale } = useLocale();
  return useMemo(() => getNamespace(locale, namespace) as T, [locale, namespace]);
}
