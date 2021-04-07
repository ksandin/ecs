import { MenuItem, TableCell, TableRow, Typography } from "@material-ui/core";
import styled from "styled-components";
import { PropertyInfo } from "../../property-bag/types/PropertyInfo";
import { useMenu } from "../hooks/useMenu";
import { propertySupportsDeclarative } from "../../property-bag/propertySupportsDeclarative";
import {
  ComponentPropertiesDefinition,
  ComponentPropertyValue,
  ComponentPropertyValueDefinition,
} from "../../ecs-serializable/types/ComponentPropertiesDefinition";
import { createComponentPropertyDefinition } from "../../ecs-serializable/functions/createComponentPropertyDefinition";
import { isFunctionDefinition } from "../../ecs-serializable/functions/isFunctionDefinition";
import { Intro } from "../intro/Intro";
import { renderComponentPropertyValueEditor } from "./ComponentPropertyValueEditor";

export type ComponentPropertyEditorProps = {
  baseProperties?: ComponentPropertiesDefinition;
  primaryProperties: ComponentPropertiesDefinition;
  propertyName: string;
  propertyInfo: PropertyInfo<ComponentPropertyValue>;
  onUpdate: (newValue: ComponentPropertyValueDefinition) => void;
  onReset: () => void;
  isVisible?: boolean;
};

export const ComponentPropertyEditor = ({
  baseProperties,
  primaryProperties,
  propertyName,
  propertyInfo,
  onUpdate,
  onReset,
  isVisible = true,
}: ComponentPropertyEditorProps) => {
  const value = primaryProperties.hasOwnProperty(propertyName)
    ? primaryProperties[propertyName]
    : baseProperties?.hasOwnProperty(propertyName)
    ? baseProperties[propertyName]
    : createComponentPropertyDefinition(propertyInfo.defaultValue);

  const supportsDeclarative = propertySupportsDeclarative(propertyInfo);

  const isDeclarative = supportsDeclarative && isFunctionDefinition(value);

  const hasBaseDiff =
    !!baseProperties && primaryProperties.hasOwnProperty(propertyName);

  const setDeclarative = (toDeclarative: boolean) =>
    onUpdate(
      createComponentPropertyDefinition(
        toDeclarative ? () => {} : propertyInfo.defaultValue
      )
    );

  const [openMenu, menu] = useMenu([
    hasBaseDiff && <MenuItem onClick={onReset}>Reset</MenuItem>,
    supportsDeclarative && (
      <MenuItem onClick={() => setDeclarative(!isDeclarative)}>
        {isDeclarative ? "Make imperative" : "Make declarative"}
      </MenuItem>
    ),
  ]);

  const valueEditor = renderComponentPropertyValueEditor({
    value,
    info: propertyInfo,
    onChange: onUpdate,
  });

  if (!valueEditor || propertyInfo.hidden) {
    // No editor available for this type,
    // or this property has opted out of being editable
    return null;
  }

  return (
    <>
      <TableRow key={propertyName} onContextMenu={openMenu}>
        <TableCell>
          <Intro
            message="This property value has changed. You can right click and reset to the original value."
            introId="ResetPropertyValue"
            when={isVisible && hasBaseDiff}
            canRestore={false}
          >
            <PropertyName $hasBaseDiff={hasBaseDiff}>
              {propertyName}
            </PropertyName>
          </Intro>
        </TableCell>
        <TableCell>{valueEditor}</TableCell>
      </TableRow>
      {menu}
    </>
  );
};

const PropertyName = styled(Typography).attrs({ variant: "caption" })<{
  $hasBaseDiff: boolean;
}>`
  font-weight: ${({ $hasBaseDiff }) => ($hasBaseDiff ? "bold" : "inherit")};
`;
