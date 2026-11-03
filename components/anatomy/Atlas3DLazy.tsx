'use client';

// components/anatomy/Atlas3DLazy.tsx
/**
 * بوّابة تحميل كسول للمجسّم: three و react-three-fiber و drei لا تُحمَّل
 * إلا عندما يختار المستخدم وضع 3D (dynamic import + ssr: false).
 */
import dynamic from 'next/dynamic';
import { Component, type ReactNode } from 'react';
import type { Atlas3DProps } from './Atlas3D';

const Atlas3D = dynamic(() => import('./Atlas3D'), {
  ssr: false,
  loading: () => (
    <div className="fa3 fa3-loading" role="status">
      جارٍ تحميل النموذج ثلاثي الأبعاد…
    </div>
  ),
});

export function webglAvailable(): boolean {
  try {
    if (typeof window === 'undefined' || !window.WebGLRenderingContext) return false;
    const c = document.createElement('canvas');
    return Boolean(c.getContext('webgl2') ?? c.getContext('webgl'));
  } catch {
    return false;
  }
}

interface BoundaryProps {
  onFail: () => void;
  children: ReactNode;
}

/** يلتقط أي خطأ في الـ 3D (فشل تحميل الحزمة أو WebGL) ويعيد المستخدم إلى الرسم 2D */
class Boundary extends Component<BoundaryProps, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError(): { failed: boolean } {
    return { failed: true };
  }

  componentDidCatch(): void {
    this.props.onFail();
  }

  render(): ReactNode {
    return this.state.failed ? null : this.props.children;
  }
}

export default function Atlas3DLazy(props: Atlas3DProps) {
  return (
    <Boundary onFail={props.onFail}>
      <Atlas3D {...props} />
    </Boundary>
  );
}
