import Button, { ButtonProps } from "@mui/material/Button";
import { FC } from "react";
import { SvgColor } from "@/shared/ui/svg-color";

interface PlayButtonProps extends ButtonProps {
  isPlaying: boolean;
  isEnd: boolean;
  onClick: VoidFunction;
}

export const PlayButton: FC<PlayButtonProps> = (props) => {
  const { isPlaying, isEnd, onClick, ...rest } = props;

  const icon = isPlaying ? "ic-solar_pause" : isEnd ? "ic-solar_restart" : "ic-solar_play";
  const text = isPlaying ? "Pause" : isEnd ? "Replay" : "Play";

  return (
    <Button
      variant={"outlined"}
      onClick={onClick}
      size={"medium"}
      startIcon={<SvgColor size={15} src={`/assets/icons/solid/${icon}.svg`} />}
      {...rest}
    >
      {text}
    </Button>
  );
};
