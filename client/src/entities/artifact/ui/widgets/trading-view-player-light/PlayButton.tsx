import Button from "@mui/material/Button";
import { FC } from "react";
import { SvgColor } from "@/shared/ui/svg-color";

interface PlayButtonProps {
  isPlaying: boolean;
  onClick: VoidFunction;
}

export const PlayButton: FC<PlayButtonProps> = (props) => {
  const { isPlaying, onClick } = props;

  return (
    <Button
      variant={"outlined"}
      onClick={onClick}
      size={"medium"}
      startIcon={
        <SvgColor
          size={15}
          src={`/assets/icons/solid/${isPlaying ? "ic-solar_pause" : "ic-solar_play"}.svg`}
        />
      }
    >
      {isPlaying ? "Pause" : "Play"}
    </Button>
  );
};
