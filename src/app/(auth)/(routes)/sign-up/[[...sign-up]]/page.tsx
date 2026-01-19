import { SignUp, auth } from "@clerk/nextjs";
import { redirect } from "next/navigation";
 
export default function Page() {
  const { userId } = auth();

  if (userId) {
    return redirect("/");
  }

  return <SignUp redirectUrl="/" />;
}