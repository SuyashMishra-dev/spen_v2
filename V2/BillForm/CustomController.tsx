import { useFormContext } from "react-hook-form";
import { useBillForm } from "../context/FormContext";

const CustomController = (props) => {
  const { isOnChangeRefetch, resetFields, children, name, value, onChange, ...rest } = props;

  const { resetField } = useFormContext();
  const { setRefetchValues } = useBillForm();

  const handleOnChange = (value: unknown) => {
    if (isOnChangeRefetch) {
      setRefetchValues((prevValue) => ({
        ...prevValue,
        [name]: true,
      }));

      if (Array.isArray(resetFields)) {
        resetFields.forEach((fieldName) => {
          resetField(fieldName, {
            // IMPROVEMENT: special case for addNotes
            // cannot reset field for boolean :(
            // since we want to make it reusable
            // it should be put inside the useBillForm instead
            defaultValue: fieldName === "addNotes" ? false : undefined,
          });
        });
      }
    } else {
      setRefetchValues((prev) => {
        const { [name]: deleteKey, ...rest } = prev || {};

        return rest;
      });
    }

    onChange(value);
  };

  return children({
    ...rest,
    name,
    value,
    onChange: handleOnChange,
  });
};

export default CustomController;
