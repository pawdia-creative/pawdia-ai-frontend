import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import { badgeVariants } from "./badgeVariants";

export interface BadgeProps extends React.PropsWithChildren<React.HTMLAttributes<HTMLDivElement>>, VariantProps<typeof badgeVariants> {}

const Badge: React.FC<BadgeProps> = ({ className, variant, children, ...props }) => {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props}>
      {children}
    </div>
  );
};

export { Badge };
