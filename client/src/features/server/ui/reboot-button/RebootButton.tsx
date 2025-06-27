import LoadingButton from "@mui/lab/LoadingButton";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import React, { FC, useState } from "react";
import { useBoolean } from "@/shared/lib/hooks/useBoolean";
import { Iconify } from "@/shared/ui/iconify";
import { rebootServer } from "../../model/services/reboot";

interface RebootButtonProps {}

export const RebootButton: FC<RebootButtonProps> = () => {
  const [isRebooting, setIsRebooting] = useState(false);
  const modal = useBoolean();

  const handleReboot = () => {
    setIsRebooting(true);
    rebootServer();
    modal.onFalse();
    setTimeout(() => {
      document.location.reload();
    }, 5000);
  };

  return (
    <>
      <LoadingButton
        variant={"outlined"}
        color={"info"}
        size={"small"}
        loading={isRebooting}
        onClick={modal.onTrue}
        startIcon={<Iconify width={15} icon={"solar:refresh-broken"} />}
      >
        Reboot server
      </LoadingButton>

      <Dialog open={modal.value} onClose={modal.onFalse}>
        <DialogTitle>Reboot Server</DialogTitle>
        <DialogContent>
          Are you sure you want to reboot the server? All running processes will be stopped.
        </DialogContent>
        <DialogActions>
          <Button onClick={modal.onFalse}>Cancel</Button>
          <Button variant={"contained"} onClick={handleReboot}>
            Reboot
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
