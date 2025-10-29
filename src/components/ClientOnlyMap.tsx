"use client";

import { useEffect, useState } from "react";

interface ClientOnlyMapProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function ClientOnlyMap({ children, fallback = <div className="h-full grid place-items-center text-slate-500">Loading map…</div> }: ClientOnlyMapProps) {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
