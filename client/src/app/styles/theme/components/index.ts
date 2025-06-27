import { Theme } from "@mui/material/styles";
import merge from "lodash/merge";
import { autocomplete } from "./autocomplete";
import { button } from "./button";
import { card } from "./card";
import { checkbox } from "./checkbox";
import { dialog } from "./dialog";
import { link } from "./link";
import { list } from "./list";
import { menu } from "./menu";
import { paper } from "./paper";
import { popover } from "./popover";
import { progress } from "./progress";
import { select } from "./select";
import { stack } from "./stack";
import { switchComponent } from "./switch";
import { table } from "./table";
import { textField } from "./textfield";

export const createCustomComponents = (theme: Theme) =>
  merge(
    autocomplete(theme),
    button(theme),
    card(theme),
    checkbox(theme),
    dialog(theme),
    link(),
    list(theme),
    menu(theme),
    paper(theme),
    popover(theme),
    progress(theme),
    select(),
    stack(),
    switchComponent(theme),
    table(theme),
    textField(theme)
  );
