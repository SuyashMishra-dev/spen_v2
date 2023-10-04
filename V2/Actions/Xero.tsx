import { RootState } from "Redux/ConfigureStore";
import { getXeroUrl } from "Redux/DataCalls/AccountingSetting.api";
import { IMPORT_BILL_FROM_XERO } from "Views/Bills/const";
import React from "react";
import { useSelector } from "react-redux";
import { trackEvent } from "utility/analytics";
import { useQuery } from "utility/useQuery";

const XeroAction: React.FC = () => {
  const connectedWithBankfeed = useSelector((state: RootState) => state.xeroAuthReducer?.data?.payload?.bankfeed);
  const { data: xeroUrl } = useQuery({ apiCall: () => getXeroUrl({ bankFeed: true, expense: false }) });

  return (
    <a
      href={connectedWithBankfeed ? IMPORT_BILL_FROM_XERO : xeroUrl?.redirection_url}
      onClick={() => {
        trackEvent("bill click import bills from xero");
      }}
    >
      Import from Xero
    </a>
  );
};

export default XeroAction;
