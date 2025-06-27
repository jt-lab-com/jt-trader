import Box from "@mui/material/Box";
import Checkbox from "@mui/material/Checkbox";
import CircularProgress from "@mui/material/CircularProgress";
import { useTheme } from "@mui/material/styles";
import SvgIcon, { SvgIconProps } from "@mui/material/SvgIcon";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TableSortLabel from "@mui/material/TableSortLabel";
import Typography from "@mui/material/Typography";
import { ExchangeMarkets } from "@packages/types";
import { get } from "lodash";
import { FC, forwardRef, useCallback, useMemo } from "react";
import { TableVirtuoso, TableComponents } from "react-virtuoso";
import { fCurrency } from "@/shared/lib/utils/format-number";
import { SortOrder } from "@/shared/types";

interface VirtualizedTableProps {
  data: ExchangeMarkets[];
  selectedSymbols: string[];
  maxSymbols?: number;
  order: SortOrder;
  orderBy: string;
  loading: boolean;
  onSortChange: (key: "symbol" | "quoteVolume" | "limits.leverage.max", order: SortOrder) => void;
  onToggleSymbol: (symbol: string) => void;
}

const SortIcon = (props: SvgIconProps) => (
  <SvgIcon {...props}>
    <path
      fill="currentColor"
      d="m8.303 11.596l3.327-3.431a.5.5 0 0 1 .74 0l6.43 6.63c.401.414.158 1.205-.37 1.205h-5.723z"
      opacity="0.7"
    />
    <path fill="currentColor" d="M11.293 16H5.57c-.528 0-.771-.791-.37-1.205l2.406-2.482z" opacity="0.5" />
  </SvgIcon>
);

export const VirtualizedTable: FC<VirtualizedTableProps> = (props) => {
  const { data, selectedSymbols, maxSymbols, order, orderBy, loading, onToggleSymbol, onSortChange } = props;

  const theme = useTheme();

  const tableComponents: TableComponents<ExchangeMarkets> = useMemo(
    () => ({
      Scroller: forwardRef<HTMLDivElement>((props, ref) => <TableContainer {...props} ref={ref} />),
      Table: (props) => <Table {...props} size={"small"} />,
      TableHead: forwardRef<HTMLTableSectionElement>((props, ref) => <TableHead {...props} ref={ref} />),
      TableRow,
      TableBody: forwardRef<HTMLTableSectionElement>((props, ref) => <TableBody {...props} ref={ref} />),
    }),
    []
  );

  const columns = [
    {
      label: "",
      width: 0,
      rowKey: "" as const,
      currency: false,
      checkbox: true,
    },
    {
      label: "Symbol",
      width: 200,
      rowKey: "symbol" as const,
      currency: false,
      checkbox: false,
    },
    {
      label: "Volume",
      width: 200,
      rowKey: "quoteVolume" as const,
      currency: true,
      checkbox: false,
    },
    {
      label: "Leverage",
      width: 200,
      rowKey: "limits.leverage.max" as const,
      currency: false,
      checkbox: false,
    },
  ];

  const createSortHandler = (key: "symbol" | "quoteVolume" | "limits.leverage.max") => () => {
    const isAsc = orderBy === key && order === "asc";
    onSortChange(key, isAsc ? "desc" : "asc");
  };

  const handleToggleSymbol = useCallback(
    (symbol: string) => () => {
      onToggleSymbol(symbol);
    },
    [onToggleSymbol]
  );

  const fixedHeaderContent = useCallback(() => {
    return (
      <TableRow>
        {columns.map((col) => (
          <TableCell
            key={col.rowKey}
            sx={{ background: theme.palette.background.neutral, fontWeight: 400 }}
            padding={col.checkbox ? "checkbox" : "normal"}
            sortDirection={orderBy === col.rowKey ? order : false}
            width={col.width}
            align={col.checkbox ? "center" : "left"}
          >
            {col.rowKey ? (
              <TableSortLabel
                hideSortIcon
                active={orderBy === col.rowKey}
                direction={orderBy === col.rowKey ? order : "asc"}
                IconComponent={SortIcon}
                onClick={createSortHandler(col.rowKey)}
              >
                <Typography variant={"caption"} color={"text.disabled"}>
                  {col.label}
                </Typography>
              </TableSortLabel>
            ) : (
              <Typography variant={"caption"} color={"text.disabled"}>
                {col.label}
              </Typography>
            )}
          </TableCell>
        ))}
      </TableRow>
    );
  }, [columns, order, orderBy, createSortHandler]);

  const rowContent = useCallback(
    (_index: number, row: ExchangeMarkets) => {
      const checked = selectedSymbols.includes(row.symbol);

      return (
        <>
          {columns.map((col) => (
            <TableCell key={col.rowKey} padding={col.checkbox ? "checkbox" : "normal"}>
              {col.checkbox ? (
                <Checkbox
                  checked={checked}
                  onChange={handleToggleSymbol(row.symbol)}
                  disabled={maxSymbols ? selectedSymbols.length >= maxSymbols && !checked : false}
                />
              ) : (
                <>{col.currency ? fCurrency(get(row, col.rowKey, "")) : get(row, col.rowKey)}</>
              )}
            </TableCell>
          ))}
        </>
      );
    },
    [selectedSymbols, handleToggleSymbol]
  );

  if (loading) {
    return (
      <Box
        sx={{
          height: "100%",
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress color={"primary"} />
      </Box>
    );
  }

  if (!loading && !data.length) {
    return (
      <Box
        sx={{
          height: "100%",
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Typography variant={"body2"} color={"text.disabled"}>
          Select an exchange to display assets
        </Typography>
      </Box>
    );
  }

  return (
    <TableVirtuoso
      data={data}
      components={tableComponents}
      fixedHeaderContent={fixedHeaderContent}
      itemContent={rowContent}
    />
  );
};
