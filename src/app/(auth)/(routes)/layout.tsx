const AuthLayout = ({
    children
}: {
    children: React.ReactNode
}) => {
  return (
    <div className="h-full flex items-center justify-center mt-9">
        {children}
    </div>
  )
}

export default AuthLayout