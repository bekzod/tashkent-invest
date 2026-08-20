"use client";

import type { Key, ReactNode } from "react";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "./table";

type ListTableAlign = "left" | "center" | "right";

const alignClass: Record<ListTableAlign, string> = {
  left: "",
  center: "is-center",
  right: "is-right",
};

function joinClassNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export interface ListTableColumn<TData> {
  id: string;
  header: ReactNode;
  cell?: (row: TData, rowIndex: number) => ReactNode;
  headerClassName?: string;
  cellClassName?: string;
  align?: ListTableAlign;
}

export interface ListTableProps<TData> {
  columns: ListTableColumn<TData>[];
  data?: TData[];
  getRowId?: (row: TData, index: number) => Key;
  rowClassName?: (row: TData) => string | undefined;
  loading?: boolean;
  skeletonRowCount?: number;
  emptyState?: ReactNode;
  footer?: ReactNode;
  tableClassName?: string;
}

export function ListTable<TData>({
  columns,
  data = [],
  getRowId,
  rowClassName,
  loading = false,
  skeletonRowCount = 6,
  emptyState,
  footer,
  tableClassName,
}: ListTableProps<TData>) {
  const loadingRows = Array.from({ length: skeletonRowCount }, (_, index) => index);

  return (
    <div className="list-table-card">
      <Table className={tableClassName}>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead
                key={column.id}
                className={joinClassNames(column.align ? alignClass[column.align] : undefined, column.headerClassName)}
              >
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading
            ? loadingRows.map((row) => (
                <TableRow key={row}>
                  {columns.map((column, index) => (
                    <TableCell key={column.id} className={column.align ? alignClass[column.align] : undefined}>
                      <span className={`table-skeleton table-skeleton-${(index % 3) + 1}`} />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            : data.map((row, index) => (
                <TableRow key={getRowId ? getRowId(row, index) : index} className={rowClassName?.(row)}>
                  {columns.map((column) => (
                    <TableCell
                      key={column.id}
                      className={joinClassNames(column.align ? alignClass[column.align] : undefined, column.cellClassName)}
                    >
                      {column.cell ? column.cell(row, index) : null}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
        </TableBody>
        {footer ? <TableFooter>{footer}</TableFooter> : null}
      </Table>
      {!loading && !data.length && emptyState ? <div className="list-table-empty">{emptyState}</div> : null}
    </div>
  );
}
