export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-center bg-background px-3 py-4 sm:items-center sm:px-4 sm:py-10">
      {children}
    </div>
  )
}