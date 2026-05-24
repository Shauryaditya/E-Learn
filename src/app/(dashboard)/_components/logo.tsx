import Image from "next/image"

const Logo = () => {
  return (
    <div className="flex items-center gap-3">
      <Image
        height={40}
        width={40}
        alt="Aaccent E-Learn logo"
        src="/icon.png"
        className="rounded-lg"
      />
      <div className="leading-tight">
        <p className="text-sm font-bold text-slate-900 dark:text-white">Aaccent</p>
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">E-Learn</p>
      </div>
    </div>
  )
}

export default Logo
