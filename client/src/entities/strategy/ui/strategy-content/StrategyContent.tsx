import Box from "@mui/material/Box";
import { useTheme } from "@mui/material/styles";
import { FC, useEffect } from "react";
import { useSelector } from "react-redux";
import SyntaxHighlighter from "react-syntax-highlighter";
import { xcode, dracula } from "react-syntax-highlighter/dist/cjs/styles/hljs";
import { useAppDispatch } from "@/shared/lib/hooks/useAppDispatch";
import { Scrollbar } from "@/shared/ui/scrollbar";
import { getStrategyContent } from "../../model/selectors";
import { fetchStrategyContent } from "../../model/services/fetch-strategy-content";

interface ContentProps {
  strategyPath: string;
  height?: number;
}

export const StrategyContent: FC<ContentProps> = (props) => {
  const { strategyPath, height = 400 } = props;

  const dispatch = useAppDispatch();
  const content = useSelector(getStrategyContent(strategyPath));
  const theme = useTheme();
  const isDarkTheme = theme.palette.mode === "dark";

  useEffect(() => {
    if (!content && strategyPath) {
      dispatch(fetchStrategyContent(strategyPath));
    }
  }, [strategyPath]);

  return (
    <Box>
      <Scrollbar sx={{ height }}>
        <SyntaxHighlighter
          language="javascript"
          style={isDarkTheme ? dracula : xcode}
          showLineNumbers
          wrapLines
          customStyle={{ height, marginTop: 0, marginBottom: 0 }}
        >
          {content}
        </SyntaxHighlighter>
      </Scrollbar>
    </Box>
  );
};
