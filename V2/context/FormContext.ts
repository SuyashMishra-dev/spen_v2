import { createContext, useContext } from "react";

export interface FormContextValues {
  refetchValues?: Record<string, any>;
  setRefetchValues(values: Record<string, any>): void;
}

export const FormContext = createContext(null);

export const useBillForm = <T>() => {
  const form = useContext<T & FormContextValues>(FormContext);

  if (form === null) {
    throw Error("useBillForm requires FormProvider to be used higher in the component tree");
  }

  return form;
};
