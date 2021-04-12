import { EditorState } from "../types/EditorState";
import { EntityDefinitionId } from "../../ecs-serializable/definition/EntityDefinition";

export const selectEntityDefinition = (
  { ecs: { entityDefinitions } }: EditorState,
  id?: EntityDefinitionId
) => (id ? entityDefinitions[id] : undefined);
