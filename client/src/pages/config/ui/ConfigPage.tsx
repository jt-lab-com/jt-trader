import { CardHeader, Typography } from "@mui/material";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import React, { FC } from "react";
import { ControlButtons } from "@/features/config";
import { InvalidateCacheButton, RebootButton } from "@/features/server";
import { ConfigTable, useConfig } from "@/entities/config";
import { Iconify } from "@/shared/ui/iconify";
import { RouterLink } from "@/shared/ui/link";
import { Page } from "@/shared/ui/page/Page";

interface ConfigPageProps {
  title: string;
}

const ConfigPage: FC<ConfigPageProps> = (props) => {
  const { engineVersion } = useConfig();

  return (
    <Page title={props.title}>
      <Container>
        <Card>
          <CardHeader>
            <Typography>Exchanges</Typography>
          </CardHeader>
          <CardContent>
            <ConfigTable renderControls={(exchange) => <ControlButtons exchange={exchange} />} />
            <Stack sx={{ mt: 5 }} direction={"row"} justifyContent={"space-between"} alignItems={"flex-end"}>
              <Stack direction={"row"} gap={2}>
                <InvalidateCacheButton />
                <RebootButton />
                <Button
                  component={RouterLink}
                  variant={"outlined"}
                  size={"small"}
                  href={"/logs/system"}
                  target={"_blank"}
                  startIcon={<Iconify width={15} icon={"solar:book-outline"} />}
                >
                  System logs
                </Button>
              </Stack>
              <Stack direction={"row"} gap={1}>
                <Typography variant={"body2"} color={"text.secondary"}>
                  Engine version:
                </Typography>
                <Typography variant={"subtitle2"}>{engineVersion}</Typography>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      </Container>
    </Page>
  );
};

export default ConfigPage;
