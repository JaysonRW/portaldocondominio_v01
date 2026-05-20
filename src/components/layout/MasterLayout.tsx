import { Outlet } from "react-router"

/** Layout exclusivo do Painel Master — sem Sidebar do síndico */
export default function MasterLayout() {
  return (
    <div className="min-h-screen w-full bg-[#f8fafc]">
      <Outlet />
    </div>
  )
}
