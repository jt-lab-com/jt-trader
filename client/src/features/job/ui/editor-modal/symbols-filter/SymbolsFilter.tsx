import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Popover from "@mui/material/Popover";
import { useTheme } from "@mui/material/styles";
import TextField from "@mui/material/TextField";
import { ExchangeMarkets, StrategyDefinedArgsFilters } from "@packages/types";
import { FC, useEffect, useRef, useState, MouseEvent, ChangeEvent, useCallback } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { useBoolean } from "@/shared/lib/hooks/useBoolean";
import { useDebounceValue } from "@/shared/lib/hooks/useDebounceValue";
import { SortOrder } from "@/shared/types";
import { filterMarketSymbols } from "../../../lib/filter-market-symbols";
import { sortMarketSymbols } from "../../../lib/sort-market-symbols";
import { VirtualizedTable } from "./VirtualizedTable";

interface SymbolsFilterProps {
  markets: ExchangeMarkets[] | null;
  definedFilters: StrategyDefinedArgsFilters | undefined;
  loading: boolean;
}

interface FiltersState {
  search: string;
  minVolume: string;
  minLeverage: string;
}

interface SortState {
  order: SortOrder;
  orderBy: "symbol" | "quoteVolume" | "limits.leverage.max";
}

export const SymbolsFilter: FC<SymbolsFilterProps> = (props) => {
  const { markets, definedFilters, loading } = props;

  const [anchorEl, setAnchorEl] = useState<HTMLDivElement | null>(null);
  const tfRef = useRef<HTMLDivElement | null>(null);
  const theme = useTheme();
  const mount = useBoolean();

  const {
    setValue,
    control,
    formState: { errors },
    clearErrors,
  } = useFormContext();

  const selectedSymbols: string[] = useWatch({ control, name: "symbols" });

  const [filtersState, setFiltersState] = useState<FiltersState>(getDefaultFiltersState(definedFilters));
  const [sortState, setSortState] = useState<SortState>({ order: "asc", orderBy: "quoteVolume" });

  const debouncedFilters = useDebounceValue(filtersState, 500);

  const [marketSymbols, setMarketSymbols] = useState(markets ?? []);

  useEffect(() => {
    if (!anchorEl) {
      mount.onFalse();
      return;
    }

    setTimeout(() => {
      mount.onTrue();
    }, 100);
  }, [anchorEl]);

  useEffect(() => {
    setFiltersState(getDefaultFiltersState(definedFilters));
  }, [definedFilters]);

  useEffect(() => {
    if (!markets) return;

    const { search, minVolume, minLeverage } = debouncedFilters;

    const filtered = filterMarketSymbols(markets, {
      search,
      minLeverage: minLeverage ? parseInt(minLeverage) : 0,
      minVolume: minVolume ? parseFloat(minVolume) : 0,
    });

    const sorted = sortMarketSymbols(filtered, { selectedSymbols, ...sortState });

    setMarketSymbols(sorted);
  }, [debouncedFilters, sortState, markets, selectedSymbols]);

  const handleOpenPopover = (e: MouseEvent<HTMLDivElement>) => {
    clearErrors("symbols");
    setAnchorEl(e.currentTarget);

    setTimeout(() => {
      tfRef.current?.focus();
    }, 0);
  };

  const handleClosePopover = () => {
    setAnchorEl(null);
    setFiltersState(getDefaultFiltersState(definedFilters));
  };

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFiltersState((prev) => ({ ...prev, search: e.target.value }));
  };

  const handleVolumeChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFiltersState((prev) => ({ ...prev, minVolume: e.target.value }));
  };

  const handleLeverageChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFiltersState((prev) => ({ ...prev, minLeverage: e.target.value }));
  };

  const handleSortChange = (orderBy: "symbol" | "quoteVolume" | "limits.leverage.max", order: SortOrder) => {
    setSortState({ order, orderBy });
  };

  const handleSymbolsInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.value) {
      setValue("symbols", []);
      return;
    }

    const symbols = e.target.value.split(",").map((symbol) => symbol.toUpperCase());

    if (definedFilters?.maxSymbols && symbols.length > definedFilters.maxSymbols) return;

    setValue("symbols", symbols);
  };

  const handleToggleSymbol = useCallback(
    (symbol: string) => {
      if (selectedSymbols.includes(symbol)) {
        const index = selectedSymbols.indexOf(symbol);
        setValue("symbols", [...selectedSymbols.slice(0, index), ...selectedSymbols.slice(index + 1)]);
        return;
      }

      if (definedFilters?.maxSymbols && selectedSymbols.length >= definedFilters.maxSymbols) return;

      setValue("symbols", [...selectedSymbols, symbol]);
    },
    [selectedSymbols, setValue]
  );

  return (
    <>
      <TextField
        inputRef={tfRef}
        variant={"outlined"}
        label={"Symbols (comma separated)"}
        value={selectedSymbols}
        size={"small"}
        error={!!errors.symbols}
        helperText={errors.symbols?.message?.toString() ?? ""}
        onChange={handleSymbolsInputChange}
        onClick={handleOpenPopover}
        fullWidth
      />

      <Popover
        open={!!anchorEl}
        anchorEl={anchorEl}
        onClose={handleClosePopover}
        disableEnforceFocus
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        slotProps={{
          paper: {
            style: {
              width: tfRef?.current?.offsetWidth ?? "auto",
              height: 350,
              padding: 0,
              background: theme.palette.background.paper,
            },
          },
        }}
      >
        <Box sx={{ padding: 1 }}>
          <Grid container rowSpacing={1} columnSpacing={2}>
            <Grid item md={4}>
              <TextField
                variant={"filled"}
                label={"Search"}
                value={filtersState.search}
                onChange={handleSearchChange}
                size={"small"}
                fullWidth
              />
            </Grid>
            <Grid item md={4}>
              <TextField
                variant={"filled"}
                label={"Min volume"}
                value={filtersState.minVolume}
                disabled={!!definedFilters?.volume?.min}
                type={"number"}
                onChange={handleVolumeChange}
                size={"small"}
                fullWidth
              />
            </Grid>
            <Grid item md={4}>
              <TextField
                variant={"filled"}
                label={"Min leverage"}
                value={filtersState.minLeverage}
                disabled={!!definedFilters?.leverage?.min}
                type={"number"}
                onChange={handleLeverageChange}
                size={"small"}
                fullWidth
              />
            </Grid>
          </Grid>
        </Box>

        {mount.value && (
          <Box sx={{ height: 280 }}>
            <VirtualizedTable
              data={marketSymbols}
              selectedSymbols={selectedSymbols}
              maxSymbols={definedFilters?.maxSymbols}
              order={sortState.order}
              orderBy={sortState.orderBy}
              loading={loading}
              onToggleSymbol={handleToggleSymbol}
              onSortChange={handleSortChange}
            />
          </Box>
        )}
      </Popover>
    </>
  );
};

const getDefaultFiltersState = (definedFilters?: StrategyDefinedArgsFilters) => ({
  search: "",
  minVolume: definedFilters?.volume?.min ? definedFilters?.volume?.min?.toString() : "",
  minLeverage: definedFilters?.leverage?.min ? definedFilters?.leverage?.min?.toString() : "",
});
