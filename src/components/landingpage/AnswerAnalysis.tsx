import Image from "next/image";

function AnswerAnalysis() {
  return (
    <div className="max-w-3xl xl:max-w-7xl mx-auto mb-8 sm:mb-12 lg:mb-16 px-4 sm:px-0 flex flex-col lg:flex-row gap-6 sm:gap-8 xl:gap-24 items-center justify-center">
      <div className="flex-1 max-w-[600px] relative w-full">
        <Image
          src="/assets/TestSeries.png"
          alt="Answer Analysis"
          width={0}
          height={0}
          sizes="100vw"
          className="w-full h-auto"
          style={{
            filter: "drop-shadow(0 10px 20px rgba(0,0,0,0.2))",
            width: '100%',
            height: 'auto',
          }}
        />
      </div>
      <h1 className="flex-1 max-w-[400px] text-balance text-xl sm:text-2xl xl:text-3xl font-poppins font-thin leading-[1.5] min-h-[calc(1.5em*4)] text-center xl:text-left">
        Get your boards answer scripts digitally evaluated
      </h1>
    </div>
  );
}

export default AnswerAnalysis;
