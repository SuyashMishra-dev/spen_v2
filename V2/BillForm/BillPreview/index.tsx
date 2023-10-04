import { Button } from "@spenmo/splice";
import React from "react";
import Preview from "../../components/Preview";
import { useBillForm } from "../../context/FormContext";
import FormFooter from "../FormFooter";
import { BillFormProviderProps, BillFormStepProps } from "../type";
import { billPreview } from "./dummyData";

const BillPreview: React.FC<BillFormStepProps> = (props) => {
  const { onBack, onNext } = props;
  const { handleSaveDraft } = useBillForm<BillFormProviderProps>();

  return (
    <>
      <Preview data={billPreview} isEdited={false} />
      <FormFooter onClickBack={onBack} onSubmit={onNext} submitText="Submit">
        <Button type="button" size="m" variant="secondary" onClick={handleSaveDraft}>
          Save as draft
        </Button>
      </FormFooter>
    </>
  );
};

export default BillPreview;
