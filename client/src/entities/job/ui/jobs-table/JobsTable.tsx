import Box from "@mui/material/Box";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import { Exchange, Job } from "@packages/types";
import dayjs from "dayjs";
import React, { FC, ReactNode, useEffect } from "react";
import { useSelector } from "react-redux";
import { useAppDispatch } from "@/shared/lib/hooks/useAppDispatch";
import { getJobList } from "../../model/selectors";
import { initJobs } from "../../model/services/init";

interface JobsTableProps {
  exchanges: Exchange[];
  renderControlButtons: (job: Job) => ReactNode;
}

export const JobsTable: FC<JobsTableProps> = (props) => {
  const { exchanges, renderControlButtons } = props;

  const dispatch = useAppDispatch();
  const jobList = useSelector(getJobList);

  useEffect(() => {
    dispatch(initJobs());
  }, []);

  const renderRow = (job: Job) => {
    const strategyType = job.strategy.type === "local" ? `Local` : `Remote (${job.strategy.type})`;
    const exchangeName = exchanges.find((exchange) => exchange.code === job.exchange)?.name ?? job.exchange;

    return (
      <TableRow key={job.id}>
        <TableCell>{job.id}</TableCell>
        <TableCell>{job.prefix}</TableCell>
        <TableCell>{job.name}</TableCell>
        <TableCell>{job.strategy.name}</TableCell>
        <TableCell>{strategyType}</TableCell>
        <TableCell>{exchangeName}</TableCell>
        <TableCell>{dayjs(job.updatedAt).format("MMM D, YYYY HH:mm")}</TableCell>
        <TableCell>
          <Status isEnabled={job.isEnabled} />
        </TableCell>
        <TableCell>{renderControlButtons(job)}</TableCell>
      </TableRow>
    );
  };

  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableCell>ID</TableCell>
          <TableCell>Prefix</TableCell>
          <TableCell>Name</TableCell>
          <TableCell>Script</TableCell>
          <TableCell>Script Type</TableCell>
          <TableCell>Exchange</TableCell>
          <TableCell>Updated</TableCell>
          <TableCell>Status</TableCell>
          <TableCell />
        </TableRow>
      </TableHead>
      <TableBody>{jobList.map(renderRow)}</TableBody>
    </Table>
  );
};

interface StatusProps {
  isEnabled: boolean;
}

const Status: FC<StatusProps> = (props) => {
  const { isEnabled } = props;

  return (
    <Box
      sx={{
        position: "relative",
        pl: 2,
        "&::before": {
          content: "''",
          position: "absolute",
          left: 0,
          top: "50%",
          transform: "translateY(-50%)",
          height: 10,
          width: 10,
          borderRadius: "50%",
          background: (theme) => (isEnabled ? theme.palette.primary.main : theme.palette.error.main),
        },
      }}
    >
      {isEnabled ? "Running" : "Stopped"}
    </Box>
  );
};
