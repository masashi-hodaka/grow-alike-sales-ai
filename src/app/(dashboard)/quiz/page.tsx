'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type QuizState = 'category' | 'question' | 'result'
type QuestionType = 'multiple_choice' | 'written' | 'case_study'

type Question = {
  id: number | string
  type: QuestionType
  category: string
  difficulty: number
  question: string
  choices: { label: string; text: string }[]
  correct: string
  explanation: string
  xp: number
}

const CATEGORIES = [
  { id: 'hearing', label: 'ヒアリング', emoji: '👂', count: 42, weak: true },
  { id: 'opening', label: 'オープニング', emoji: '🚪', count: 38, weak: false },
  { id: 'proposition', label: '提案力', emoji: '💡', count: 45, weak: false },
  { id: 'objection', label: '反論処理', emoji: '🛡️', count: 35, weak: true },
  { id: 'closing', label: 'クロージング', emoji: '🤝', count: 40, weak: false },
  { id: 'rapport', label: 'ラポール構築', emoji: '😊', count: 28, weak: false },
  { id: 'follow_up', label: 'フォローアップ', emoji: '📞', count: 22, weak: false },
  { id: 'product', label: '商品知識', emoji: '📦', count: 55, weak: false },
  { id: 'mindset', label: 'メンタル・マインド', emoji: '🧘', count: 20, weak: false },
]

const QUESTION_TYPES = [
  { id: 'multiple_choice', label: '4択問題', emoji: '🔢', desc: '基礎知識を確認', xp: 10 },
  { id: 'written', label: '記述問題', emoji: '✍️', desc: 'AIが採点・フィードバック', xp: 25 },
  { id: 'case_study', label: 'ケーススタディ', emoji: '📖', desc: '実践的なシナリオ問題', xp: 40 },
]

const DUMMY_QUESTIONS: Question[] = [
  {
    id: 1,
    type: 'multiple_choice' as QuestionType,
    category: 'hearing',
    difficulty: 2,
    question: '初回商談でヒアリングする際、最も重要なことはどれですか？',
    choices: [
      { label: 'A', text: '自社商品の機能を詳しく説明する' },
      { label: 'B', text: '相手の課題・痛みを深く理解するために質問する' },
      { label: 'C', text: '価格の話を早めに切り出す' },
      { label: 'D', text: '競合他社の悪口を言って差別化する' },
    ],
    correct: 'B',
    explanation: '初回商談では「相手の話を聞く」ことが最優先です。BANTフレームワーク（Budget / Authority / Needs / Timeline）を意識しながら、課題の深掘りを行いましょう。',
    xp: 10,
  },
  {
    id: 2,
    type: 'multiple_choice' as QuestionType,
    category: 'hearing',
    difficulty: 3,
    question: '「今は予算がない」という反論を受けたとき、最も適切な次のアクションはどれですか？',
    choices: [
      { label: 'A', text: '「そうですか、また機会があれば」と電話を切る' },
      { label: 'B', text: '「実はキャンペーン中で安いですよ」とすぐに値引きを提示する' },
      { label: 'C', text: '「予算をかけない場合、現状どれくらいの損失が発生していますか？」と課題の損失額を確認する' },
      { label: 'D', text: '「うちは他社より安いです」と競合比較をする' },
    ],
    correct: 'C',
    explanation: '「予算がない」は多くの場合、「ROIが見えない」「緊急性を感じない」というシグナルです。現状の損失・コストを数値化することで、投資対効果を実感させましょう。',
    xp: 15,
  },
]

export default function QuizPage() {
  const router = useRouter()
  const profileIdRef = useRef<string | null>(null)
  const [state, setState] = useState<QuizState>('category')
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedType, setSelectedType] = useState<QuestionType>('multiple_choice')
  const [currentQ, setCurrentQ] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [showExplanation, setShowExplanation] = useState(false)
  const [answers, setAnswers] = useState<{ correct: boolean; xp: number }[]>([])
  const [writtenAnswer, setWrittenAnswer] = useState('')
  const [questions, setQuestions] = useState<Question[]>(DUMMY_QUESTIONS)
  const [loading, setLoading] = useState(false)
  const [genError, setGenError] = useState<string | null>(null)

  const question = questions[currentQ]
  const totalXp = answers.reduce((sum, a) => sum + a.xp, 0)
  const correct = answers.filter(a => a.correct).length

  // プロフィールIDをマウント時に取得
  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: profile } = await supabase.from('profiles').select('id').eq('user_id', user.id).single()
      if (profile) profileIdRef.current = profile.id
    }
    load()
  }, [])

  // クイズ完了時にXPをDBへ反映
  const saveXpToDb = async (earnedXp: number) => {
    if (!profileIdRef.current || earnedXp <= 0) return
    try {
      const supabase = createClient()
      const { data: level } = await supabase
        .from('user_levels')
        .select('current_xp, total_xp_earned')
        .eq('profile_id', profileIdRef.current)
        .single()
      if (!level) return
      await supabase.from('user_levels').update({
        current_xp: (level.current_xp ?? 0) + earnedXp,
        total_xp_earned: (level.total_xp_earned ?? 0) + earnedXp,
      }).eq('profile_id', profileIdRef.current)
      router.refresh() // サイドバーのXP表示を更新
    } catch { /* XP保存失敗は無視 */ }
  }

  const toggleCategory = (id: string) => {
    setSelectedCategories(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    )
  }

  const startQuiz = async () => {
    if (selectedCategories.length === 0 || loading) return
    setLoading(true)
    setGenError(null)
    try {
      const res = await fetch('/api/quiz/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categories: selectedCategories,
          questionType: selectedType,
          difficulty: 2,
          count: 5,
        }),
      })
      const data = await res.json()
      if (!res.ok || !Array.isArray(data.questions) || data.questions.length === 0) {
        throw new Error(data.error ?? '問題の生成に失敗しました')
      }
      const mapped: Question[] = data.questions.map((q: Record<string, unknown>, i: number) => ({
        id: i + 1,
        type: (q.question_type as QuestionType) ?? selectedType,
        category: (q.skill_category as string) ?? selectedCategories[0],
        difficulty: (q.difficulty as number) ?? 2,
        question: (q.question_text as string) ?? '',
        choices: Array.isArray(q.choices) ? (q.choices as { label: string; text: string }[]) : [],
        correct: (q.correct_answer as string) ?? '',
        explanation: (q.explanation as string) ?? '',
        xp: (q.xp_reward as number) ?? 10,
      }))
      setQuestions(mapped)
      setCurrentQ(0)
      setAnswers([])
      setSelectedAnswer(null)
      setShowExplanation(false)
      setWrittenAnswer('')
      setState('question')
    } catch (e) {
      setGenError(e instanceof Error ? e.message : '問題の生成に失敗しました。もう一度お試しください。')
    } finally {
      setLoading(false)
    }
  }

  const submitAnswer = () => {
    if (!selectedAnswer && selectedType === 'multiple_choice') return
    const isCorrect = selectedAnswer === question.correct
    setShowExplanation(true)
    setAnswers(prev => [...prev, { correct: isCorrect, xp: isCorrect ? question.xp : 0 }])
  }

  const nextQuestion = () => {
    if (currentQ + 1 >= questions.length) {
      // answers には submitAnswer() で最後の回答が既に追加済み
      const earned = answers.reduce((sum, a) => sum + a.xp, 0)
      saveXpToDb(earned)
      setState('result')
    } else {
      setCurrentQ(q => q + 1)
      setSelectedAnswer(null)
      setShowExplanation(false)
      setWrittenAnswer('')
    }
  }

  if (state === 'category') {
    return (
      <div className="p-6 max-w-3xl">
        <div className="flex items-center gap-2 text-gray-500 text-sm mb-5">
          <Link href="/dashboard" className="hover:text-gray-700">ホーム</Link>
          <span>/</span>
          <span className="text-gray-800 font-medium">問題練習</span>
        </div>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl text-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#f97316,#ea580c)' }}>
            🧠
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">問題練習</h1>
            <p className="text-gray-500 text-sm">カテゴリを選んで練習スタート</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm mb-4">
          <h2 className="font-bold text-gray-800 mb-1">カテゴリを選択 <span className="text-orange-500">（複数可）</span></h2>
          <p className="text-sm text-gray-400 mb-4">🔴 は弱点カテゴリです</p>
          <div className="grid grid-cols-3 gap-3">
            {CATEGORIES.map(cat => (
              <button key={cat.id} onClick={() => toggleCategory(cat.id)}
                className={`border-2 rounded-xl p-3 text-left transition relative ${
                  selectedCategories.includes(cat.id)
                    ? 'border-orange-400 bg-orange-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}>
                {cat.weak && (
                  <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500" />
                )}
                <div className="text-xl mb-1">{cat.emoji}</div>
                <p className={`font-semibold text-sm ${selectedCategories.includes(cat.id) ? 'text-orange-700' : 'text-gray-800'}`}>
                  {cat.label}
                </p>
                <p className="text-xs text-gray-400">{cat.count}問</p>
              </button>
            ))}
          </div>
          <button onClick={() => setSelectedCategories(CATEGORIES.filter(c => c.weak).map(c => c.id))}
            className="mt-3 text-sm text-orange-500 hover:text-orange-600 font-medium">
            弱点カテゴリを自動選択
          </button>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm mb-4">
          <h2 className="font-bold text-gray-800 mb-3">問題形式</h2>
          <div className="space-y-2">
            {QUESTION_TYPES.map(qt => (
              <button key={qt.id} onClick={() => setSelectedType(qt.id as QuestionType)}
                className={`w-full border-2 rounded-xl p-3 flex items-center gap-3 transition ${
                  selectedType === qt.id ? 'border-orange-400 bg-orange-50' : 'border-gray-200 hover:border-gray-300'
                }`}>
                <span className="text-2xl">{qt.emoji}</span>
                <div className="flex-1 text-left">
                  <p className={`font-semibold text-sm ${selectedType === qt.id ? 'text-orange-700' : 'text-gray-800'}`}>
                    {qt.label}
                  </p>
                  <p className="text-xs text-gray-500">{qt.desc}</p>
                </div>
                <span className="text-orange-500 font-bold text-sm">+{qt.xp} XP/問</span>
              </button>
            ))}
          </div>
        </div>

        {genError && (
          <div className="mb-3 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600">
            ⚠️ {genError}
          </div>
        )}

        <button onClick={startQuiz} disabled={selectedCategories.length === 0 || loading}
          className="w-full py-4 rounded-xl text-white font-bold text-base transition disabled:opacity-40"
          style={{ background: 'linear-gradient(135deg,#f97316,#ea580c)' }}>
          {loading
            ? 'AIが問題を生成中... ⏳'
            : selectedCategories.length > 0
            ? `${selectedCategories.length}カテゴリで練習開始 →`
            : 'カテゴリを選択してください'}
        </button>
      </div>
    )
  }

  if (state === 'question') {
    return (
      <div className="p-6 max-w-2xl">
        {/* Progress */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all"
              style={{ width: `${((currentQ) / questions.length) * 100}%`, background: 'linear-gradient(90deg,#f97316,#fbbf24)' }} />
          </div>
          <span className="text-sm text-gray-500 font-medium whitespace-nowrap">
            {currentQ + 1} / {questions.length}
          </span>
        </div>

        {/* Question card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-600 font-medium">
              {CATEGORIES.find(c => c.id === question.category)?.label}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
              {'★'.repeat(question.difficulty)}
            </span>
            <span className="ml-auto text-orange-500 font-bold text-sm">+{question.xp} XP</span>
          </div>

          <p className="text-gray-900 font-semibold text-base leading-relaxed mb-5">
            {question.question}
          </p>

          <div className="space-y-2">
            {question.choices.map(choice => {
              let className = 'w-full border-2 rounded-xl p-3.5 text-left text-sm transition flex items-start gap-3'
              if (showExplanation) {
                if (choice.label === question.correct) {
                  className += ' border-green-400 bg-green-50'
                } else if (choice.label === selectedAnswer && choice.label !== question.correct) {
                  className += ' border-red-400 bg-red-50'
                } else {
                  className += ' border-gray-200 opacity-60'
                }
              } else {
                className += selectedAnswer === choice.label
                  ? ' border-orange-400 bg-orange-50'
                  : ' border-gray-200 hover:border-orange-300'
              }
              return (
                <button key={choice.label} onClick={() => !showExplanation && setSelectedAnswer(choice.label)}
                  className={className}>
                  <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    showExplanation && choice.label === question.correct ? 'bg-green-500 text-white' :
                    showExplanation && choice.label === selectedAnswer ? 'bg-red-500 text-white' :
                    selectedAnswer === choice.label ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-600'
                  }`}>
                    {choice.label}
                  </span>
                  <span className="text-gray-800">{choice.text}</span>
                </button>
              )
            })}
          </div>

          {showExplanation && (
            <div className={`mt-4 p-4 rounded-xl text-sm ${
              selectedAnswer === question.correct ? 'bg-green-50 border border-green-200' : 'bg-orange-50 border border-orange-200'
            }`}>
              <p className={`font-bold mb-1 ${selectedAnswer === question.correct ? 'text-green-700' : 'text-orange-700'}`}>
                {selectedAnswer === question.correct ? '✅ 正解！' : '❌ 不正解'}
              </p>
              <p className={`text-sm leading-relaxed ${selectedAnswer === question.correct ? 'text-green-700' : 'text-orange-700'}`}>
                {question.explanation}
              </p>
            </div>
          )}
        </div>

        {!showExplanation ? (
          <button onClick={submitAnswer} disabled={!selectedAnswer}
            className="w-full py-3.5 rounded-xl text-white font-bold text-sm transition disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg,#f97316,#ea580c)' }}>
            回答を確定する
          </button>
        ) : (
          <button onClick={nextQuestion}
            className="w-full py-3.5 rounded-xl text-white font-bold text-sm transition"
            style={{ background: 'linear-gradient(135deg,#1e293b,#334155)' }}>
            {currentQ + 1 >= questions.length ? '結果を見る →' : '次の問題へ →'}
          </button>
        )}
      </div>
    )
  }

  // Result
  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">問題練習 完了！</h1>
      <p className="text-gray-500 text-sm mb-6">{questions.length}問を解きました</p>

      <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-6 text-white text-center mb-5">
        <p className="text-white/70 text-sm mb-1">正答率</p>
        <p className="text-6xl font-black mb-2">{Math.round((correct / questions.length) * 100)}%</p>
        <p className="text-white/70 text-sm mb-4">{correct} / {questions.length} 問正解</p>
        <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-4 py-1.5">
          <span className="text-yellow-300 font-bold">+{totalXp} XP</span>
          <span className="text-white/70 text-sm">獲得！</span>
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={() => { setState('category'); setCurrentQ(0); setAnswers([]); setSelectedAnswer(null); setShowExplanation(false) }}
          className="flex-1 border border-gray-200 text-gray-700 py-3 rounded-xl font-semibold text-sm hover:bg-gray-50 transition">
          もう一度練習
        </button>
        <Link href="/roleplay"
          className="flex-1 text-center text-white py-3 rounded-xl font-semibold text-sm transition"
          style={{ background: 'linear-gradient(135deg,#8b5cf6,#6d28d9)' }}>
          AIロープレで実践
        </Link>
      </div>
    </div>
  )
}
