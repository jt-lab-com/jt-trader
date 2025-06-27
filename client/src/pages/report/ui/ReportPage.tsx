import { FC } from "react";
import { useParams } from "react-router-dom";
import { Report, useArtifact } from "@/entities/artifact";
import { Page } from "@/shared/ui/page";

interface ReportPageProps {
  title: string;
}

const ReportPage: FC<ReportPageProps> = (props) => {
  const { title } = props;

  const { artifactsId } = useParams();
  const { artifact } = useArtifact({ artifactsId });

  if (!artifact) return null;

  return (
    <Page title={title}>
      <Report artifact={artifact} />
    </Page>
  );
};

export default ReportPage;
