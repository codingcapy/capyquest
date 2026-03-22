import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="min-h-screen bg-radial from-fuchsia-950 to-black text-white flex flex-col">
      <div className="text-center text-6xl py-10">CapyQuest</div>
      <div className="mx-auto flex flex-col">
        <input
          type="text"
          placeholder="Email"
          className="border rounded px-2 py-1 my-2 bg-[#202020]"
        />
        <input
          type="password"
          placeholder="Password"
          className="border rounded px-2 py-1 my-2 bg-[#202020]"
        />
        <button className="px-3 py-2 bg-fuchsia-700 rounded my-2 cursor-pointer">
          Login
        </button>
      </div>
    </div>
  );
}
