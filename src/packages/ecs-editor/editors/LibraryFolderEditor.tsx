import { InspectedObjectInfo } from "../components/InspectedObjectInfo";
import { FolderIcon } from "../icons";
import { LibraryFolder } from "../../ecs-serializable/types/LibraryFolder";
import { InspectorPanelHeader } from "../components/InspectorPanelHeader";

export type LibraryFolderEditorProps = { value: LibraryFolder };

export const LibraryFolderEditor = ({ value }: LibraryFolderEditorProps) => (
  <>
    <InspectorPanelHeader />
    <InspectedObjectInfo icon={<FolderIcon />} name={value.name} />
  </>
);
