// Provides module declarations for importing individual lucide-react icons from subpaths
// Prevents TypeScript errors when consuming files like 'lucide-react/dist/esm/icons/coins'
declare module 'lucide-react/dist/esm/icons/*' {
  import * as React from 'react';
  import { LucideProps } from 'lucide-react';
  const Icon: React.ComponentType<React.SVGProps<SVGSVGElement> & Partial<LucideProps>>;
  export default Icon;
}


