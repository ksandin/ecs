import React from "react";
import { IconButton, Tooltip, Typography } from "@material-ui/core";
import { TextSystem } from "../../ecs-react/TextSystem";
import { SystemDefinition } from "../../ecs-serializable/types/SystemDefinition";
import { SceneDefinition } from "../../ecs-serializable/types/SceneDefinition";
import { EntityInitializer } from "../../ecs-serializable/types/EntityInitializer";
import { createSystemDefinition } from "../../ecs-serializable/factories/createSystemDefinition";
import { createSceneDefinition } from "../../ecs-serializable/factories/createSceneDefinition";
import { createEntityDefinition } from "../../ecs-serializable/factories/createEntityDefinition";
import { EditorState } from "../types/EditorState";
import { selectSelectedObjects } from "../selectors/selectSelectedObjects";
import { useSystemInitializer } from "../hooks/useSystemInitializer";
import { useSceneSync } from "../hooks/useSceneSync";
import { useCrudDialogs } from "../hooks/useCrudDialogs";
import { uuid } from "../functions/uuid";
import { LibraryNode } from "../../ecs-serializable/types/LibraryNode";
import { selectLibraryNodeLabel } from "../selectors/selectLibraryNodeLabel";
import { getDefinitionsInLibrary } from "../../ecs-serializable/functions/getDefinitionsInLibrary";
import { useDialog } from "../hooks/useDialog";
import { serializeJS } from "../../ecs-serializable/jsSerializer";
import { omit } from "../functions/omit";
import { NativeComponents } from "../../ecs-serializable/types/NativeComponents";
import { useEditorState } from "../hooks/useEditorState";
import {
  AddIcon,
  EntityInitializerIcon,
  ResetIcon,
  SaveIcon,
  SceneIcon,
  SystemIcon,
} from "../components/icons";
import { PanelContainer } from "../components/PanelContainer";
import { CrudList } from "../components/CrudList";
import { AppBarAndDrawer } from "../components/AppBarAndDrawer";
import { EditorTitle } from "../components/EditorTitle";
import { Panel } from "../components/Panel";
import { PanelName } from "../components/PanelName";
import { FlatPanel } from "../components/FlatPanel";
import { PanelHeader } from "../components/PanelHeader";
import { LibraryTree } from "../components/LibraryTree";
import { CreateEntityInitializerButton } from "../components/CreateEntityInitializerButton";
import { SimpleDialog } from "../components/SimpleDialog";
import { InspectedObject } from "../types/InspectedObject";
import { EditorStateContext } from "../EditorStateContext";
import {
  EditorSelectionName,
  EditorSelectionValuesDefined,
} from "../types/EditorSelection";
import { renameLibraryNode } from "../functions/renameLibraryNode";
import { InspectedObjectEditor } from "./InspectedObjectEditor";

export type EditorProps = {
  defaultState: EditorState;
  nativeComponents: NativeComponents;
};

/**
 * Renders controls to CRUD systems, scenes, entities, components and properties.
 */
export const Editor = ({ defaultState, nativeComponents }: EditorProps) => {
  const [state, dispatch] = useEditorState(nativeComponents, defaultState);

  const selected = selectSelectedObjects(state);
  const libraryDefinitions = getDefinitionsInLibrary(
    selected.system?.library ?? []
  );
  const [system, resetSystem] = useSystemInitializer(
    selected,
    nativeComponents
  );
  useSceneSync(system, selected, dispatch);

  const requireSelection = <K extends EditorSelectionName>(name: K) => {
    const value = state.selection[name];
    if (value !== undefined) {
      return value as EditorSelectionValuesDefined[K];
    }
    throw new Error("Can't proceed without selection: " + name);
  };

  const saveInspectorChange = (
    updated: InspectedObject,
    current: InspectedObject
  ) => {
    switch (updated.type) {
      case "entityInitializer":
        dispatch({
          type: "UPDATE_ENTITY_INITIALIZER",
          payload: {
            systemId: requireSelection("system"),
            sceneId: requireSelection("scene"),
            entityId: updated.object.id,
            update: updated.object,
          },
        });

        break;
      case "libraryNode":
        dispatch({
          type: "UPDATE_LIBRARY_NODE",
          payload: {
            systemId: requireSelection("system"),
            nodeId: updated.object.id,
            replacement: updated.object,
          },
        });
    }
  };

  const [showSaveDialog, saveDialog] = useDialog((props) => (
    <SimpleDialog title="Save" {...props}>
      <pre>{serializeJS(state.systems, { space: 2 })}</pre>
    </SimpleDialog>
  ));

  const [systemEvents, SystemDialogs] = useCrudDialogs<SystemDefinition>({
    createDialogTitle: "Add system",
    getItemName: (item) => item.name,
    onCreateItem: (name) =>
      dispatch({
        type: "CREATE_SYSTEM",
        payload: createSystemDefinition({ id: uuid(), name }),
      }),
    onRenameItem: (system, name) =>
      dispatch({
        type: "UPDATE_SYSTEM",
        payload: { systemId: system.id, update: { name } },
      }),
    onDeleteItem: (system) =>
      dispatch({ type: "DELETE_SYSTEM", payload: system.id }),
  });

  const [sceneEvents, SceneDialogs] = useCrudDialogs<SceneDefinition>({
    createDialogTitle: "Add scene",
    getItemName: (item) => item.name,
    onCreateItem: (name) =>
      dispatch({
        type: "CREATE_SCENE",
        payload: {
          systemId: requireSelection("system"),
          scene: createSceneDefinition({ id: uuid(), name }),
        },
      }),
    onRenameItem: (scene, name) =>
      dispatch({
        type: "UPDATE_SCENE",
        payload: {
          systemId: requireSelection("system"),
          sceneId: scene.id,
          update: { name },
        },
      }),
    onDeleteItem: (scene) =>
      dispatch({
        type: "DELETE_SCENE",
        payload: {
          systemId: requireSelection("system"),
          sceneId: scene.id,
        },
      }),
  });

  const [libraryNodeEvents, LibraryNodeDialogs] = useCrudDialogs<LibraryNode>({
    createDialogTitle: "Add entity",
    getItemName: selectLibraryNodeLabel,
    onCreateItem: (name) =>
      dispatch({
        type: "CREATE_LIBRARY_NODE",
        payload: {
          systemId: requireSelection("system"),
          node: {
            id: uuid(),
            type: "entity",
            entity: createEntityDefinition({ id: uuid(), name }),
          },
        },
      }),
    onRenameItem: (target, name) =>
      dispatch({
        type: "UPDATE_LIBRARY_NODE",
        payload: {
          systemId: requireSelection("system"),
          nodeId: target.id,
          replacement: renameLibraryNode(target, name),
        },
      }),
    onDeleteItem: (node) =>
      dispatch({
        type: "DELETE_LIBRARY_NODE",
        payload: { systemId: requireSelection("system"), nodeId: node.id },
      }),
  });

  const [
    entityInitializerEvents,
    EntityInitializerDialogs,
  ] = useCrudDialogs<EntityInitializer>({
    createDialogTitle: "Initialize entity",
    getItemName: (item) => item.name,
    onCreateItem: () => {},
    onRenameItem: (entity, name) =>
      dispatch({
        type: "UPDATE_ENTITY_INITIALIZER",
        payload: {
          systemId: requireSelection("system"),
          sceneId: requireSelection("scene"),
          entityId: entity.id,
          update: { name },
        },
      }),
    onDeleteItem: (entity) =>
      dispatch({
        type: "DELETE_ENTITY_INITIALIZER",
        payload: {
          systemId: requireSelection("system"),
          sceneId: requireSelection("scene"),
          entityId: entity.id,
        },
      }),
  });

  const appBar = (
    <>
      <EditorTitle>{selected.system?.name}</EditorTitle>
      <Tooltip title="Reset system" onClick={resetSystem}>
        <IconButton aria-label="reset system">
          <ResetIcon />
        </IconButton>
      </Tooltip>
      <Tooltip title="Save" onClick={showSaveDialog}>
        <IconButton edge="end" aria-label="save">
          <SaveIcon />
        </IconButton>
      </Tooltip>
    </>
  );

  const drawer = (
    <>
      <PanelHeader title="Systems">
        <Tooltip title="Add system">
          <IconButton
            edge="end"
            aria-label="add system"
            onClick={systemEvents.onCreateItem}
          >
            <AddIcon />
          </IconButton>
        </Tooltip>
      </PanelHeader>
      <CrudList
        active={selected.system}
        items={state.systems}
        {...omit(systemEvents, "onCreateItem")}
        onSelectItem={(system) =>
          dispatch({ type: "SELECT_SYSTEM", payload: system.id })
        }
        getItemProps={({ name }) => ({ name, icon: SystemIcon })}
      />
    </>
  );

  const dialogs = (
    <>
      <SystemDialogs />
      <SceneDialogs />
      <LibraryNodeDialogs />
      <EntityInitializerDialogs />
      {saveDialog}
    </>
  );

  if (!selected.system) {
    return (
      <AppBarAndDrawer
        appBar={<Typography>No system selected</Typography>}
        drawer={drawer}
      >
        {dialogs}
        <FlatPanel>
          <Typography>
            {state.systems.length > 0
              ? "Please select a system"
              : "Please create a system"}
          </Typography>
        </FlatPanel>
      </AppBarAndDrawer>
    );
  }

  // System and Scene available and selected
  return (
    <AppBarAndDrawer appBar={appBar} drawer={drawer}>
      {dialogs}
      <PanelContainer>
        <FlatPanel>
          {selected.scene ? (
            system && <TextSystem system={system} />
          ) : (
            <Typography>
              {selected.system.scenes.length > 0
                ? "Please select a scene"
                : "Please create a scene"}
            </Typography>
          )}
        </FlatPanel>
        <Panel name={PanelName.Scenes}>
          <PanelHeader title={PanelName.Scenes}>
            <Tooltip title="Add scene">
              <IconButton
                edge="end"
                aria-label="add scene"
                onClick={sceneEvents.onCreateItem}
              >
                <AddIcon />
              </IconButton>
            </Tooltip>
          </PanelHeader>
          <CrudList
            title={PanelName.Scenes}
            active={selected.scene}
            items={selected.system?.scenes ?? []}
            getItemProps={({ name }) => ({ name, icon: SceneIcon })}
            onSelectItem={(scene) =>
              dispatch({ type: "SELECT_SCENE", payload: scene.id })
            }
            {...omit(sceneEvents, "onCreateItem")}
          />
        </Panel>
        {selected.scene && (
          <>
            <Panel name={PanelName.Instances}>
              <PanelHeader title={PanelName.Instances}>
                <CreateEntityInitializerButton
                  entityDefinitions={libraryDefinitions.entities}
                  onCreate={(entityInitializer) =>
                    dispatch({
                      type: "CREATE_ENTITY_INITIALIZER",
                      payload: {
                        systemId: requireSelection("system"),
                        sceneId: requireSelection("scene"),
                        entityInitializer,
                      },
                    })
                  }
                />
              </PanelHeader>
              <CrudList
                active={selected.entityInitializer}
                items={selected.scene?.entities ?? []}
                getItemProps={({ name }) => ({
                  name,
                  icon: EntityInitializerIcon,
                })}
                onSelectItem={(entityInitializer) =>
                  dispatch({
                    type: "SELECT_ENTITY_INITIALIZER",
                    payload: entityInitializer.id,
                  })
                }
                {...omit(entityInitializerEvents, "onCreateItem")}
              />
            </Panel>
            <Panel name={PanelName.Library}>
              <PanelHeader title="Library">
                <Tooltip title="Create entity">
                  <IconButton
                    edge="end"
                    aria-label="create entity"
                    onClick={libraryNodeEvents.onCreateItem}
                  >
                    <AddIcon />
                  </IconButton>
                </Tooltip>
              </PanelHeader>
              <LibraryTree
                library={selected.system.library}
                selected={selected.libraryNode}
                onEdit={libraryNodeEvents.onUpdateItem}
                onDelete={libraryNodeEvents.onDeleteItem}
                onSelectedChange={(node) =>
                  dispatch({
                    type: "SELECT_LIBRARY_NODE",
                    payload: node.id,
                  })
                }
              />
            </Panel>
            <Panel name={PanelName.Inspector}>
              {selected.inspected && (
                <EditorStateContext.Provider
                  value={{
                    nativeComponents,
                    libraryDefinitions,
                  }}
                >
                  <InspectedObjectEditor
                    value={selected.inspected}
                    onChange={saveInspectorChange}
                  />
                </EditorStateContext.Provider>
              )}
            </Panel>
          </>
        )}
      </PanelContainer>
    </AppBarAndDrawer>
  );
};
