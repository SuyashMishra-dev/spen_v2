import React, { useEffect, useRef, useState } from "react";
import { Dropdown, Form, Menu, Typography } from "antd";
import { SWRConfig } from "swr";
import { useDispatch } from "react-redux";
import { Link, useHistory, useLocation } from "react-router-dom";

import { getOrgDetailFunc } from "Redux/Actions";
import Simulation from "Views/Bills/Simulation";
import EmptyState from "Views/State/emptyState";
import { DragDrop } from "..";
import ManageDraft from "../ManageDraft";
import ManageRecipients from "../ManageRecipients";
import BillForm from "./BillForm";
import RecipientSidepanel from "./Recipient/RecipientSidepanel";
import { SidePanel } from "Modules/DS/SidePanel";
import Button, { BUTTON_SIZES, BUTTON_TYPES } from "Modules/DS/Button";
import Tabs, { ListData } from "Modules/DS/Tabs";

import XeroAction from "./Actions/Xero";
import { useSuccessBillToast } from "./hooks/useSuccessBillToast";
import { BillContext } from "./context/BillContext";
import { threeDots } from "assets/img";
import { GetBaseAuthObject } from "utility";
import { BillFormType, TAB_LIST } from "./constants";
import styles from "./Bills.module.scss";
import { DynamicFormIdentifier } from "./hooks/useRecipientFormFields/types";
import ErrorHandlerProvider from "./context/ErrorHandlerContext";

const { Title } = Typography;

export interface BillsV2Props {
  tabKey: string;
}

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

const BillsV2: React.FC<BillsV2Props> = ({ tabKey }) => {
  const [paymentSimulatorVisible, setPaymentSimulatorVisible] = useState(false);
  const [isOpenRecipientSidePanel, setIsOpenRecipientSidePanel] = useState(false);
  const [dynamicFieldsIdentifier, setDynamicFieldsIdentifier] = useState<Record<string, DynamicFormIdentifier>>({});
  const [recipientSelectedID, setRecipientSelectedID] = useState<undefined | number>(undefined);
  const inputFileRef = useRef<HTMLInputElement>(null);
  const dispatch = useDispatch();
  const history = useHistory();
  const location = useLocation<LocationState>();
  const showSuccessBillToast = useSuccessBillToast();
  const [form] = Form.useForm();

  const handleLinkCTA = (url: string) => () => {
    history.push(url);
  };

  const handleOpenSidebar = (setter: Function) => () => {
    setter(true);
  };

  const handleCloseSidebar = (setter: Function) => () => {
    setter(false);
  };

  useEffect(() => {
    dispatch(getOrgDetailFunc(GetBaseAuthObject().orgId));
  }, [dispatch]);

  useEffect(() => {
    if (location?.state?.data) {
      showSuccessBillToast();
    }
  }, [location?.state?.data, showSuccessBillToast]);

  const handleChangeTab = (index: string) => {
    history.push(TAB_LIST[index].link);
  };

  const renderTabContent = (tab: ListData) => {
    const tabContents = {
      "0": null,
      "1": <ManageDraft onUpload={() => inputFileRef.current?.click()} />,
      "2": <ManageRecipients />,
    };
    return tabContents[tab.tabKey];
  };

  const menu = (
    <Menu className={styles.dropdownMenu}>
      <Menu.Item>
        <XeroAction />
      </Menu.Item>
      <Menu.Item>
        <Link to="/bills/bulk">Upload a Spreadsheet</Link>
      </Menu.Item>
      <Menu.Item onClick={handleOpenSidebar(setPaymentSimulatorVisible)}>Payment simulator</Menu.Item>
    </Menu>
  );

  if (!TAB_LIST[tabKey]) {
    return <EmptyState />;
  }

  return (
    <SWRConfig>
      <ErrorHandlerProvider>
        <BillContext.Provider
          value={{
            form,
            isOpenRecipientSidePanel,
            setIsOpenRecipientSidePanel,
            dynamicFieldsIdentifier,
            setDynamicFieldsIdentifier,
            recipientSelectedID,
            setRecipientSelectedID,
          }}
        >
          <DragDrop ref={inputFileRef}>
            <div className={styles.spaceBetween}>
              <Title>Bill Payments</Title>
              <div className={styles.flex}>
                <Button.Title
                  size={BUTTON_SIZES.SMALL}
                  onClick={handleLinkCTA(`${location.pathname}/${BillFormType.NEW_BILL}`)}
                >
                  + New Bill
                </Button.Title>
                <div className={styles.dropdown}>
                  <Dropdown overlay={menu} trigger={["click"]} placement="bottomRight">
                    <Button.Title size={BUTTON_SIZES.SMALL} type={BUTTON_TYPES.SECONDARY}>
                      <img src={threeDots} alt="more icon" />
                    </Button.Title>
                  </Dropdown>
                </div>
              </div>
            </div>
            <Tabs
              tabsList={TAB_LIST}
              content={renderTabContent}
              action={handleChangeTab}
              activeKey={tabKey}
              destroyInactiveTabPane
            />
          </DragDrop>

          <SidePanel
            visible={paymentSimulatorVisible}
            onClose={handleCloseSidebar(setPaymentSimulatorVisible)}
            title="Payment Simulator"
            sticky
          >
            <Simulation />
          </SidePanel>

          <BillForm />

          <RecipientSidepanel />
        </BillContext.Provider>
      </ErrorHandlerProvider>
    </SWRConfig>
  );
};

export default BillsV2;
