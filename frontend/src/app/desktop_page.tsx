import PCNavBar from "@/components/Desktop/navbar";
import PCSideBar from "@/components/Desktop/sidebar";
import dynamic from "next/dynamic";
import { FaGlobeAmericas } from "react-icons/fa";

const MapWithNoSSR = dynamic(() => import("@/components/map"), {
  ssr: false,
  loading: () => (
    <p className="relative animate-pulse">
      <FaGlobeAmericas className="size-5 absolute" />
    </p>
  ),
});

export default function DesktopPage() {
  return (
    <>
      <div className="h-screen flex flex-col">
        <PCNavBar />
        <PCSideBar />
        <div className="absolute h-full w-full">
          <MapWithNoSSR />
        </div>
      </div>
    </>
  );
}
