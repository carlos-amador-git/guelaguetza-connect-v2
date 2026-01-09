import React from 'react';

// ============================================
// Table Context
// ============================================

interface TableContextValue {
  variant: 'default' | 'striped' | 'hoverable';
  size: 'sm' | 'md' | 'lg';
  bordered: boolean;
}

const TableContext = React.createContext<TableContextValue>({
  variant: 'default',
  size: 'md',
  bordered: false,
});

// ============================================
// Table Root
// ============================================

interface TableProps {
  children: React.ReactNode;
  variant?: 'default' | 'striped' | 'hoverable';
  size?: 'sm' | 'md' | 'lg';
  bordered?: boolean;
  fullWidth?: boolean;
  className?: string;
}

export const Table: React.FC<TableProps> = ({
  children,
  variant = 'default',
  size = 'md',
  bordered = false,
  fullWidth = true,
  className = '',
}) => {
  return (
    <TableContext.Provider value={{ variant, size, bordered }}>
      <div className={`overflow-x-auto ${className}`}>
        <table className={`${fullWidth ? 'w-full' : ''} border-collapse`}>
          {children}
        </table>
      </div>
    </TableContext.Provider>
  );
};

// ============================================
// Table Head
// ============================================

interface TableHeadProps {
  children: React.ReactNode;
  className?: string;
}

export const TableHead: React.FC<TableHeadProps> = ({
  children,
  className = '',
}) => {
  return (
    <thead className={`bg-gray-50 dark:bg-gray-800 ${className}`}>
      {children}
    </thead>
  );
};

// ============================================
// Table Body
// ============================================

interface TableBodyProps {
  children: React.ReactNode;
  className?: string;
}

export const TableBody: React.FC<TableBodyProps> = ({
  children,
  className = '',
}) => {
  const { variant } = React.useContext(TableContext);

  return (
    <tbody
      className={`
        divide-y divide-gray-200 dark:divide-gray-700
        ${variant === 'striped' ? '[&>tr:nth-child(even)]:bg-gray-50 dark:[&>tr:nth-child(even)]:bg-gray-800/50' : ''}
        ${variant === 'hoverable' ? '[&>tr]:hover:bg-gray-50 dark:[&>tr]:hover:bg-gray-800/50' : ''}
        ${className}
      `}
    >
      {children}
    </tbody>
  );
};

// ============================================
// Table Row
// ============================================

interface TableRowProps {
  children: React.ReactNode;
  selected?: boolean;
  onClick?: () => void;
  className?: string;
}

export const TableRow: React.FC<TableRowProps> = ({
  children,
  selected = false,
  onClick,
  className = '',
}) => {
  return (
    <tr
      onClick={onClick}
      className={`
        ${onClick ? 'cursor-pointer' : ''}
        ${selected ? 'bg-oaxaca-pink/5 dark:bg-oaxaca-pink/10' : ''}
        transition-colors
        ${className}
      `}
    >
      {children}
    </tr>
  );
};

// ============================================
// Table Header Cell
// ============================================

interface TableHeaderCellProps {
  children: React.ReactNode;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  sortDirection?: 'asc' | 'desc' | null;
  onSort?: () => void;
  width?: string | number;
  className?: string;
}

export const TableHeaderCell: React.FC<TableHeaderCellProps> = ({
  children,
  align = 'left',
  sortable = false,
  sortDirection = null,
  onSort,
  width,
  className = '',
}) => {
  const { size, bordered } = React.useContext(TableContext);

  const sizes = {
    sm: 'px-3 py-2 text-xs',
    md: 'px-4 py-3 text-sm',
    lg: 'px-6 py-4 text-base',
  };

  const alignClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };

  return (
    <th
      style={{ width }}
      className={`
        ${sizes[size]}
        ${alignClasses[align]}
        ${bordered ? 'border border-gray-200 dark:border-gray-700' : ''}
        font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider
        ${sortable ? 'cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-gray-700' : ''}
        ${className}
      `}
      onClick={sortable ? onSort : undefined}
    >
      <div className={`flex items-center gap-2 ${align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : ''}`}>
        {children}
        {sortable && (
          <span className="flex flex-col">
            <svg
              className={`w-3 h-3 -mb-1 ${sortDirection === 'asc' ? 'text-oaxaca-pink' : 'text-gray-400'}`}
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 8l-6 6h12l-6-6z" />
            </svg>
            <svg
              className={`w-3 h-3 -mt-1 ${sortDirection === 'desc' ? 'text-oaxaca-pink' : 'text-gray-400'}`}
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 16l-6-6h12l-6 6z" />
            </svg>
          </span>
        )}
      </div>
    </th>
  );
};

// ============================================
// Table Cell
// ============================================

interface TableCellProps {
  children: React.ReactNode;
  align?: 'left' | 'center' | 'right';
  colSpan?: number;
  className?: string;
}

export const TableCell: React.FC<TableCellProps> = ({
  children,
  align = 'left',
  colSpan,
  className = '',
}) => {
  const { size, bordered } = React.useContext(TableContext);

  const sizes = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-3 text-sm',
    lg: 'px-6 py-4 text-base',
  };

  const alignClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };

  return (
    <td
      colSpan={colSpan}
      className={`
        ${sizes[size]}
        ${alignClasses[align]}
        ${bordered ? 'border border-gray-200 dark:border-gray-700' : ''}
        text-gray-900 dark:text-gray-100
        ${className}
      `}
    >
      {children}
    </td>
  );
};

// ============================================
// Table Footer
// ============================================

interface TableFooterProps {
  children: React.ReactNode;
  className?: string;
}

export const TableFooter: React.FC<TableFooterProps> = ({
  children,
  className = '',
}) => {
  return (
    <tfoot className={`bg-gray-50 dark:bg-gray-800 font-medium ${className}`}>
      {children}
    </tfoot>
  );
};

// ============================================
// Data Table (Full Featured)
// ============================================

interface Column<T> {
  key: string;
  header: string;
  accessor: keyof T | ((row: T) => React.ReactNode);
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  width?: string | number;
  render?: (value: unknown, row: T, index: number) => React.ReactNode;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (row: T) => string | number;
  selectable?: boolean;
  selectedKeys?: Set<string | number>;
  onSelectionChange?: (keys: Set<string | number>) => void;
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (column: string, direction: 'asc' | 'desc') => void;
  loading?: boolean;
  emptyMessage?: string;
  variant?: 'default' | 'striped' | 'hoverable';
  size?: 'sm' | 'md' | 'lg';
  bordered?: boolean;
  onRowClick?: (row: T) => void;
  className?: string;
}

export function DataTable<T>({
  data,
  columns,
  keyExtractor,
  selectable = false,
  selectedKeys = new Set(),
  onSelectionChange,
  sortColumn,
  sortDirection,
  onSort,
  loading = false,
  emptyMessage = 'No hay datos para mostrar',
  variant = 'hoverable',
  size = 'md',
  bordered = false,
  onRowClick,
  className = '',
}: DataTableProps<T>) {
  const allSelected = data.length > 0 && data.every(row => selectedKeys.has(keyExtractor(row)));
  const someSelected = data.some(row => selectedKeys.has(keyExtractor(row))) && !allSelected;

  const handleSelectAll = () => {
    if (allSelected) {
      onSelectionChange?.(new Set());
    } else {
      onSelectionChange?.(new Set(data.map(keyExtractor)));
    }
  };

  const handleSelectRow = (key: string | number) => {
    const newSelection = new Set(selectedKeys);
    if (newSelection.has(key)) {
      newSelection.delete(key);
    } else {
      newSelection.add(key);
    }
    onSelectionChange?.(newSelection);
  };

  const handleSort = (column: string) => {
    if (!onSort) return;
    const newDirection = sortColumn === column && sortDirection === 'asc' ? 'desc' : 'asc';
    onSort(column, newDirection);
  };

  const getCellValue = (row: T, accessor: Column<T>['accessor']): unknown => {
    if (typeof accessor === 'function') {
      return accessor(row);
    }
    return row[accessor];
  };

  return (
    <Table variant={variant} size={size} bordered={bordered} className={className}>
      <TableHead>
        <TableRow>
          {selectable && (
            <TableHeaderCell width={40}>
              <input
                type="checkbox"
                checked={allSelected}
                ref={(el) => {
                  if (el) el.indeterminate = someSelected;
                }}
                onChange={handleSelectAll}
                className="w-4 h-4 rounded border-gray-300 text-oaxaca-pink focus:ring-oaxaca-pink"
              />
            </TableHeaderCell>
          )}
          {columns.map((column) => (
            <TableHeaderCell
              key={column.key}
              align={column.align}
              width={column.width}
              sortable={column.sortable}
              sortDirection={sortColumn === column.key ? sortDirection : null}
              onSort={() => column.sortable && handleSort(column.key)}
            >
              {column.header}
            </TableHeaderCell>
          ))}
        </TableRow>
      </TableHead>
      <TableBody>
        {loading ? (
          <TableRow>
            <TableCell colSpan={columns.length + (selectable ? 1 : 0)}>
              <div className="flex items-center justify-center py-8">
                <div className="w-8 h-8 border-2 border-oaxaca-pink border-t-transparent rounded-full animate-spin" />
              </div>
            </TableCell>
          </TableRow>
        ) : data.length === 0 ? (
          <TableRow>
            <TableCell colSpan={columns.length + (selectable ? 1 : 0)}>
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                {emptyMessage}
              </div>
            </TableCell>
          </TableRow>
        ) : (
          data.map((row, rowIndex) => {
            const key = keyExtractor(row);
            const isSelected = selectedKeys.has(key);

            return (
              <TableRow
                key={key}
                selected={isSelected}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
              >
                {selectable && (
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        e.stopPropagation();
                        handleSelectRow(key);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="w-4 h-4 rounded border-gray-300 text-oaxaca-pink focus:ring-oaxaca-pink"
                    />
                  </TableCell>
                )}
                {columns.map((column) => {
                  const value = getCellValue(row, column.accessor);
                  return (
                    <TableCell key={column.key} align={column.align}>
                      {column.render
                        ? column.render(value, row, rowIndex)
                        : (value as React.ReactNode)}
                    </TableCell>
                  );
                })}
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
  );
}

// ============================================
// Simple List Table
// ============================================

interface ListTableProps<T> {
  data: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T) => string | number;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  loading?: boolean;
  emptyMessage?: string;
  className?: string;
}

export function ListTable<T>({
  data,
  renderItem,
  keyExtractor,
  header,
  footer,
  loading = false,
  emptyMessage = 'No hay datos',
  className = '',
}: ListTableProps<T>) {
  return (
    <div className={`bg-white dark:bg-gray-900 rounded-xl overflow-hidden ${className}`}>
      {header && (
        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          {header}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-oaxaca-pink border-t-transparent rounded-full animate-spin" />
        </div>
      ) : data.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          {emptyMessage}
        </div>
      ) : (
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {data.map((item, index) => (
            <div key={keyExtractor(item)}>
              {renderItem(item, index)}
            </div>
          ))}
        </div>
      )}

      {footer && (
        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
          {footer}
        </div>
      )}
    </div>
  );
}

// ============================================
// Table Card (Mobile-friendly)
// ============================================

interface TableCardProps {
  children: React.ReactNode;
  onClick?: () => void;
  selected?: boolean;
  className?: string;
}

export const TableCard: React.FC<TableCardProps> = ({
  children,
  onClick,
  selected = false,
  className = '',
}) => {
  return (
    <div
      onClick={onClick}
      className={`
        bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm
        ${onClick ? 'cursor-pointer active:scale-[0.99]' : ''}
        ${selected ? 'ring-2 ring-oaxaca-pink' : 'border border-gray-100 dark:border-gray-700'}
        transition-all
        ${className}
      `}
    >
      {children}
    </div>
  );
};

// ============================================
// Table Card Row
// ============================================

interface TableCardRowProps {
  label: string;
  value: React.ReactNode;
  className?: string;
}

export const TableCardRow: React.FC<TableCardRowProps> = ({
  label,
  value,
  className = '',
}) => {
  return (
    <div className={`flex justify-between items-center py-1.5 ${className}`}>
      <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
      <span className="text-sm font-medium text-gray-900 dark:text-white">{value}</span>
    </div>
  );
};

// ============================================
// Responsive Table Wrapper
// ============================================

interface ResponsiveTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (row: T) => string | number;
  renderCard: (row: T, index: number) => React.ReactNode;
  breakpoint?: 'sm' | 'md' | 'lg';
  tableProps?: Omit<DataTableProps<T>, 'data' | 'columns' | 'keyExtractor'>;
  className?: string;
}

export function ResponsiveTable<T>({
  data,
  columns,
  keyExtractor,
  renderCard,
  breakpoint = 'md',
  tableProps,
  className = '',
}: ResponsiveTableProps<T>) {
  const breakpoints = {
    sm: 'sm:hidden',
    md: 'md:hidden',
    lg: 'lg:hidden',
  };

  const tableBreakpoints = {
    sm: 'hidden sm:block',
    md: 'hidden md:block',
    lg: 'hidden lg:block',
  };

  return (
    <div className={className}>
      {/* Mobile: Cards */}
      <div className={`${breakpoints[breakpoint]} space-y-3`}>
        {data.map((row, index) => (
          <div key={keyExtractor(row)}>
            {renderCard(row, index)}
          </div>
        ))}
      </div>

      {/* Desktop: Table */}
      <div className={tableBreakpoints[breakpoint]}>
        <DataTable
          data={data}
          columns={columns}
          keyExtractor={keyExtractor}
          {...tableProps}
        />
      </div>
    </div>
  );
}

// ============================================
// Status Badge for Tables
// ============================================

interface StatusBadgeProps {
  status: 'success' | 'warning' | 'error' | 'info' | 'neutral';
  label: string;
  size?: 'sm' | 'md';
  dot?: boolean;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  size = 'sm',
  dot = true,
  className = '',
}) => {
  const statusColors = {
    success: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    warning: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    error: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    info: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    neutral: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
  };

  const dotColors = {
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
    neutral: 'bg-gray-500',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
  };

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 rounded-full font-medium
        ${statusColors[status]}
        ${sizes[size]}
        ${className}
      `}
    >
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full ${dotColors[status]}`} />
      )}
      {label}
    </span>
  );
};

// ============================================
// Action Menu for Tables
// ============================================

interface ActionMenuItem {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  variant?: 'default' | 'danger';
  disabled?: boolean;
}

interface ActionMenuProps {
  items: ActionMenuItem[];
  className?: string;
}

export const ActionMenu: React.FC<ActionMenuProps> = ({
  items,
  className = '',
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`} ref={menuRef}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        aria-label="Más acciones"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="6" r="2" />
          <circle cx="12" cy="12" r="2" />
          <circle cx="12" cy="18" r="2" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 min-w-[160px] bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          {items.map((item, index) => (
            <button
              key={index}
              onClick={(e) => {
                e.stopPropagation();
                item.onClick();
                setIsOpen(false);
              }}
              disabled={item.disabled}
              className={`
                w-full px-4 py-2 text-left text-sm flex items-center gap-2
                ${item.variant === 'danger'
                  ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
            >
              {item.icon && <span className="w-4 h-4">{item.icon}</span>}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================
// Table Summary Row
// ============================================

interface TableSummaryProps {
  children: React.ReactNode;
  label?: string;
  className?: string;
}

export const TableSummary: React.FC<TableSummaryProps> = ({
  children,
  label = 'Total',
  className = '',
}) => {
  return (
    <div className={`flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-xl ${className}`}>
      <span className="font-medium text-gray-700 dark:text-gray-300">{label}</span>
      <span className="font-bold text-gray-900 dark:text-white">{children}</span>
    </div>
  );
};
