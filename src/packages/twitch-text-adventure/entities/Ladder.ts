import { Entity } from "../../ecs/Entity";
import { Describable } from "../../ecs-describable/Describable";
import { Interactive } from "../../ecs-interactive/Interactive";
import { TextAdventureSM } from "../TextAdventureSM";
import { Lighter } from "./Lighter";

export class Ladder extends Entity {
  get sceneManager() {
    return this.system.modules.resolveType(TextAdventureSM);
  }
  constructor() {
    super();
    this.components.push(
      new Describable({
        description: "You see a ladder.",
        isActive: () => Lighter.isLit(this.system),
      }),
      new Interactive({
        action: "Climb ladder",
        isActive: () => Lighter.isLit(this.system),
        effect: () => {
          this.sceneManager.sceneId = "cliff";
        },
      })
    );
  }
}
