import Box from "@mui/material/Box";
import { FC } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { Table } from "@/shared/ui/table";
import {
  ActionButtonData,
  ArtifactBlock,
  ArtifactBlockType,
  CardData,
  ChartData,
  TableData,
  TextBlockData,
  TradingViewChartData,
} from "../../model/types";
import { ActionButtonList } from "../widgets/action-button/ActionButtonList";
import { CardList } from "../widgets/card-list/CardList";
import { Chart } from "../widgets/chart/Chart";
import { TextBlock } from "../widgets/text-block/TextBlock";
import { TradingViewChart } from "../widgets/trading-view-chart/TradingViewChart";
import { BlockContainer } from "./BlockContainer";

interface BlockListProps {
  artifactId: string;
  blocks: ArtifactBlock[];
}

export const BlockList: FC<BlockListProps> = (props) => {
  const { artifactId, blocks } = props;

  const handleLogError = (e: Error) => {
    console.error(e);
  };

  return (
    <>
      {blocks.map((block) => {
        if (!block.isVisible) return null;

        switch (block.type) {
          case ArtifactBlockType.TABLE:
            if (Array.isArray(block.data) && !block.data.length) return null;
            return (
              <ErrorBoundary fallback={null} onError={handleLogError}>
                <BlockContainer
                  key={`${block.type}-${block.name}`}
                  sx={{ flex: blocks.length === 1 ? "1 0 auto" : "0 0 auto" }}
                  name={block.name}
                >
                  <Box sx={{ px: 3, pb: 3 }}>
                    <Table
                      data={block.data as TableData[]}
                      title={block.name}
                      fullHeight={blocks.length === 1}
                    />
                  </Box>
                </BlockContainer>
              </ErrorBoundary>
            );
          case ArtifactBlockType.CHART:
            return (
              <ErrorBoundary fallback={null} onError={handleLogError}>
                <BlockContainer key={`${block.type}-${block.name}`} name={block.name}>
                  <Chart data={block.data as ChartData} />
                </BlockContainer>
              </ErrorBoundary>
            );
          case ArtifactBlockType.TRADING_VIEW_CHART:
            return (
              <ErrorBoundary fallback={null} onError={handleLogError}>
                <BlockContainer key={`${block.type}-${block.name}`} name={block.name}>
                  <TradingViewChart data={block.data as TradingViewChartData} />
                </BlockContainer>
              </ErrorBoundary>
            );
          case ArtifactBlockType.TEXT:
            return (
              <ErrorBoundary fallback={null} onError={handleLogError}>
                <TextBlock key={`${block.type}-${block.name}`} data={block.data as TextBlockData} />
              </ErrorBoundary>
            );
          case ArtifactBlockType.CARD_LIST:
            return <CardList key={`${block.type}-${block.name}`} list={block.data as CardData[]} />;
          case ArtifactBlockType.ACTION_BUTTON_LIST:
            return (
              <ActionButtonList
                key={`${block.type}-${block.name}`}
                artifactId={artifactId}
                data={block.data as ActionButtonData[]}
              />
            );
        }
      })}
    </>
  );
};
