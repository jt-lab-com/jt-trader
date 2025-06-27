import { useTheme } from "@mui/material/styles";
import { RowComponent } from "tabulator-tables";
import { Table } from "@/shared/ui/table";

interface LogsTableProps<T> {
  data: T[];
}

export const LogsTable = <T extends object>(props: LogsTableProps<T>) => {
  const theme = useTheme();

  if (!props.data.length) return null;

  const rowFormatter = (row: RowComponent) => {
    const data = row.getData();
    const element = row.getElement();

    switch (data.level) {
      case "warn":
        element.style.background = theme.palette.warning.lighter;
        element.style.color = "#000";
        element.style.borderBottom = "1px solid black";
        break;
      case "error":
        element.style.background = "rgb(247, 212, 214)";
        element.style.color = "#000";
        element.style.borderBottom = "1px solid black";
        break;
    }
  };

  return <Table data={props.data} fullHeight rowHeight={30} rowFormatter={rowFormatter} />;
};
