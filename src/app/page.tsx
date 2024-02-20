import { Button } from "@/components/ui/button";
import Image from "next/image";

export default function Home() {
  return (
   <main>
    <div className="flex flex-col items-center justify-center h-screen">
      <h1>Hello</h1>
      <Button>
        Click Me
      </Button>
    </div>
   </main>
  );
}
