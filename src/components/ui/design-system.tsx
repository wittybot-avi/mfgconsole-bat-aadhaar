
import React, { ButtonHTMLAttributes, InputHTMLAttributes, forwardRef, TableHTMLAttributes, HTMLAttributes, ThHTMLAttributes, TdHTMLAttributes } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// UTILS
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// TOOLTIP
interface TooltipProps {
  content: string;
  children: React.ReactNode;
}

/* Updated Tooltip to use React.FC for better prop type recognition including key and children */
export const Tooltip: React.FC<TooltipProps> = ({ content, children }) => {
  return (
    <div className="group relative inline-block w-full">
      {children}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block px-2 py-1 bg-black text-white text-xs rounded whitespace-nowrap z-50 pointer-events-none">
        {content}
      </div>
    </div>
  );
};

// BUTTON
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    const variants = {
      default: "bg-primary text-primary-foreground hover:bg-primary/90",
      destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
      outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
      secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
      ghost: "hover:bg-accent hover:text-accent-foreground",
      link: "text-primary underline-offset-4 hover:underline",
    };
    
    const sizes = {
      default: "h-10 px-4 py-2",
      sm: "h-9 rounded-md px-3",
      lg: "h-11 rounded-md px-8",
      icon: "h-10 w-10",
    };

    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

// CARD
// Fix: children should be optional for Card and its sub-components to prevent TS errors when used dynamically
export const Card = ({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("rounded-lg border bg-card text-card-foreground shadow-sm bg-white dark:bg-slate-900", className)} {...props}>
    {children}
  </div>
);

export const CardHeader = ({ className, children }: { className?: string; children?: React.ReactNode }) => (
  <div className={cn("flex flex-col space-y-1.5 p-6", className)}>{children}</div>
);

export const CardTitle = ({ className, children }: { className?: string; children?: React.ReactNode }) => (
  <h3 className={cn("text-2xl font-semibold leading-none tracking-tight", className)}>{children}</h3>
);

export const CardContent = ({ className, children }: { className?: string; children?: React.ReactNode }) => (
  <div className={cn("p-6 pt-0", className)}>{children}</div>
);

// INPUT
export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

// BADGE
interface BadgeProps {
  children?: React.ReactNode;
  variant?: 'default' | 'outline' | 'secondary' | 'success' | 'warning' | 'destructive';
  className?: string;
}

/* Updated Badge to use React.FC and named interface for consistency and correctness */
export const Badge: React.FC<BadgeProps> = ({ children, variant = "default", className }) => {
  const variants = {
    default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
    secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
    destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
    success: "border-transparent bg-emerald-500 text-white hover:bg-emerald-600",
    warning: "border-transparent bg-amber-500 text-white hover:bg-amber-600",
    outline: "text-foreground",
  };
  return (
    <div className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2", variants[variant], className)}>
      {children}
    </div>
  );
};

// TABLE STUBS (Simple implementation for demo)
export const Table = ({ children, className, ...props }: TableHTMLAttributes<HTMLTableElement>) => (
  <div className="w-full overflow-auto">
    <table className={cn("w-full caption-bottom text-sm", className)} {...props}>{children}</table>
  </div>
);

export const TableHeader = ({ children, className, ...props }: HTMLAttributes<HTMLTableSectionElement>) => (
  <thead className={cn("[&_tr]:border-b", className)} {...props}>{children}</thead>
);

export const TableRow = ({ children, className, ...props }: HTMLAttributes<HTMLTableRowElement>) => (
  <tr className={cn("border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted", className)} {...props}>{children}</tr>
);

export const TableHead = ({ children, className, ...props }: ThHTMLAttributes<HTMLTableCellElement>) => (
  <th className={cn("h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0", className)} {...props}>{children}</th>
);

export const TableCell = ({ children, className, ...props }: TdHTMLAttributes<HTMLTableCellElement>) => (
  <td className={cn("p-4 align-middle [&:has([role=checkbox])]:pr-0", className)} {...props}>{children}</td>
);

// TABS
// Added Tabs components to support EolDetails and other UI requirements.
export const Tabs = ({ children, className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("space-y-2", className)} {...props}>{children}</div>
);

export const TabsList = ({ children, className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground", className)} {...props}>{children}</div>
);

export const TabsTrigger = ({ children, className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button className={cn("inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm", className)} {...props}>{children}</button>
);

export const TabsContent = ({ children, className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2", className)} {...props}>{children}</div>
);
