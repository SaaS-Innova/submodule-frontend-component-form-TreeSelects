import { Controller, useFormContext } from "react-hook-form";
import { TreeSelect, TreeSelectExpandedKeysType } from "primereact/treeselect";
import { useEffect, useState } from "react";
import { inputValidator } from "../../../../library/utilities/helperFunction";
import { FormFieldError } from "../formFieldError/FormFieldError";
import { IFormProps } from "../formInterface/forms.model";
import { useTranslation } from "react-i18next";
import { IFormFieldType } from "../../../../library/utilities/constant";

export const TreeSelects = (props: IFormProps) => {
  const { attribute, form, fieldType, moreOptions } = props;
  const [expandedKeys, setExpandedKeys] =
    useState<TreeSelectExpandedKeysType>();

  const { label, treeOptions, placeholder, filter } = form[attribute];
  const { required, disabled, isExpand = false } = form[attribute].rules;
  const {
    control,
    formState: { errors },
  } = useFormContext();
  const { t } = useTranslation();
  const defaultPlaceHolder: string = t("components.select.placeholder");

  useEffect(() => {
    if (treeOptions) {
      const expandAll = () => {
        let _expandedKeys = {};

        for (let node of treeOptions) {
          expandNode(node, _expandedKeys);
        }

        setExpandedKeys(_expandedKeys);
      };
      if (isExpand) {
        expandAll();
      }
    }
  }, [treeOptions]);

  const expandNode = (node: any, _expandedKeys: TreeSelectExpandedKeysType) => {
    if (node.children && node.children.length) {
      _expandedKeys[node.key] = true;

      for (let child of node.children) {
        expandNode(child, _expandedKeys);
      }
    }
  };

  const getClassNames = () => {
    let labelClassName = "";
    let fieldClassName = "";
    let divClassName = "";

    switch (fieldType) {
      case IFormFieldType.NO_LABEL:
        labelClassName = "";
        fieldClassName = "field p-fluid";
        divClassName = "";
        break;
      case IFormFieldType.TOP_LABEL:
        labelClassName = "";
        fieldClassName = "field p-fluid";
        divClassName = "";
        break;
      default:
        labelClassName = "col-12 mb-3 md:col-3 md:mb-0";
        fieldClassName = "field grid";
        divClassName = "col-12 md:col-9 relative";
        break;
    }

    return { labelClassName, fieldClassName, divClassName };
  };
  const { labelClassName, fieldClassName, divClassName } = getClassNames();

  const labelElement = (
    <label htmlFor={attribute} className={labelClassName}>
      <span className="capitalize-first">
        {label} {required && "*"}
      </span>
    </label>
  );

  return (
    <div className={fieldClassName}>
      {fieldType !== IFormFieldType.NO_LABEL && labelElement}
      <div className={divClassName}>
        <Controller
          control={control}
          name={attribute}
          rules={inputValidator(form[attribute].rules, label)}
          render={({ field: { onChange, value } }) => (
            <TreeSelect
              value={value}
              options={treeOptions}
              required={required}
              onChange={onChange}
              className="w-full"
              placeholder={placeholder || defaultPlaceHolder}
              id={attribute}
              metaKeySelection={false}
              expandedKeys={expandedKeys}
              onToggle={(e) => setExpandedKeys(e.value)}
              defaultValue={value as string}
              onBlur={undefined}
              filter={filter ?? true}
              disabled={disabled}
              {...moreOptions}
            ></TreeSelect>
          )}
        />
        <FormFieldError data={{ errors, name: attribute }} />
      </div>
    </div>
  );
};
