
import { auth } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { isTeacher } from "@/lib/teacher";
import { getResources } from "@/actions/get-resources";
import { ResourcesList } from "./_components/resources-list";
import { ResourceForm } from "./_components/resource-form";

const ResourcesPage = async () => {
  const { userId } = auth();

  if (!userId || !isTeacher(userId)) {
    return redirect("/");
  }

  const resources = await getResources({});

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-medium">
            Resource Library
        </h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
            <div className="bg-slate-100 p-4 rounded-md mb-4">
                <h2 className="font-medium mb-2">Upload New Resource</h2>
                <ResourceForm />
            </div>
        </div>
        
        <div>
            <h2 className="font-medium mb-4">Existing Resources</h2>
            <ResourcesList items={resources} />
        </div>
      </div>
    </div>
  );
}

export default ResourcesPage;
