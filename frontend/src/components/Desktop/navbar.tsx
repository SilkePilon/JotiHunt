import { ModeToggle } from "../mode-toggle";
import { PresetSave } from "../preset-save";

export default function PCNavBar() {
  return (
    <div className="bg-card text-card-foreground px-8 bg-opacity-80 flex flex-col items-start justify-between space-y-2 py-4 sm:flex-row sm:items-center sm:space-y-0 h-16 pointer-events-auto z-20">
      <h2 style={{ width: "100%" }} className="text-lg font-semibold">
        JotiHunt Map
      </h2>

      <div
        style={{ paddingLeft: "10px" }}
        className="ml-auto flex w-full space-x-2 sm:justify-end"
      >
        <PresetSave />
        <div className="hidden space-x-2 md:flex">
          <ModeToggle />
        </div>
      </div>
    </div>
  );
}
