import { ActionButtonData, ArtifactBlock, ArtifactBlockType, CardData } from "../../model/types";

export const groupBlocks = (blocks: ArtifactBlock[]) => {
  if (!blocks) return [];

  const result = [];

  let cardsGroup: CardData[] = [];
  let buttonsGroup: ActionButtonData[] = [];

  for (const block of blocks) {
    if (!block || !block.isVisible) continue;

    if (block.type === ArtifactBlockType.CARD) {
      if (buttonsGroup.length) {
        result.push({ type: ArtifactBlockType.ACTION_BUTTON_LIST, isVisible: true, data: buttonsGroup });
        buttonsGroup = [];
      }

      cardsGroup.push(block.data as CardData);
      continue;
    }

    if (block.type === ArtifactBlockType.ACTION_BUTTON) {
      if (cardsGroup.length) {
        result.push({ type: ArtifactBlockType.CARD_LIST, isVisible: true, data: cardsGroup });
        cardsGroup = [];
      }

      buttonsGroup.push(block.data as ActionButtonData);
      continue;
    }

    if (buttonsGroup.length) {
      result.push({ type: ArtifactBlockType.ACTION_BUTTON_LIST, isVisible: true, data: buttonsGroup });
      buttonsGroup = [];
    }

    if (cardsGroup.length) {
      result.push({ type: ArtifactBlockType.CARD_LIST, isVisible: true, data: cardsGroup });
      cardsGroup = [];
    }

    result.push(block);
  }

  if (buttonsGroup.length) {
    result.push({ type: ArtifactBlockType.ACTION_BUTTON_LIST, isVisible: true, data: buttonsGroup });
  }

  if (cardsGroup.length) {
    result.push({ type: ArtifactBlockType.CARD_LIST, isVisible: true, data: cardsGroup });
  }

  return result;
};
