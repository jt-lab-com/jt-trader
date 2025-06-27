import { Dialog, DialogContent } from "@mui/material";
import Box from "@mui/material/Box";
import Link from "@mui/material/Link";
import { nanoid } from "nanoid";
import { useEffect, useRef, useState, cloneElement, ReactElement } from "react";
import { createRoot } from "react-dom/client";
import ReactJson from "react-json-view";
import { CellComponent, Editor, RowComponent, TabulatorFull as Tabulator } from "tabulator-tables";
import { useBoolean } from "../../lib/hooks/useBoolean";
import { useLayoutSettings } from "../../lib/hooks/useLayoutSettings";
import { downloadCSV } from "../../lib/utils/download";

function reactFormatter(JSX: ReactElement) {
  return function customFormatter(
    cell: CellComponent,
    formatterParams: unknown,
    onRendered: (callback: () => void) => void
  ) {
    // cell - the cell component
    // formatterParams - parameters set for the column
    // onRendered - function to call when the formatter has been rendered
    const renderFn = () => {
      const cellEl = cell.getElement();
      if (cellEl) {
        const formatterCell = cellEl.querySelector(".formatterCell");
        if (formatterCell) {
          const CompWithMoreProps = cloneElement(JSX, { cell });
          const root = createRoot(formatterCell);
          root.render(CompWithMoreProps);
        }
      }
    };

    onRendered(renderFn); // initial render only.

    setTimeout(() => {
      renderFn(); // render every time cell value changed.
    }, 0);
    return '<div class="formatterCell"></div>';
  };
}

const getLinkName = (link: string) => {
  link = link.replace("_link", "").toLowerCase();
  return link[0].toUpperCase() + link.slice(1);
};

const ReportLink = (props: { cell?: unknown }) => {
  // @ts-expect-error fix
  const link = props.cell._cell.value;
  return (
    <Link href={link} target={"_blank"}>
      {getLinkName(
        // @ts-expect-error fix
        props.cell._cell.column.field
      )}
    </Link>
  );
};

interface TabulatorTableProps<T> {
  title?: string;
  data: T[];
  fullHeight?: boolean;
  rowHeight?: number;
  rowFormatter?: (row: RowComponent) => void;
  onDataFiltered?: (rows: T[]) => void;
  onDataSorted?: (rows: T[]) => void;
}

export const Table = <T extends object>(props: TabulatorTableProps<T>) => {
  const { themeMode } = useLayoutSettings();

  const ready = useBoolean();

  useEffect(() => {
    const importStyles = async () => {
      if (themeMode === "dark") {
        await import("tabulator-tables/dist/css/tabulator_midnight.css");
        await import("./Table.dark.css");
      } else {
        await import("tabulator-tables/dist/css/tabulator.min.css");
        await import("./Table.light.css");
      }

      ready.onTrue();
    };

    void importStyles();
  }, [themeMode]);

  if (!ready.value) return null;

  return <TabulatorTable {...props} />;
};

const TabulatorTable = <T extends object>(props: TabulatorTableProps<T>) => {
  const { data, title, fullHeight, rowHeight, rowFormatter, onDataFiltered } = props;

  const instanceRef = useRef<Tabulator | null>(null);
  const nodeRef = useRef<HTMLDivElement | null>(null);
  const tableData = useRef<Record<string, unknown>[]>([]);
  const [json, setJson] = useState<object | null>(null);
  const jsonModal = useBoolean();
  const { themeMode } = useLayoutSettings();

  useEffect(() => {
    const importStyles = async () => {
      if (themeMode === "dark") {
        await import("tabulator-tables/dist/css/tabulator_midnight.css");
        await import("./Table.dark.css");
      } else {
        await import("tabulator-tables/dist/css/tabulator.min.css");
        await import("./Table.light.css");
      }
    };

    void importStyles();
  }, [themeMode]);

  useEffect(() => {
    if (!nodeRef.current || !data || !data.length) return;

    try {
      const { tableData: formattedData, columns } = formatTableData(data);

      tableData.current = formattedData;

      const downloadCsvButtonId = nanoid(8);

      instanceRef.current = new Tabulator(nodeRef.current, {
        data: tableData.current,
        columns,
        // height: fullHeight ? "100%" : 400,
        height: "100%",
        minHeight: 300,
        layout: "fitDataStretch",
        ...(rowHeight && { rowHeight }),
        ...(rowFormatter && { rowFormatter }),
        pagination: true,
        footerElement: `<button id='${downloadCsvButtonId}' class='download-csv'>Download CSV</button>`,
      });

      instanceRef.current?.on("tableBuilt", () => {
        document.getElementById(downloadCsvButtonId)?.addEventListener("click", handleDownloadCsv);
        instanceRef.current?.replaceData(tableData.current);
      });

      instanceRef.current.on("dataFiltered", (filters, rows) => {
        onDataFiltered?.(rows.map((row) => row.getData()));
      });
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    if (!data || !data.length) return;
    try {
      const { tableData: formattedData } = formatTableData(data);
      tableData.current = formattedData;
      instanceRef.current?.replaceData(formattedData);
    } catch (e) {
      console.error(e);
    }
  }, [data]);

  const formatTableData = (data: T[]) => {
    const allKeys = new Set<string>();
    data.forEach((row) => Object.keys(row).forEach((key) => allKeys.add(key)));
    data = [...data].map((row) => {
      const res = { ...row };
      allKeys.forEach((key) => {
        if (res[key as keyof T]) return;
        // @ts-expect-error fix
        res[key as keyof T] = "";
      });
      return res;
    });

    const columns = Object.entries(data?.[0])?.map(([key, value]) => ({
      title: key.endsWith("_link") ? getLinkName(key) : key,
      field: key,
      sorter: typeof value as "string" | "number" | "boolean" | "time" | "date" | "datetime" | "array",
      headerFilter: "input" as Editor | undefined,
      maxWidth: 1000,
      maxHeight: 30,
      cellClick: handleCellClicked,
      ...(key.endsWith("_link") && { formatter: reactFormatter(<ReportLink />) }),
    }));

    const tableData = data.map((row) => {
      return Object.entries(row).reduce<Record<string, unknown>>((res, [key, value]) => {
        res[key] = value;
        if (typeof value === "object") {
          res[key] = JSON.stringify(value);
        }

        return res;
      }, {});
    });

    return {
      columns,
      tableData,
    };
  };

  const handleCellClicked = (e: UIEvent, cell: CellComponent) => {
    const value = cell.getValue();
    const page = instanceRef.current?.getPage();
    try {
      const json = JSON.parse(value);
      if (typeof json === "object" && page) {
        setJson(json);
        jsonModal.onTrue();
      }
    } catch (e) {
      /* empty */
    }
  };

  const handleDownloadCsv = () => {
    const headers = Object.keys(tableData.current[0]);

    const csvRows = [];
    csvRows.push(headers.join(";"));

    for (const row of tableData.current) {
      const values = headers.map((header) => row[header]);
      csvRows.push(values.join(";"));
    }

    downloadCSV(csvRows.join("\n"), `${title ?? "table-data"}`);
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", maxWidth: "100%", height: "100%" }}>
      <Box ref={nodeRef} />

      <Dialog
        open={jsonModal.value}
        onClose={jsonModal.onFalse}
        maxWidth={"xl"}
        fullWidth
        disableEnforceFocus
      >
        <DialogContent sx={{ p: 3, backgroundColor: themeMode === "dark" ? "rgb(44, 62, 80)" : "white" }}>
          {json && (
            <ReactJson
              theme={themeMode === "dark" ? "flat" : "rjv-default"}
              src={json}
              displayDataTypes={false}
              quotesOnKeys={false}
            />
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};
