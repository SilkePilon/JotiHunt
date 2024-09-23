import NewsCardList from "../cardlist";
import { TabsContent } from "../ui/tabs";

export type MessageType = "hint" | "assignment" | "info";

export default function PCMessageList({ group }: { group: MessageType }) {
  return (
    <>
      <div className="flex flex-col space-y-4">
        <div
          style={{ maxHeight: "80vh" }}
          className="grid h-full gap-6 lg:grid-rows-1"
        >
          <div
            style={{ overflow: "hidden" }}
            id="news"
            className="rounded-md border  bg-muted"
          >
            <NewsCardList />
          </div>
        </div>
      </div>
    </>
  );
}
