import { Controller, useFormContext } from "react-hook-form";
import { TreeSelect, TreeSelectExpandedKeysType } from "primereact/treeselect";
import { useEffect, useState, useMemo } from "react";
import { inputValidator } from "../../../../library/utilities/helperFunction";
import { FormFieldError } from "../formFieldError/FormFieldError";
import { useTranslation } from "react-i18next";
import { IFormFieldType } from "../../../../library/utilities/constant";
import { Checkbox } from "primereact/checkbox";
import { ITreeSelects } from "./TreeSelects.model";
/** -------------------------
 * Helpers
 * --------------------------*/
type SelectionKeyState = { checked: boolean; partialChecked?: boolean };
type SelectionKeys = Record<string, SelectionKeyState>;
const collectAllNodeKeys = (nodes: any[] = []) => {
  const keys: string[] = [];
  const walk = (n: any) => {
    if (!n) return;
    if (n.key != null) keys.push(String(n.key));
    if (Array.isArray(n.children)) n.children.forEach(walk);
  };
  nodes.forEach(walk);
  return keys;
};
const buildAllCheckedSelectionKeys = (nodes: any[] = []) => {
  const keys = collectAllNodeKeys(nodes);
  const selectionKeys: SelectionKeys = {};
  keys.forEach(
    (k) => (selectionKeys[k] = { checked: true, partialChecked: false })
  );
  return selectionKeys;
};
const countCheckedKeys = (value: any) => {
  if (!value || typeof value !== "object") return 0;
  return Object.values(value).filter((v: any) => v?.checked === true).length;
};
const isNodeChecked = (selection: any, nodeKey: any) => {
  const key = String(nodeKey);
  return !!selection?.[key]?.checked;
};
// Cascades selection down the subtree
const setNodeCheckedDeep = (
  node: any,
  checked: boolean,
  next: SelectionKeys
) => {
  if (!node) return;
  const key = String(node.key);
  next[key] = { checked, partialChecked: false };
  if (Array.isArray(node.children) && node.children.length) {
    node.children.forEach((c: any) => setNodeCheckedDeep(c, checked, next));
  }
};
const toggleNodeChecked = (
  node: any,
  selection: SelectionKeys,
  checked: boolean
) => {
  const next: SelectionKeys = { ...(selection || {}) };
  if (checked) {
    // add this node + all children
    setNodeCheckedDeep(node, true, next);
  } else {
    // remove this node + all children
    const keysToRemove = collectAllNodeKeys([node]);
    keysToRemove.forEach((k) => delete next[k]);
  }
  return next;
};
/** -------------------------
 * Component
 * --------------------------*/
export const TreeSelects = (props: ITreeSelects) => {
  const { attribute, form, fieldType, moreOptions, showMarkAllHeader } = props;
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
  const expandNode = (node: any, _expandedKeys: TreeSelectExpandedKeysType) => {
    if (node.children && node.children.length) {
      _expandedKeys[node.key] = true;
      for (let child of node.children) {
        expandNode(child, _expandedKeys);
      }
    }
  };
  useEffect(() => {
    if (treeOptions) {
      const expandAll = () => {
        let _expandedKeys: TreeSelectExpandedKeysType = {};
        for (let node of treeOptions) {
          expandNode(node, _expandedKeys);
        }
        setExpandedKeys(_expandedKeys);
      };
      if (isExpand) expandAll();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [treeOptions]);
  const { labelClassName, fieldClassName, divClassName } = useMemo(() => {
    switch (fieldType) {
      case IFormFieldType.NO_LABEL:
      case IFormFieldType.TOP_LABEL:
        return {
          labelClassName: "",
          fieldClassName: "field p-fluid",
          divClassName: "",
        };
      default:
        return {
          labelClassName: "col-12 mb-3 md:col-3 md:mb-0",
          fieldClassName: "field grid",
          divClassName: "col-12 md:col-9 relative",
        };
    }
  }, [fieldType]);
  const labelElement = (
    <label htmlFor={attribute} className={labelClassName}>
      <span className="capitalize-first">
        {label} {required && "*"}
      </span>
    </label>
  );
  // "Mark all" is relevant only when you store selectionKeys object (multiple)
  const isMultiSelectMode = (moreOptions as any)?.selectionMode === "multiple";
  return (
    <div className={fieldClassName}>
      {fieldType !== IFormFieldType.NO_LABEL && labelElement}
      <div className={divClassName}>
        <Controller
          control={control}
          name={attribute}
          rules={inputValidator(form[attribute].rules, label)}
          render={({ field: { onChange, value } }) => {
            const totalKeys = collectAllNodeKeys(treeOptions || []).length;
            const checkedCount = countCheckedKeys(value);
            const allSelected = totalKeys > 0 && checkedCount === totalKeys;
            const headerTemplate = () => (
              <div className="flex align-items-center justify-content-start w-full p-2 ml-2">
                <div className="flex align-items-center gap-2">
                  <Checkbox
                    checked={allSelected}
                    onChange={(e) => {
                      if (e.checked) {
                        onChange(
                          buildAllCheckedSelectionKeys(treeOptions || [])
                        );
                      } else {
                        onChange({});
                      }
                    }}
                  />
                  <span className="text-sm">
                    {allSelected ? "Clear all" : "Mark all"}
                  </span>
                </div>
              </div>
            );
            // :white_check_mark: Checkbox prefixed item template
            const itemTemplate = (node: any) => {
              const checked = isNodeChecked(value, node.key);
              return (
                <div
                  className="flex align-items-center gap-2 w-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    const next = toggleNodeChecked(
                      node,
                      (value || {}) as SelectionKeys,
                      !checked
                    );
                    onChange(next);
                  }}
                >
                  <Checkbox
                    checked={checked}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => {
                      const next = toggleNodeChecked(
                        node,
                        (value || {}) as SelectionKeys,
                        !!e.checked
                      );
                      onChange(next);
                    }}
                  />
                  <span>{node.label}</span>
                </div>
              );
            };
            return (
              <div className="flex">
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
                  defaultValue={value as any}
                  onBlur={undefined}
                  filter={filter ?? true}
                  disabled={disabled}
                  nodeTemplate={
                    isMultiSelectMode && showMarkAllHeader
                      ? itemTemplate
                      : undefined
                  }
                  panelHeaderTemplate={
                    isMultiSelectMode && showMarkAllHeader
                      ? headerTemplate
                      : undefined
                  }
                  {...moreOptions}
                />
              </div>
            );
          }}
        />
        <FormFieldError data={{ errors, name: attribute }} />
      </div>
    </div>
  );
};
