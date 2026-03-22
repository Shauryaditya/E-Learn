import { ChapterSubmission } from "@prisma/client";

interface StudentSubmissionsListProps {
  submissions: ChapterSubmission[];
}

export const StudentSubmissionsList = ({ submissions }: StudentSubmissionsListProps) => {
  if (submissions.length === 0) return null;

  return (
    <div className="mt-8">
      <h3 className="text-xl font-semibold mb-4">Your Submissions</h3>
      <div className="space-y-6">
        {submissions.map((sub, index) => {
           // Display annotated images if the teacher drew on them, otherwise the originals
           const displayImages = sub.annotatedImages.length > 0 ? sub.annotatedImages : sub.images;
           const isGraded = sub.status === "REVIEWED";
           
           return (
             <div key={sub.id} className="border bg-white rounded-md p-4 shadow-sm">
               <div className="flex items-center justify-between mb-2">
                 <p className="font-medium text-slate-800">Attempt #{submissions.length - index}</p>
                 <p className="text-sm text-slate-500">
                   {new Date(sub.createdAt).toLocaleDateString()}
                 </p>
               </div>
               
               <div className="mb-4">
                 <span className={`text-xs font-semibold px-2 py-1 rounded-md ${isGraded ? "bg-emerald-100 text-emerald-700" : "bg-sky-100 text-sky-700"}`}>
                   {sub.status === "REVIEWED" ? "Graded" : "Submitted"}
                 </span>
               </div>

               {isGraded && sub.feedback && (
                 <div className="mb-4 p-3 bg-slate-50 rounded-md border text-sm">
                   <p className="font-medium text-slate-800 mb-1">Teacher Feedback:</p>
                   <p className="text-slate-600 whitespace-pre-wrap">{sub.feedback}</p>
                 </div>
               )}

               <div>
                 <p className="text-sm font-medium mb-2 text-slate-700">
                   {isGraded ? "Corrected Images" : "Submitted Images"}
                 </p>
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                   {displayImages.map((url: string, i: number) => (
                     <div key={i} className="relative aspect-square rounded-md overflow-hidden border">
                       <a href={url} target="_blank" rel="noreferrer">
                         <img src={url} alt={`Submission ${i+1}`} className="object-cover w-full h-full hover:scale-105 transition" />
                       </a>
                     </div>
                   ))}
                 </div>
               </div>
             </div>
           );
        })}
      </div>
    </div>
  );
};
