import Image from "next/image"

const Logo = () => {
  return (
    <Image 
    height={100}
    width={100}
    alt="logo"
    src="/icon.png"
    />
  )
}

export default Logo