import { Card, CardContent } from "../ui/card";
import { ChartContainer } from "../ui/chart";
import { Bar, BarChart, LabelList, XAxis, YAxis } from "recharts";
import { Separator } from "../ui/separator";
import AreaStatusButtons from "../AreaStatusButtons";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import PCMessageList from "./messageList";

export default function PCSideBar() {
  return (
    <div className="h-full py-6 w-fit">
      <div className="grid h-full">
        <div className="hidden flex-col space-y-4 sm:flex md:order-2">
          <Card className="">
            <CardContent className="flex gap-4 p-5 pb-2">
              <Tabs>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="hints">
                    <div>Hints</div>
                  </TabsTrigger>
                  <TabsTrigger value="assignments">
                    <div>Opdrachten</div>
                  </TabsTrigger>
                  <TabsTrigger value="info">
                    <div>Info</div>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="hints" className="mt-0 border-0 p-0">
                  <PCMessageList group="hint"></PCMessageList>
                </TabsContent>
                <TabsContent value="assignments" className="mt-0 border-0 p-0">
                  <PCMessageList group="hint"></PCMessageList>
                </TabsContent>
                <TabsContent value="info" className="mt-0 border-0 p-0">
                  <PCMessageList group="hint"></PCMessageList>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <Separator style={{ height: "2px" }} />
          <Card>
            <CardContent>
              <AreaStatusButtons />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
