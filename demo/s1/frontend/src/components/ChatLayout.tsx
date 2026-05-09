import Sidebar from "./Sidebar";

interface Props {
  children: React.ReactNode;
}

export default function ChatLayout({ children }: Props) {
  return (
    <div className="flex h-screen bg-gray-800">
      <Sidebar />
      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  );
}
