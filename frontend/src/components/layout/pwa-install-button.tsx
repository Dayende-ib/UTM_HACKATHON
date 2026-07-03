'use client';

import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePwaInstall } from '@/hooks/usePwaInstall';

export default function PwaInstallButton({ className = '' }: { className?: string }) {
  const { canInstall, promptInstall } = usePwaInstall();

  if (!canInstall) return null;

  return (
    <Button variant="outline" size="sm" onClick={promptInstall} className={className}>
      <Download className="h-3.5 w-3.5" />
      Installer l&apos;application
    </Button>
  );
}
