export const downloadJSON = (json: Record<any, any>, filename: string) => {
  const toDownload = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(json))}`;
  download(toDownload, filename, "json");
};

export const downloadCSV = (csv: string, filename: string) => {
  const toDownload = `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`;
  download(toDownload, filename, "csv");
};

const download = (data: string, filename: string, type: "json" | "csv") => {
  const anchorNode = document.createElement("a");

  anchorNode.style.display = "none";
  anchorNode.setAttribute("href", data);
  anchorNode.setAttribute("download", `${filename}.${type}`);
  document.body.append(anchorNode);
  anchorNode.click();
  anchorNode.remove();
};
