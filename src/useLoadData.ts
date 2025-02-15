import React from "react";

export function useLoadData<T extends { id: string }>(key: string, url: string) {
  const [data, setData] = React.useState<any>(undefined);
  React.useEffect(() => {
    if ((window as any)[key] !== undefined) {
      setData((window as any)[key]);
      return;
    }
    window
      .fetch(url)
      .then((r) => r.json())
      .then(({ docs, totalDocs }) => {
        if (totalDocs == null || docs?.length !== totalDocs) {
          (window as any)[key] = null;
        } else {
          (window as any)[key] = new Map<string, T>(
            docs.map((d: T) => [d.id, d])
          );
        }
        setData((window as any)[key]);
      });
  });
  return (data ?? new Map()) as Map<string, T>;
}
