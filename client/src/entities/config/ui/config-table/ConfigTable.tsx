import { useTheme } from "@mui/material/styles";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import { Exchange } from "@packages/types";
import { FC, ReactNode } from "react";
import { Dot } from "@/shared/ui/dot";
import { useConfig } from "../../lib/hooks/useConfig";

interface ConfigTableProps {
  renderControls: (exchange: Exchange) => ReactNode;
}

export const ConfigTable: FC<ConfigTableProps> = (props) => {
  const { renderControls } = props;
  const { exchanges } = useConfig();
  const theme = useTheme();

  const renderRow = (exchange: Exchange) => {
    return (
      <TableRow key={exchange.code}>
        <TableCell>{exchange.name}</TableCell>
        <TableCell align={"center"}>
          <Dot
            sx={{ mx: "auto" }}
            color={exchange.connected ? theme.palette.primary.main : theme.palette.error.main}
          />
        </TableCell>
        <TableCell>{renderControls(exchange)}</TableCell>
      </TableRow>
    );
  };

  return (
    <Table size={"small"}>
      <TableHead>
        <TableRow>
          <TableCell>Exchange</TableCell>
          <TableCell width={50} align={"center"}>
            Status
          </TableCell>
          <TableCell width={100} />
        </TableRow>
      </TableHead>
      <TableBody>{exchanges.main?.map(renderRow)}</TableBody>
    </Table>
  );
};
