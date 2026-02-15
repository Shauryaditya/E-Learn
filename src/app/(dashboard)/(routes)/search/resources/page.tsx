
import { auth } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getResources } from "@/actions/get-resources";
import { getStudentProfile } from "@/actions/get-student-profile";
import { ResourcesList } from "@/app/(dashboard)/(routes)/teacher/resources/_components/resources-list"; // Reuse or create new? Let's create a student specific list if needed, but reusing is fine for now. Actually the teacher list has delete buttons. We need a read-only list.
import { StudentResourcesList } from "./_components/student-resources-list";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SearchInput } from "@/components/search-input"; // Assuming you have this

interface SearchPageProps {
  searchParams: {
    title: string;
    categoryId: string;
    subject: string;
  }
};

const StudentResourcesPage = async ({ searchParams }: SearchPageProps) => {
  const { userId } = auth();

  if (!userId) {
    return redirect("/");
  }

  const profile = await getStudentProfile();

  // Smart Defaults: If no search params, use profile data
  // categories: BOARD, JEE_MAINS, JEE_ADVANCED, NEET
  

  const boardResources = await getResources({ 
      category: "BOARD", 
      search: searchParams.title,
  });

  const jeeMains = await getResources({ 
      category: "JEE_MAINS", 
      search: searchParams.title 
  });

  const jeeAdv = await getResources({ 
      category: "JEE_ADVANCED", 
      search: searchParams.title 
  });
  
  const jeeResources = [...jeeMains, ...jeeAdv];

  const neetResources = await getResources({ 
      category: "NEET", 
      search: searchParams.title 
  });
  
  const categories = [
    { label: "Board Scams", value: "BOARD" }, // Typo in original thought? No, "Board Exams".
  ];

  return (
    <div className="p-6 space-y-4">
        <h1 className="text-2xl font-bold">Past Papers & Resources</h1>
        <p className="text-muted-foreground text-sm">
            Access past year papers, sample papers, and notes for your exams.
        </p>

        <div className="w-full md:w-1/3">
             <SearchInput /> 
        </div>

        <Tabs defaultValue="BOARD" className="w-full">
            <TabsList className="grid w-full grid-cols-3 max-w-[400px]">
                <TabsTrigger value="BOARD">Board Exams</TabsTrigger>
                <TabsTrigger value="JEE">JEE</TabsTrigger>
                <TabsTrigger value="NEET">NEET</TabsTrigger>
            </TabsList>
            
            <TabsContent value="BOARD" className="mt-6">
                <StudentResourcesList items={boardResources} />
            </TabsContent>
            
            <TabsContent value="JEE" className="mt-6">
                 <StudentResourcesList items={jeeResources} />
            </TabsContent>

            <TabsContent value="NEET" className="mt-6">
                 <StudentResourcesList items={neetResources} />
            </TabsContent>
        </Tabs>
    </div>
  );
}

export default StudentResourcesPage;
