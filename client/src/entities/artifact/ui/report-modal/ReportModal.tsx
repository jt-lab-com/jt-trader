import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import { FC, useEffect } from "react";
import { useArtifact } from "../../lib/hooks/useArtifact";
import { Report } from "../report/Report";

interface ReportModalProps {
  open: boolean;
  artifactsId?: string;
  onClose: VoidFunction;
}

export const ReportModal: FC<ReportModalProps> = (props) => {
  const { artifactsId, open, onClose } = props;

  const { artifact, isLoading } = useArtifact({ artifactsId });

  useEffect(() => {
    if (!isLoading && !artifact) {
      onClose();
    }
  }, [artifact, isLoading]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth={"xl"} fullWidth>
      <DialogContent sx={{ py: 3 }}>
        {isLoading && <CircularProgress />}
        {artifact && <Report artifact={artifact} />}
      </DialogContent>
    </Dialog>
  );
};
