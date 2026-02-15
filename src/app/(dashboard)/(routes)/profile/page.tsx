
import { auth } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { getStudentProfile } from "@/actions/get-student-profile";
import { ProfileForm } from "@/components/forms/profile-form";

const ProfilePage = async () => {
    const { userId } = auth();

    if (!userId) {
        return redirect("/");
    }

    const profile = await getStudentProfile();

    return ( 
        <div className="p-6">
             <h1 className="text-2xl font-medium">
                My Profile
            </h1>
            <div className="mt-6 border bg-slate-50 rounded-md p-6 dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                <ProfileForm initialData={{
                    grade: profile?.grade || "",
                    board: profile?.board || "",
                    subjects: profile?.subjects || [],
                    targetExam: profile?.targetExam || ""
                }} />
            </div>
        </div>
     );
}
 
export default ProfilePage;
