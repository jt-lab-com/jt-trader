import { FC, useEffect } from "react";
import { useParams } from "react-router-dom";
import { LogsContainer } from "@/entities/log";

interface LogsPageProps {
  title: string;
}

const LogsPage: FC<LogsPageProps> = (props) => {
  const { title } = props;
  const { artifactsId } = useParams();

  useEffect(() => {
    document.title = title;
  }, []);

  return (
    <div style={{ height: "100vh" }}>
      <LogsContainer initialArtifactsId={artifactsId as string} />
    </div>
  );
};

export default LogsPage;
