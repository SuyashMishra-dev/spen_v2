import { postData } from "API/Client";
import React, { useEffect, useMemo } from "react";
import useSWRMutation from "swr/mutation";
import Preview from "../components/Preview";
import { API_URL } from "../constants";
import { InfoFilled } from "@spenmo/splice";

const RecipientPreview: React.FC<{ previewPayload: Record<string, any> }> = ({ previewPayload }) => {
  const { trigger, data } = useSWRMutation(API_URL.recipientPreview, (url, { arg }: { arg: typeof previewPayload }) =>
    postData(url, arg)
  );

  useEffect(() => {
    trigger(previewPayload);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const previewData = useMemo(() => data?.data.payload, [data]);

  if (!previewData) {
    return null;
  }

  return (
    <Preview
      data={previewData.sections}
      isEdited={previewData.isEdited}
      banner={
        previewData.isEdited
          ? {
              description: "Updates will not be reflected in bills currently in approval.",
              title: "Updated recipient details will be applied to the current bill",
              variant: "info",
              icon: InfoFilled,
            }
          : undefined
      }
    />
  );
};

export default RecipientPreview;
