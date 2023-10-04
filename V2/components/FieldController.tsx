import React from "react";
import { Controller, useFormContext } from "react-hook-form";
import FormGenerator, { FormGroup, FormItem } from "./FormGenerator";

const FieldController: React.FC<any> = (props) => {
  const {
    label,
    tooltip,
    name,
    rules,
    defaultValue,
    fieldProps,
    withOCR,
    isSameWithOCR,
    render,
    fieldGroup,
    children,
  } = props;

  const { control } = useFormContext();
  const fieldGenerator =
    (fieldProps: Object) =>
    ({ field }) => {
      const fieldGeneratorProps = {
        ...fieldProps,
        ...field,
      };
      if (children) {
        return children(fieldGeneratorProps, FormGenerator);
      }

      return <FormGenerator {...fieldGeneratorProps} />;
    };

  if (fieldGroup) {
    // overwrite sub-fields
    if (render) {
      return (
        <FormItem
          htmlFor={name}
          label={label}
          required={rules?.required}
          description={fieldProps?.description}
          tooltip={fieldProps?.tooltip}
          withOCR={withOCR}
          isSameWithOCR={isSameWithOCR}
        >
          <Controller name={name} control={control} rules={rules} defaultValue={defaultValue} render={render} />
        </FormItem>
      );
    }

    return (
      <FormGroup label={label} tooltip={tooltip}>
        {fieldGroup.map((subItem) => {
          // IMPROVEMENT: use recursion
          const { label, name, rules, defaultValue, fieldProps, className, withOCR, isSameWithOCR, render } = subItem;

          return (
            <FormItem
              key={name}
              htmlFor={name}
              label={label}
              className={className}
              required={rules?.required}
              description={fieldProps?.description}
              tooltip={fieldProps?.tooltip}
              withOCR={withOCR}
              isSameWithOCR={isSameWithOCR}
            >
              <Controller
                name={name}
                control={control}
                rules={rules}
                defaultValue={defaultValue}
                render={render || fieldGenerator(fieldProps)}
              />
            </FormItem>
          );
        })}
      </FormGroup>
    );
  }

  return (
    <FormItem
      htmlFor={name}
      label={label}
      required={rules?.required}
      description={fieldProps?.description}
      tooltip={fieldProps?.tooltip}
      withOCR={withOCR}
      isSameWithOCR={isSameWithOCR}
    >
      <Controller
        name={name}
        control={control}
        rules={rules}
        defaultValue={defaultValue}
        render={render || fieldGenerator(fieldProps)}
      />
    </FormItem>
  );
};

export default FieldController;
