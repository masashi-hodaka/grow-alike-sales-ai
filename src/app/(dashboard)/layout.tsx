import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/ui/Sidebar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  // プロフィール未設定ならオンボーディングへ（無限ループ防止のためregisterに直接リダイレクト）
  if (!profile) {
    redirect('/register?onboarding=true')
  }

  const { data: userLevel } = await supabase
    .from('user_levels')
    .select('*')
    .eq('profile_id', profile.id)
    .single()

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar profile={profile} userLevel={userLevel} />
      <main className="flex-1 ml-[228px] min-h-screen bg-slate-50">
        {children}
      </main>
    </div>
  )
}
