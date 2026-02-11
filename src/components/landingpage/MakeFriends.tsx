import Image from "next/image";

function MakeFriends() {
  return (
    <div className="max-w-3xl xl:max-w-7xl  mx-auto mb-8 sm:mb-12 lg:mb-16 lg:flex flex-row-reverse gap-4 xl:gap-24 items-center justify-center flex-wrap-reverse">
      <div className="flex-1 max-w-[700px] relative rounded-3xl bg-re d-100 z-50 aspect-video lg:ms-0 mx-auto">
        <Image
          src="/assets/Groupchat.png"
          alt="Friends Chat"
          width={0}
          height={0}
          sizes="100vw"
          className="absolute bottom-[40%] right-[10%] w-[30%] rounded-2xl shadow-2xl object-cover"
          style={{ width: "30%", height: "auto" }}
        />
        <Image
          src="/assets/PersonalisedDashboard.png"
          alt="Study Room"
          width={0}
          height={0}
          sizes="100vw"
          className="absolute top-0 left-0 h-[90%] rounded-2xl shadow-2xl object-cover"
          style={{ width: "auto", height: "90%" }}
        />
        <Image
          src="/assets/Groupchat.png"
          alt="Group Study"
          width={0}
          height={0}
          sizes="100vw"
          className="absolute bottom-0 right-0 w-[80%] rounded-2xl shadow-2xl object-cover"
          style={{ width: "80%", height: "auto" }}
        />
      </div>

      <h1 className="flex-1 max-w-[400px] text-balance text-xl sm:text-2xl xl:text-3xl font-poppins font-thin leading-[1.5] min-h-[calc(1.5em*4)] text-center xl:text-left lg:mt-0 mt-[25px]">
        Add friends, create study groups, track insights and progress together.
      </h1>
    </div>
  );
}

export default MakeFriends;
