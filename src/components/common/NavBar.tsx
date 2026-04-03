export default function Navbar() {
  return (
    <nav className="flex justify-between items-center p-4 shadow">
      <h1 className="text-xl font-bold">EVenue</h1>

      <div className="space-x-4">
        <a href="/" className="hover:text-blue-500">Home</a>
        <a href="/venues" className="hover:text-blue-500">Venues</a>
        <a href="/about" className="hover:text-blue-500">About</a>
      </div>
    </nav>
  );
}