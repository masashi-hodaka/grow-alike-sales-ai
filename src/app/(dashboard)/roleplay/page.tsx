'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'

type Mode = 'chat' | 'voice'
type Step = 'mode' | 'select' | 'session' | 'result'

type Condition = {
  persona: string
  difficulty: number
  industry: string
  warmth: 'cold' | 'warm' | 'hot'
  scenario: string
}

type Message = {
  role: 'user' | 'ai'
  content: string
  timestamp: Date
}

const PERSONAS = [
  { id: 'smb_owner', label: '中小企業 社長', emoji: '👔', desc: '50代男性・コスト意識高め' },
  { id: 'enterprise_mgr', label: '大手 部長', emoji: '🏢', desc: '40代・稟議プロセス重視' },
  { id: 'startup_cto', label: 'スタートアップ CTO', emoji: '💻', desc: '30代・技術志向・即断即決' },
  { id: 'mid_purchasing', label: '中堅企業 購買担当', emoji: '📋', desc: '40代・複数社比較中' },
]

const INDUSTRIES = ['IT・SaaS', '製造業', '小売・EC', '金融・保険', '医療・ヘルスケア', '不動産', 'その他']

const DUMMY_RESULT = {
  overall: 74,
  scores: {
    opening: 85,
    hearing: 62,
    proposition: 78,
    objection_handling: 71,
    closing: 68,
  },
  strengths: ['オープニングのトーンが自然で好印象でした', 'お客様のペルソナに合わせた言葉選びができていました'],
  improvements: [
    '「予算がない」という反論に対して即座に価格の話に飛んでしまいました。まずは課題・損失の深掘りが必要です',
    '質問が表面的で、お客様の本音を引き出せていません。「なぜですか？」を意識的に使いましょう',
  ],
  xpEarned: 85,
}

// ─── Mode Selection ─────────────────────────────────────────────────────────

function ModeSelect({ onSelect }: { onSelect: (mode: Mode) => void }) {
  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center gap-2 text-gray-500 text-sm mb-5">
        <Link href="/dashboard" className="hover:text-gray-700">ホーム</Link>
        <span>/</span>
        <span className="text-gray-800 font-medium">AIロープレ</span>
      </div>

      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl text-xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg,#8b5cf6,#6d28d9)' }}>
          🎭
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AIロープレ</h1>
          <p className="text-gray-500 text-sm">まず練習スタイルを選んでください</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-5">
        {/* Chat Roleplay */}
        <button onClick={() => onSelect('chat')}
          className="bg-white rounded-2xl p-7 shadow-sm border-2 border-transparent hover:border-orange-400 transition-all group text-left">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl mb-5"
            style={{ background: 'linear-gradient(135deg,#f97316,#ea580c)' }}>
            💬
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">チャットロープレ</h2>
          <p className="text-gray-500 text-sm leading-relaxed mb-4">
            テキストで営業トークを練習。じっくり考えながら返答でき、初心者にもおすすめ。
          </p>
          <ul className="space-y-1.5 text-xs text-gray-500">
            <li className="flex items-center gap-1.5"><span className="text-green-500">✓</span> 文章で返答を考えながら練習</li>
            <li className="flex items-center gap-1.5"><span className="text-green-500">✓</span> 会話履歴がそのまま残る</li>
            <li className="flex items-center gap-1.5"><span className="text-green-500">✓</span> AIが即座にフィードバック</li>
          </ul>
          <div className="mt-5 text-orange-500 font-semibold text-sm group-hover:translate-x-1 transition-transform">
            チャットで始める →
          </div>
        </button>

        {/* Voice Roleplay */}
        <button onClick={() => onSelect('voice')}
          className="bg-white rounded-2xl p-7 shadow-sm border-2 border-transparent hover:border-violet-400 transition-all group text-left">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl mb-5"
            style={{ background: 'linear-gradient(135deg,#8b5cf6,#6d28d9)' }}>
            🎙️
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">音声ロープレ</h2>
          <p className="text-gray-500 text-sm leading-relaxed mb-4">
            マイクで話して練習。実際の電話・対面商談に近い感覚でトレーニングできます。
          </p>
          <ul className="space-y-1.5 text-xs text-gray-500">
            <li className="flex items-center gap-1.5"><span className="text-green-500">✓</span> マイクで話すだけでOK</li>
            <li className="flex items-center gap-1.5"><span className="text-green-500">✓</span> AIの返答を音声で聞ける</li>
            <li className="flex items-center gap-1.5"><span className="text-green-500">✓</span> よりリアルな商談感覚</li>
          </ul>
          <div className="mt-5 text-violet-500 font-semibold text-sm group-hover:translate-x-1 transition-transform">
            音声で始める →
          </div>
        </button>
      </div>

      {/* Recent sessions */}
      <div className="mt-7 bg-white rounded-2xl p-5 shadow-sm">
        <h2 className="font-bold text-gray-800 mb-3">最近のロープレ結果</h2>
        <div className="space-y-2">
          {[
            { persona: '中小企業 社長', score: 74, date: '2026/05/11', xp: 85, mode: 'chat' },
            { persona: 'スタートアップ CTO', score: 81, date: '2026/05/09', xp: 95, mode: 'voice' },
          ].map((s, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
              <div className="w-10 h-10 rounded-xl bg-violet-100 text-xl flex items-center justify-center">
                {s.mode === 'voice' ? '🎙️' : '💬'}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">{s.persona}</p>
                <p className="text-xs text-gray-400">{s.date} · {s.mode === 'voice' ? '音声' : 'チャット'}</p>
              </div>
              <div className="text-right">
                <span className="font-bold text-gray-800">{s.score}</span>
                <span className="text-gray-400 text-sm">点</span>
                <p className="text-xs text-orange-500 font-medium">+{s.xp} XP</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Condition Selection ─────────────────────────────────────────────────────

function ConditionSelect({
  mode,
  condition,
  setCondition,
  onStart,
  onBack,
}: {
  mode: Mode
  condition: Condition
  setCondition: React.Dispatch<React.SetStateAction<Condition>>
  onStart: () => void
  onBack: () => void
}) {
  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center gap-2 text-gray-500 text-sm mb-5">
        <Link href="/dashboard" className="hover:text-gray-700">ホーム</Link>
        <span>/</span>
        <button onClick={onBack} className="hover:text-gray-700">AIロープレ</button>
        <span>/</span>
        <span className="text-gray-800 font-medium">
          {mode === 'voice' ? '音声ロープレ' : 'チャットロープレ'} — 条件設定
        </span>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl text-xl flex items-center justify-center"
          style={{ background: mode === 'voice' ? 'linear-gradient(135deg,#8b5cf6,#6d28d9)' : 'linear-gradient(135deg,#f97316,#ea580c)' }}>
          {mode === 'voice' ? '🎙️' : '💬'}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {mode === 'voice' ? '音声ロープレ' : 'チャットロープレ'} — 条件設定
          </h1>
          <p className="text-gray-500 text-sm">シナリオを設定してリアルな営業練習を始めましょう</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm space-y-6">
        {/* Persona */}
        <div>
          <h2 className="font-bold text-gray-800 mb-3">1. 顧客ペルソナを選択</h2>
          <div className="grid grid-cols-2 gap-3">
            {PERSONAS.map(p => (
              <button key={p.id} onClick={() => setCondition(c => ({ ...c, persona: p.id }))}
                className={`border-2 rounded-xl p-4 text-left transition ${
                  condition.persona === p.id ? 'border-violet-500 bg-violet-50' : 'border-gray-200 hover:border-gray-300'
                }`}>
                <div className="text-2xl mb-1">{p.emoji}</div>
                <p className={`font-semibold text-sm ${condition.persona === p.id ? 'text-violet-700' : 'text-gray-800'}`}>
                  {p.label}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{p.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Difficulty */}
        <div>
          <h2 className="font-bold text-gray-800 mb-3">2. 難易度</h2>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map(d => (
              <button key={d} onClick={() => setCondition(c => ({ ...c, difficulty: d }))}
                className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition ${
                  condition.difficulty === d ? 'text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
                style={condition.difficulty === d ? { background: 'linear-gradient(135deg,#f97316,#ea580c)' } : {}}>
                {'★'.repeat(d)}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-1.5">
            {condition.difficulty <= 2 ? '入門：反論少なく会話しやすい' : condition.difficulty <= 3 ? '標準：一般的な顧客対応' : '上級：厳しい反論・時間プレッシャーあり'}
          </p>
        </div>

        {/* Industry */}
        <div>
          <h2 className="font-bold text-gray-800 mb-3">3. 顧客の業種</h2>
          <div className="flex flex-wrap gap-2">
            {INDUSTRIES.map(ind => (
              <button key={ind} onClick={() => setCondition(c => ({ ...c, industry: ind }))}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition border ${
                  condition.industry === ind ? 'bg-orange-500 text-white border-orange-500' : 'border-gray-200 text-gray-600 hover:border-orange-300'
                }`}>
                {ind}
              </button>
            ))}
          </div>
        </div>

        {/* Warmth */}
        <div>
          <h2 className="font-bold text-gray-800 mb-3">4. 顧客の温度感</h2>
          <div className="grid grid-cols-3 gap-3">
            {([
              { id: 'cold', label: 'コールド', emoji: '🧊', desc: '初回接触・興味なし' },
              { id: 'warm', label: 'ウォーム', emoji: '🌤️', desc: '多少興味あり' },
              { id: 'hot', label: 'ホット', emoji: '🔥', desc: '積極的に検討中' },
            ] as const).map(w => (
              <button key={w.id} onClick={() => setCondition(c => ({ ...c, warmth: w.id }))}
                className={`border-2 rounded-xl p-3 text-center transition ${
                  condition.warmth === w.id ? 'border-orange-400 bg-orange-50' : 'border-gray-200 hover:border-gray-300'
                }`}>
                <div className="text-xl mb-1">{w.emoji}</div>
                <p className={`font-semibold text-sm ${condition.warmth === w.id ? 'text-orange-700' : 'text-gray-700'}`}>
                  {w.label}
                </p>
                <p className="text-xs text-gray-500">{w.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Scenario */}
        <div>
          <h2 className="font-bold text-gray-800 mb-1.5">5. シナリオメモ <span className="text-gray-400 font-normal text-sm">（任意）</span></h2>
          <textarea
            value={condition.scenario}
            onChange={e => setCondition(c => ({ ...c, scenario: e.target.value }))}
            placeholder="例：先週リード獲得した企業への初回フォローコール。担当者はDX推進部の山田部長（42歳）..."
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none bg-gray-50"
            rows={2}
          />
        </div>

        <button onClick={onStart} disabled={!condition.persona}
          className="w-full py-4 rounded-xl text-white font-bold text-base transition disabled:opacity-50"
          style={{ background: mode === 'voice' ? 'linear-gradient(135deg,#8b5cf6,#6d28d9)' : 'linear-gradient(135deg,#f97316,#ea580c)' }}>
          {condition.persona
            ? (mode === 'voice' ? '🎙️ 音声ロープレを開始する →' : '💬 チャットロープレを開始する →')
            : 'ペルソナを選択してください'}
        </button>
      </div>
    </div>
  )
}

// ─── Chat Session ────────────────────────────────────────────────────────────

function ChatSession({
  condition,
  onEnd,
}: {
  condition: Condition
  onEnd: () => void
}) {
  const persona = PERSONAS.find(p => p.id === condition.persona)
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'ai',
      content: 'こんにちは。お電話ありがとうございます。今お時間よろしいでしょうか？',
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState('')
  const [isAiTyping, setIsAiTyping] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const timer = setInterval(() => setElapsed(e => e + 1), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isAiTyping])

  const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  const sendMessage = useCallback(async () => {
    const text = input.trim()
    if (!text || isAiTyping) return
    setInput('')
    const userMsg: Message = { role: 'user', content: text, timestamp: new Date() }
    setMessages(prev => [...prev, userMsg])
    setIsAiTyping(true)

    try {
      const history = messages.map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.content }))
      history.push({ role: 'user', content: text })
      const res = await fetch('/api/roleplay/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history, condition }),
      })
      const data = await res.json()
      setMessages(prev => [...prev, { role: 'ai', content: data.message ?? '...', timestamp: new Date() }])
    } catch {
      setMessages(prev => [...prev, { role: 'ai', content: '（通信エラーが発生しました）', timestamp: new Date() }])
    } finally {
      setIsAiTyping(false)
    }
  }, [input, isAiTyping, messages, condition])

  return (
    <div className="h-screen flex flex-col">
      <div className="flex items-center justify-between px-6 py-3 bg-white border-b shadow-sm">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{persona?.emoji}</span>
          <div>
            <p className="font-bold text-gray-900 text-sm">{persona?.label}とのチャットロープレ</p>
            <p className="text-xs text-gray-400">
              {condition.industry} · {'★'.repeat(condition.difficulty)} · {condition.warmth === 'cold' ? '🧊コールド' : condition.warmth === 'warm' ? '🌤️ウォーム' : '🔥ホット'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">🕐 {formatTime(elapsed)}</div>
          <button onClick={onEnd}
            className="text-xs bg-red-500 text-white px-4 py-1.5 rounded-lg font-medium hover:bg-red-600 transition">
            終了してフィードバックを見る
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3" style={{ background: '#f8fafc' }}>
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'ai' && (
              <div className="w-8 h-8 rounded-full bg-violet-500 flex items-center justify-center text-white text-sm flex-shrink-0 mr-2 mt-1">
                {persona?.emoji}
              </div>
            )}
            <div
              className={`max-w-sm px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                msg.role === 'user' ? 'text-white rounded-br-sm' : 'bg-white text-gray-800 shadow-sm rounded-bl-sm'
              }`}
              style={msg.role === 'user' ? { background: 'linear-gradient(135deg,#f97316,#ea580c)' } : {}}>
              {msg.content}
            </div>
          </div>
        ))}
        {isAiTyping && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-violet-500 flex items-center justify-center text-white text-sm">{persona?.emoji}</div>
            <div className="bg-white px-4 py-2.5 rounded-2xl shadow-sm flex gap-1">
              {[0, 1, 2].map(i => (
                <div key={i} className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="px-6 py-4 bg-white border-t">
        <div className="flex gap-3">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            placeholder="返答を入力してください..."
            className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-gray-50"
          />
          <button onClick={sendMessage} disabled={!input.trim() || isAiTyping}
            className="px-5 py-2.5 rounded-xl text-white font-semibold text-sm transition disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg,#f97316,#ea580c)' }}>
            送信
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Voice Session ────────────────────────────────────────────────────────────

function VoiceSession({
  condition,
  onEnd,
}: {
  condition: Condition
  onEnd: () => void
}) {
  const persona = PERSONAS.find(p => p.id === condition.persona)
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'ai',
      content: 'こんにちは。お電話ありがとうございます。今お時間よろしいでしょうか？',
      timestamp: new Date(),
    },
  ])
  const [isListening, setIsListening] = useState(false)
  const [isAiSpeaking, setIsAiSpeaking] = useState(false)
  const [isAiTyping, setIsAiTyping] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [elapsed, setElapsed] = useState(0)
  const [error, setError] = useState('')
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const timer = setInterval(() => setElapsed(e => e + 1), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isAiTyping])

  // Speak AI message on mount / new AI message
  useEffect(() => {
    const lastMsg = messages[messages.length - 1]
    if (lastMsg?.role === 'ai') {
      speakText(lastMsg.content)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages])

  const speakText = (text: string) => {
    if (!('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    const utter = new SpeechSynthesisUtterance(text)
    utter.lang = 'ja-JP'
    utter.rate = 1.0
    utter.onstart = () => setIsAiSpeaking(true)
    utter.onend = () => setIsAiSpeaking(false)
    utter.onerror = () => setIsAiSpeaking(false)
    window.speechSynthesis.speak(utter)
  }

  const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setError('このブラウザは音声認識に対応していません。Chrome または Edge をご使用ください。')
      return
    }
    const SR = (window as Window & { webkitSpeechRecognition?: typeof SpeechRecognition }).webkitSpeechRecognition ?? SpeechRecognition
    const recognition = new SR()
    recognition.lang = 'ja-JP'
    recognition.interimResults = true
    recognition.maxAlternatives = 1
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const t = Array.from(event.results).map(r => r[0].transcript).join('')
      setTranscript(t)
    }
    recognition.onend = () => {
      setIsListening(false)
      if (transcript.trim()) sendVoiceMessage(transcript.trim())
      setTranscript('')
    }
    recognition.onerror = () => {
      setIsListening(false)
      setError('音声認識でエラーが発生しました。もう一度お試しください。')
    }
    recognitionRef.current = recognition
    recognition.start()
    setIsListening(true)
    setError('')
  }

  const stopListening = () => {
    recognitionRef.current?.stop()
    setIsListening(false)
  }

  const sendVoiceMessage = async (text: string) => {
    const userMsg: Message = { role: 'user', content: text, timestamp: new Date() }
    setMessages(prev => [...prev, userMsg])
    setIsAiTyping(true)
    window.speechSynthesis.cancel()

    try {
      const history = messages.map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.content }))
      history.push({ role: 'user', content: text })
      const res = await fetch('/api/roleplay/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history, condition }),
      })
      const data = await res.json()
      setMessages(prev => [...prev, { role: 'ai', content: data.message ?? '...', timestamp: new Date() }])
    } catch {
      setMessages(prev => [...prev, { role: 'ai', content: '（通信エラーが発生しました）', timestamp: new Date() }])
    } finally {
      setIsAiTyping(false)
    }
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 bg-white border-b shadow-sm">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{persona?.emoji}</span>
          <div>
            <p className="font-bold text-gray-900 text-sm">{persona?.label}との音声ロープレ</p>
            <p className="text-xs text-gray-400">
              {condition.industry} · {'★'.repeat(condition.difficulty)} · {condition.warmth === 'cold' ? '🧊コールド' : condition.warmth === 'warm' ? '🌤️ウォーム' : '🔥ホット'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">🕐 {formatTime(elapsed)}</div>
          <button onClick={onEnd}
            className="text-xs bg-red-500 text-white px-4 py-1.5 rounded-lg font-medium hover:bg-red-600 transition">
            終了してフィードバックを見る
          </button>
        </div>
      </div>

      {/* Transcript log */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3" style={{ background: '#f8fafc' }}>
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'ai' && (
              <div className="w-8 h-8 rounded-full bg-violet-500 flex items-center justify-center text-white text-sm flex-shrink-0 mr-2 mt-1">
                {persona?.emoji}
              </div>
            )}
            <div
              className={`max-w-sm px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                msg.role === 'user' ? 'text-white rounded-br-sm' : 'bg-white text-gray-800 shadow-sm rounded-bl-sm'
              }`}
              style={msg.role === 'user' ? { background: 'linear-gradient(135deg,#8b5cf6,#6d28d9)' } : {}}>
              {msg.content}
            </div>
          </div>
        ))}
        {isAiTyping && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-violet-500 flex items-center justify-center text-white text-sm">{persona?.emoji}</div>
            <div className="bg-white px-4 py-2.5 rounded-2xl shadow-sm flex gap-1">
              {[0, 1, 2].map(i => (
                <div key={i} className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Voice Control */}
      <div className="bg-white border-t px-6 py-5">
        {error && (
          <p className="text-xs text-red-500 text-center mb-3 bg-red-50 rounded-lg px-4 py-2">{error}</p>
        )}
        {transcript && (
          <p className="text-xs text-gray-500 text-center mb-3 italic">「{transcript}」</p>
        )}

        <div className="flex items-center justify-center gap-6">
          {/* Status indicator */}
          <div className="text-center w-28">
            {isAiSpeaking ? (
              <>
                <div className="flex justify-center gap-1 mb-1">
                  {[0, 1, 2, 3, 4].map(i => (
                    <div key={i} className="w-1 rounded-full bg-violet-500 animate-bounce"
                      style={{ height: `${8 + Math.sin(i) * 8}px`, animationDelay: `${i * 0.1}s` }} />
                  ))}
                </div>
                <p className="text-xs text-violet-500 font-medium">AI話し中...</p>
              </>
            ) : isListening ? (
              <>
                <div className="flex justify-center gap-1 mb-1">
                  {[0, 1, 2, 3, 4].map(i => (
                    <div key={i} className="w-1 rounded-full bg-orange-400 animate-bounce"
                      style={{ height: `${6 + Math.random() * 12}px`, animationDelay: `${i * 0.1}s` }} />
                  ))}
                </div>
                <p className="text-xs text-orange-500 font-medium">聞き取り中...</p>
              </>
            ) : (
              <p className="text-xs text-gray-400">マイクを押して話す</p>
            )}
          </div>

          {/* Mic button */}
          <button
            onMouseDown={startListening}
            onMouseUp={stopListening}
            onTouchStart={startListening}
            onTouchEnd={stopListening}
            disabled={isAiSpeaking || isAiTyping}
            className="w-20 h-20 rounded-full flex items-center justify-center text-4xl shadow-lg transition-all disabled:opacity-40 active:scale-95"
            style={{
              background: isListening
                ? 'linear-gradient(135deg,#ef4444,#dc2626)'
                : 'linear-gradient(135deg,#8b5cf6,#6d28d9)',
              boxShadow: isListening ? '0 0 0 8px rgba(239,68,68,0.2)' : '0 4px 20px rgba(139,92,246,0.4)',
            }}>
            {isListening ? '⏹️' : '🎙️'}
          </button>

          <div className="text-center w-28">
            <p className="text-xs text-gray-400 leading-relaxed">
              {isListening ? 'ボタンを離すと送信' : '押している間だけ録音'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Result ──────────────────────────────────────────────────────────────────

function Result({ onRetry }: { onRetry: () => void }) {
  const scoreLabel = (s: number) => s >= 85 ? '優秀' : s >= 70 ? '良好' : '要改善'
  const scoreColor = (s: number) => s >= 85 ? '#22c55e' : s >= 70 ? '#f97316' : '#ef4444'

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">ロープレ完了！</h1>
      <p className="text-gray-500 text-sm mb-6">AIがあなたのパフォーマンスを分析しました</p>

      <div className="bg-gradient-to-r from-violet-600 to-purple-700 rounded-2xl p-6 text-white mb-5 text-center">
        <p className="text-white/70 text-sm mb-2">総合スコア</p>
        <p className="text-7xl font-black mb-2">{DUMMY_RESULT.overall}</p>
        <p className="text-white/70">点 / 100</p>
        <div className="mt-4 inline-flex items-center gap-2 bg-white/20 rounded-full px-4 py-1.5">
          <span className="text-yellow-300 font-bold">+{DUMMY_RESULT.xpEarned} XP</span>
          <span className="text-white/60 text-sm">獲得！</span>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-sm mb-4">
        <h2 className="font-bold text-gray-900 mb-4">スキル別スコア</h2>
        <div className="space-y-3">
          {Object.entries(DUMMY_RESULT.scores).map(([key, val]) => {
            const labels: Record<string, string> = {
              opening: 'オープニング', hearing: 'ヒアリング',
              proposition: '提案力', objection_handling: '反論処理', closing: 'クロージング',
            }
            return (
              <div key={key}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-gray-700">{labels[key]}</span>
                  <span className="font-bold" style={{ color: scoreColor(val) }}>
                    {val}点 ({scoreLabel(val)})
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${val}%`, background: scoreColor(val) }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-5">
        <div className="bg-green-50 rounded-2xl p-4">
          <h3 className="font-bold text-green-800 text-sm mb-2">✨ 良かった点</h3>
          <ul className="space-y-1.5">
            {DUMMY_RESULT.strengths.map((s, i) => (
              <li key={i} className="text-xs text-green-700 leading-relaxed">・{s}</li>
            ))}
          </ul>
        </div>
        <div className="bg-orange-50 rounded-2xl p-4">
          <h3 className="font-bold text-orange-800 text-sm mb-2">🎯 改善ポイント</h3>
          <ul className="space-y-1.5">
            {DUMMY_RESULT.improvements.map((s, i) => (
              <li key={i} className="text-xs text-orange-700 leading-relaxed">・{s}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={onRetry}
          className="flex-1 border border-gray-200 text-gray-700 py-3 rounded-xl font-semibold text-sm hover:bg-gray-50 transition">
          もう一度ロープレ
        </button>
        <Link href="/quiz?category=hearing"
          className="flex-1 text-center text-white py-3 rounded-xl font-semibold text-sm transition"
          style={{ background: 'linear-gradient(135deg,#f97316,#ea580c)' }}>
          弱点の問題を解く
        </Link>
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function RoleplayPage() {
  const [mode, setMode] = useState<Mode>('chat')
  const [step, setStep] = useState<Step>('mode')
  const [condition, setCondition] = useState<Condition>({
    persona: '',
    difficulty: 3,
    industry: 'IT・SaaS',
    warmth: 'cold',
    scenario: '',
  })

  const handleModeSelect = (m: Mode) => {
    setMode(m)
    setStep('select')
  }

  const handleStart = () => setStep('session')
  const handleEnd = () => setStep('result')
  const handleRetry = () => {
    setCondition({ persona: '', difficulty: 3, industry: 'IT・SaaS', warmth: 'cold', scenario: '' })
    setStep('mode')
  }

  if (step === 'mode') return <ModeSelect onSelect={handleModeSelect} />
  if (step === 'select') {
    return (
      <ConditionSelect
        mode={mode}
        condition={condition}
        setCondition={setCondition}
        onStart={handleStart}
        onBack={() => setStep('mode')}
      />
    )
  }
  if (step === 'session') {
    return mode === 'voice'
      ? <VoiceSession condition={condition} onEnd={handleEnd} />
      : <ChatSession condition={condition} onEnd={handleEnd} />
  }
  return <Result onRetry={handleRetry} />
}
