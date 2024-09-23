import PCNavBar from "@/components/Desktop/navbar";
import PCSideBar from "@/components/Desktop/sidebar";
import dynamic from "next/dynamic";
import { FaGlobeAmericas } from "react-icons/fa";

const MapWithNoSSR = dynamic(() => import("@/components/map"), {
    ssr: false,
    loading: () => <p className="relative animate-pulse"><FaGlobeAmericas className="size-5 absolute" /></p>,
  });

export default function DesktopPage() {
    return <>
    <div className="h-full flex-col md:flex">
      <PCNavBar />
      <PCSideBar />
      <div className="absolute h-full w-full -z-10" >
      <MapWithNoSSR />
      </div>
      
    </div>
  </>
}