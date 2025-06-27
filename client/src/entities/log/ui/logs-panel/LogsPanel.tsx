import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import { styled } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import React, { FC, useEffect, useState, useRef, useLayoutEffect } from "react";
import { useBoolean } from "@/shared/lib/hooks/useBoolean";
import { Iconify } from "@/shared/ui/iconify";
import { LogProcess, LogsPanelRef } from "../../model/types";
import { LogsContainer } from "../logs-container/LogsContainer";

interface LogsPanelProps {
  initialArtifactsId: string;
  processes: LogProcess[];
  onRef?: (ref: LogsPanelRef) => void;
}

export const LogsPanel: FC<LogsPanelProps> = (props) => {
  const { initialArtifactsId, processes, onRef } = props;

  const isDrugRef = useRef(false);
  const [isMount, setIsMount] = useState(false);
  const panelState = useBoolean();
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    onRef?.({ toggle: panelState.onToggle, setActive: panelState.setValue });
    setIsMount(true);
  }, []);

  useLayoutEffect(() => {
    let animationId: number;

    const handleMouseMove = function (e: MouseEvent) {
      if (!isDrugRef.current) return;
      window.document.body.style.userSelect = "none";

      const minHeight = window.innerHeight - (window.innerHeight / 100) * 90;
      const maxHeight = window.innerHeight - 100;
      const height = window.innerHeight - e.y;
      if (height <= minHeight || height >= maxHeight) return;

      if (animationId) {
        window.cancelAnimationFrame(animationId);
      }

      animationId = requestAnimationFrame(() => {
        if (!panelRef.current) return;

        panelRef.current.style.height = `${height}px`;
      });
    };

    const handleMouseUp = () => {
      if (!panelRef.current) return;
      isDrugRef.current = false;
      window.document.body.style.userSelect = "auto";
      panelRef.current.style.transition = "all 0.2s ease-in-out";
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  useEffect(() => {
    if (!isMount) return;
    if (panelRef.current) {
      if (panelState.value) {
        panelRef.current.style.transform = `translateY(0)`;
      } else {
        const height = panelRef.current?.clientHeight;
        panelRef.current.style.transform = `translateY(${height - 30}px)`;
      }
    }
  }, [panelState.value]);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!panelState.value || !panelRef.current) return;
    if ((e.target as HTMLDivElement).id !== "logs-panel-header") return;
    isDrugRef.current = true;
    panelRef.current.style.transition = "none";
  };

  return (
    <Panel ref={panelRef}>
      <Header id={"logs-panel-header"} isActive={panelState.value} onMouseDown={handleMouseDown}>
        <Typography variant={"caption"}>Logs</Typography>
        <Button
          sx={{ minWidth: "auto", p: 0.2, height: 25, width: 25 }}
          size={"small"}
          variant={"outlined"}
          onClick={panelState.onToggle}
        >
          <Iconify
            width={15}
            icon={panelState.value ? "solar:alt-arrow-down-outline" : "solar:alt-arrow-up-outline"}
          />
        </Button>
      </Header>

      <LogsContainer initialArtifactsId={initialArtifactsId} processes={processes} />
    </Panel>
  );
};

const Panel = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  position: "fixed",
  left: 0,
  right: 0,
  bottom: 0,
  height: "40vh",
  transition: "all 0.2s ease-in-out",
  transform: "translateY(calc(40vh - 30px))",
  zIndex: 10,
  resize: "vertical",
  background: theme.palette.background.neutral,
}));

const Header = styled(Box, { shouldForwardProp: (prop) => prop !== "isActive" })<{ isActive: boolean }>(
  ({ theme, isActive }) => ({
    position: "relative",
    padding: "8px 16px",
    display: "flex",
    justifyContent: "space-between",
    borderTop: `1px solid ${theme.palette.divider}`,
    borderBottom: `1px solid ${theme.palette.divider}`,
    alignItems: "center",
    cursor: isActive ? "row-resize" : "pointer",
    height: 30,
  })
);
