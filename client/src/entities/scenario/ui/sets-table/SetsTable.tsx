import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import LinearProgress from "@mui/material/LinearProgress";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TablePagination from "@mui/material/TablePagination";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import { ChangeEvent, FC, useMemo, useState } from "react";
import { MouseEvent } from "react";
import { useSelector } from "react-redux";
import { Iconify } from "@/shared/ui/iconify";
import { RouterLink } from "@/shared/ui/router-link";
import { SvgColor } from "@/shared/ui/svg-color";
import { getScenarioExecInfo } from "../../model/selectors";
import { ScenarioSet, ScenarioSetArg } from "../../model/types";

interface SetsTableProps {
  setList: ScenarioSet[];
  onOpenLogs: (artifactsId: string) => void;
  onOpenReportModal: (artifactsId: string, tradingView?: boolean) => void;
}

export const SetsTable: FC<SetsTableProps> = (props) => {
  const { setList, onOpenLogs, onOpenReportModal } = props;

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const handlePageChange = (e: MouseEvent<HTMLButtonElement> | null, page: number) => {
    setPage(page);
  };

  const handleRowsPerPageChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setPage(0);
    setRowsPerPage(parseInt(e.target.value));
  };

  const tableData = useMemo(
    () => [...setList].splice(page * rowsPerPage, rowsPerPage),
    [page, setList, rowsPerPage]
  );

  const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - setList.length) : 0;

  const renderRow = (set: ScenarioSet) => {
    const sets = set.args.filter(({ key }) => key !== "symbol");

    const handleOpenLog = (artifactId: string) => () => onOpenLogs(artifactId);
    const handleOpenReport = (artifactId: string, tradingView?: boolean) => () =>
      onOpenReportModal(artifactId, tradingView);

    return (
      <TableRow key={set.id}>
        <TableCell>{set.args.find(({ key }) => key === "symbol")?.value}</TableCell>
        <TableCell>{sets.map((item: ScenarioSetArg) => `${item.key} = ${item.value}`).join("; ")}</TableCell>
        <TableCell>
          <Status status={set.status} setId={set.id} />
        </TableCell>
        <TableCell>
          <ExecInfo setId={set.id} />
        </TableCell>
        {/*<TableCell>*/}
        {/*  <Stack direction={"row"} alignItems={"center"} gap={1}>*/}
        {/*    <Button variant={"outlined"} size={"small"} onClick={handleOpenReport(set.artifacts, true)}>*/}
        {/*      TradingView*/}
        {/*    </Button>*/}
        {/*    <RouterLink*/}
        {/*      sx={{ display: "flex", alignItems: "center" }}*/}
        {/*      href={`/report/${set.artifacts}?mode=tester`}*/}
        {/*      target={"_blank"}*/}
        {/*    >*/}
        {/*      <SvgColor*/}
        {/*        size={15}*/}
        {/*        color={"#1877F2"}*/}
        {/*        src={"/assets/icons/solid/ic-eva_external-link-outline.svg"}*/}
        {/*      />*/}
        {/*    </RouterLink>*/}
        {/*  </Stack>*/}
        {/*</TableCell>*/}
        <TableCell>
          <Stack direction={"row"} alignItems={"center"} gap={1}>
            <Button
              variant={"outlined"}
              size={"small"}
              disabled={!set.artifacts}
              onClick={handleOpenReport(set.artifacts)}
            >
              Report
            </Button>
            {!!set.artifacts && (
              <RouterLink
                sx={{ display: "flex", alignItems: "center" }}
                href={`/report/${set.artifacts}`}
                target={"_blank"}
              >
                <SvgColor
                  size={15}
                  color={"#1877F2"}
                  src={"/assets/icons/solid/ic-eva_external-link-outline.svg"}
                />
              </RouterLink>
            )}
          </Stack>
        </TableCell>
        <TableCell>
          <Stack direction={"row"} alignItems={"center"} gap={1}>
            <Button
              variant={"outlined"}
              size={"small"}
              disabled={!set.artifacts}
              onClick={handleOpenLog(set.artifacts)}
            >
              Logs
            </Button>
            {!!set.artifacts && (
              <RouterLink
                sx={{ display: "flex", alignItems: "center" }}
                href={`/logs/${set.artifacts}`}
                target={"_blank"}
              >
                <SvgColor
                  size={15}
                  color={"#1877F2"}
                  src={"/assets/icons/solid/ic-eva_external-link-outline.svg"}
                />
              </RouterLink>
            )}
          </Stack>
        </TableCell>
      </TableRow>
    );
  };

  return (
    <TableContainer>
      <Table size={"small"}>
        <TableHead>
          <TableRow>
            <TableCell sx={{ width: 150 }}>Symbol</TableCell>
            <TableCell>Params</TableCell>
            <TableCell sx={{ width: 150 }}>Status</TableCell>
            <TableCell sx={{ width: 250 }}>Usage</TableCell>
            {/*<TableCell sx={{ width: 130 }} />*/}
            <TableCell sx={{ width: 100 }} />
            <TableCell sx={{ width: 150 }} />
          </TableRow>
        </TableHead>
        <TableBody>
          {tableData.map(renderRow)}

          {emptyRows > 0 && (
            <TableRow
              style={{
                height: 43 * emptyRows,
              }}
            >
              <TableCell colSpan={6} />
            </TableRow>
          )}
        </TableBody>
      </Table>
      <TablePagination
        component={"div"}
        count={setList.length}
        page={page}
        rowsPerPage={rowsPerPage}
        rowsPerPageOptions={[10, 15, 20]}
        size={"small"}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
      />
    </TableContainer>
  );
};

interface StatusProps {
  status: number;
  setId: number;
}

const Status: FC<StatusProps> = (props) => {
  const { status, setId } = props;
  const execInfo = useSelector(getScenarioExecInfo);
  const currentInfo = execInfo.find((item) => item.setId === setId);

  switch (status) {
    case 0:
      return (
        <Box
          sx={{
            height: 20,
            width: 20,
            borderRadius: "50%",
            background: "transparent",
            border: `2px solid #1877F2`,
          }}
        ></Box>
      );
    case 1:
      return <Iconify color={"primary.main"} icon={"solar:check-circle-bold"} />;
    case 2:
      return <LinearProgress variant={"determinate"} value={currentInfo?.progress ?? 0} />;
    case 3:
      return <Iconify color={"error.main"} icon={"solar:close-circle-linear"} />;
    default:
      return null;
  }
};

interface ExecInfoProps {
  setId: number;
}

const ExecInfo: FC<ExecInfoProps> = (props) => {
  const { setId } = props;
  const execInfo = useSelector(getScenarioExecInfo);
  const currentInfo = execInfo.find((item) => item.setId === setId);

  return (
    <Stack direction={"row"}>
      <Typography variant={"body2"}>
        CPU: {currentInfo?.cpu ?? "-"}% | Memory: {currentInfo?.memory ?? "-"} Mb
      </Typography>
    </Stack>
  );
};
