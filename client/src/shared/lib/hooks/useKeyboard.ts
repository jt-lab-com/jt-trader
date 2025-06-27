import React, { KeyboardEventHandler, useCallback, useEffect } from "react";
import { KeyMod } from "../../const/keyboard";
import { isMac } from "../is-mac";

interface UseKeyboardResult {
  bindings: {
    onKeyDown: KeyboardEventHandler;
    onKeyDownCapture: KeyboardEventHandler;
    onKeyPress: KeyboardEventHandler;
    onKeyPressCapture: KeyboardEventHandler;
    onKeyUp: KeyboardEventHandler;
    onKeyUpCapture: KeyboardEventHandler;
  };
}

export type UseKeyboardHandler = (event: React.KeyboardEvent | KeyboardEvent) => void;

type UseKeyboard = (callback: UseKeyboardHandler, keyBindings: Array<number> | number) => UseKeyboardResult;

export const useKeyboard: UseKeyboard = (callback, keyBindings): UseKeyboardResult => {
  const bindings = Array.isArray(keyBindings) ? (keyBindings as number[]) : [keyBindings];

  const event = "keydown";
  const capture = false;

  const activeModMap = getActiveModMap(bindings);
  const keyCode = bindings.filter((item: number) => !KeyMod[item]);
  const { CtrlCmd, WinCtrl } = getCtrlKeysByPlatform();

  const eventHandler = useCallback(
    (event: React.KeyboardEvent | KeyboardEvent) => {
      if (activeModMap.Shift && !event.shiftKey) return;
      if (activeModMap.Alt && !event.altKey) return;
      if (activeModMap.CtrlCmd && !event[CtrlCmd]) return;
      if (activeModMap.WinCtrl && !event[WinCtrl]) return;
      const hitOne = keyCode.find((k) => k === event.keyCode);
      if (keyCode && !hitOne) return;

      event.preventDefault();

      // if (stopPropagation) {
      //   event.stopPropagation();
      // }
      //
      // if (preventDefault) {
      //   event.preventDefault();
      // }

      callback && callback(event);
    },
    [callback]
  );

  useEffect(() => {
    document.addEventListener(event, eventHandler);

    return () => {
      document.removeEventListener(event, eventHandler);
    };
  }, [eventHandler]);

  const elementBindingHandler = (
    elementEventType: "keydown" | "keypress" | "keyup",
    isCapture: boolean = false
  ) => {
    if (elementEventType !== event) return () => {};
    if (isCapture !== capture) return () => {};
    return (e: React.KeyboardEvent | KeyboardEvent) => eventHandler(e);
  };

  return {
    bindings: {
      onKeyDown: elementBindingHandler("keydown"),
      onKeyDownCapture: elementBindingHandler("keydown", true),
      onKeyPress: elementBindingHandler("keypress"),
      onKeyPressCapture: elementBindingHandler("keypress", true),
      onKeyUp: elementBindingHandler("keyup"),
      onKeyUpCapture: elementBindingHandler("keyup", true),
    },
  };
};

const getCtrlKeysByPlatform = (): Record<string, "metaKey" | "ctrlKey"> => {
  return {
    CtrlCmd: isMac() ? "metaKey" : "ctrlKey",
    WinCtrl: isMac() ? "ctrlKey" : "metaKey",
  };
};

const getActiveModMap = (bindings: number[]): Record<keyof typeof KeyMod, boolean> => {
  const modBindings = bindings.filter((item: number) => !!KeyMod[item]);
  const activeModMap: Record<keyof typeof KeyMod, boolean> = {
    CtrlCmd: false,
    Shift: false,
    Alt: false,
    WinCtrl: false,
  };
  modBindings.forEach((code) => {
    const modKey = KeyMod[code] as keyof typeof KeyMod;
    activeModMap[modKey] = true;
  });
  return activeModMap;
};
