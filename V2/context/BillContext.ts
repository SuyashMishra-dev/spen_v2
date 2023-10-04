import { createContext } from "react";
import { FormInstance } from "antd/lib/form";
import { DynamicFormIdentifier } from "../hooks/useRecipientFormFields/types";

// TO DO: is it still needed?
export const BillContext = createContext<{
  form: FormInstance<any>;
  isOpenRecipientSidePanel: boolean;
  setIsOpenRecipientSidePanel: (value: boolean) => void;
  dynamicFieldsIdentifier: Record<string, DynamicFormIdentifier>;
  setDynamicFieldsIdentifier: (value: Record<string, DynamicFormIdentifier>) => void;
  // for edit recipient
  recipientSelectedID?: number;
  setRecipientSelectedID: (id: number) => void;
}>({
  form: undefined,
  isOpenRecipientSidePanel: false,
  setIsOpenRecipientSidePanel: () => {},
  dynamicFieldsIdentifier: {},
  setDynamicFieldsIdentifier: () => {},
  recipientSelectedID: undefined,
  setRecipientSelectedID: () => {},
});
