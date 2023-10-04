import { appNotification } from "Modules/appNotification/appNotification";
import React from "react";
import { useHistory, useLocation } from "react-router-dom";
import { TEAMS_PAGE_URL, TEAM_LIMIT_EXCEEDED, TRANSACTIONS_PAGE } from "../constants";

interface LocationState {
  data: {
    isSuccess: boolean;
    isApprovalEnabled: boolean;
    isBalanceSufficient: boolean;
    balance: unknown;
    saveVendorMessage: string;
    isTeamLimitExceeded: boolean;
    paymentSource: string;
    isMultipleUpload: boolean;
    toasterData: {
      message?: string;
      actionUrl?: string;
      actionLabel?: string;
    };
  };
}

export const useSuccessBillToast = () => {
  const location = useLocation<LocationState>();
  const history = useHistory();

  const generateToasterMessage = ({ isApprovalEnabled, isTeamLimitExceeded, paymentSource, isMultipleUpload }) => {
    if (isApprovalEnabled) {
      if (isTeamLimitExceeded === TEAM_LIMIT_EXCEEDED.YES) {
        return (
          <>
            Your bill has been created. {isMultipleUpload ? "Bills" : "This bill"} will be processed once
            <b> {paymentSource}</b> has sufficient
            <b> Remaining Spending Limit</b> for deduction.
          </>
        );
      } else if (isTeamLimitExceeded === TEAM_LIMIT_EXCEEDED.PARTIAL) {
        return (
          <>
            Your bills have been created. One or more bills will be processed once <b>{paymentSource}</b> has sufficient
            <b> Remaining Spending Limit</b> for deduction.
          </>
        );
      } else {
        return "Payment has been submitted for approval.";
      }
    } else {
      return "Payment has been submitted to be paid automatically.";
    }
  };

  const generateToasterActionLabel = ({ isApprovalEnabled, isTeamLimitExceeded }) => {
    if (isApprovalEnabled) {
      if (isTeamLimitExceeded === TEAM_LIMIT_EXCEEDED.YES || isTeamLimitExceeded === TEAM_LIMIT_EXCEEDED.PARTIAL) {
        return "View Teams";
      } else {
        return "View Created Bill";
      }
    } else {
      return "Check payment status here.";
    }
  };

  const generateToasterActionUrl = ({ isTeamLimitExceeded, isApprovalEnabled }) => {
    if (
      isApprovalEnabled &&
      (isTeamLimitExceeded === TEAM_LIMIT_EXCEEDED.YES || isTeamLimitExceeded === TEAM_LIMIT_EXCEEDED.PARTIAL)
    ) {
      return TEAMS_PAGE_URL;
    } else {
      return TRANSACTIONS_PAGE("all");
    }
  };

  const generateToast = () => {
    const {
      isSuccess,
      isApprovalEnabled,
      isBalanceSufficient,
      saveVendorMessage,
      isTeamLimitExceeded,
      paymentSource,
      isMultipleUpload,
      toasterData,
    } = location?.state?.data || {};

    if (isSuccess) {
      if (isBalanceSufficient) {
        const toasterMessage =
          toasterData?.message ||
          generateToasterMessage({ isApprovalEnabled, isTeamLimitExceeded, paymentSource, isMultipleUpload });
        const toasterActionUrl =
          toasterData?.actionUrl ||
          generateToasterActionUrl({
            isTeamLimitExceeded,
            isApprovalEnabled,
          });
        const toasterActionLabel =
          toasterData?.actionLabel || generateToasterActionLabel({ isApprovalEnabled, isTeamLimitExceeded });

        appNotification.success({
          message: (
            <div>
              <p>{toasterMessage}</p>
              {saveVendorMessage && <p>{saveVendorMessage}</p>}
            </div>
          ),
          onClickCTA: () => {
            history.push(toasterActionUrl);
          },
          cta: toasterActionLabel,
        });
        history.replace({ ...location, state: undefined });
      }
    } else {
      appNotification.error({
        message: "An error occurred. Please try again.",
      });
    }
  };

  return generateToast;
};
