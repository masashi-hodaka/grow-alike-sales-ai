'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'

type Message = {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

type Topic = {
  id: string
  label: string
  emoji: string
  desc: string
  starter: string
}

const TOPICS: Topic[] = [
  {
    id: 'strategy',
    label: '商談前の作戦立て',
    emoji: '🗺️',
    desc: '次の商談に向けてシナリオや質問を一緒に考える',
    starter: '次の商談について作戦を立てたいです。相手は',
  },
  {
    id: 'objection',
    label: '反論対処の練習',
    emoji: '🛡️',
    desc: 'よくある反論への返し方を一緒に考えてもらう',
    starter: 'よく「予算がない」と言われて詰まってしまいます。どう返せばいいですか？',
  },
  {
    id: 'review',
    label: '商談の振り返り',
    emoji: '🔍',
    desc: '終わった商談を振り返ってネクストアクションを整理',
    starter: '今日の商談を振り返りたいです。うまくいかなかった部分があって、',
  },
  {
    id: 'script',
    label: 'トーク改善',
    emoji: '✍️',
    desc: '自分のトークスクリプトをAIに添削してもらう',
    starter: '自分のオープニングトークを見てほしいです：「',
  },
  {
    id: 'competitive',
    label: '競合との差別化',
    emoji: '⚔️',
    desc: '競合と比較されたときの対応を一緒に整理する',
    starter: '競合と比較されることが多いのですが、差別化ポイントの伝え方を相談したいです。',
  },
  {
    id: 'free',
    label: '自由に相談',
    emoji: '💬',
    desc: '営業に関することなら何でもOK',
    starter: '',
  },
]

const WELCOME_MESSAGE: Message = {
  role: 'assistant',
  content: `こんにちは！Sales Coach AIです 👋

商談の壁打ち・戦略立案・トーク練習など、営業に関することなら何でも一緒に考えます。

まず、今日はどんなことを相談したいですか？テーマを選んでもらうか、自由に話しかけてください。`,
  timestamp: new Date(),
}

export default function BrainstormPage() {
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null)
  const [showTopics, setShowTopics] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  const sendMessage = useCallback(async (text?: string) => {
    const content = (text ?? input).trim()
    if (!content || isLoading) return
    setInput('')
    setShowTopics(false)

    const userMsg: Message = { role: 'user', content, timestamp: new Date() }
    setMessages(prev => [...prev, userMsg])
    setIsLoading(true)

    try {
      const history = [...messages, userMsg].map(m => ({
        role: m.role,
        content: m.content,
      }))
      const res = await fetch('/api/brainstorm/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: history,
          context: selectedTopic ? { topic: TOPICS.find(t => t.id === selectedTopic)?.label } : undefined,
        }),
      })
      const data = await res.json()
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.message ?? '申し訳ありません、エラーが発生しました。',
        timestamp: new Date(),
      }])
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '通信エラーが発生しました。もう一度お試しください。',
        timestamp: new Date(),
      }])
    } finally {
      setIsLoading(false)
    }
  }, [input, isLoading, messages, selectedTopic])

  const handleTopicSelect = (topic: Topic) => {
    setSelectedTopic(topic.id)
    setShowTopics(false)
    if (topic.starter) {
      setInput(topic.starter)
      setTimeout(() => textareaRef.current?.focus(), 100)
    } else {
      const msg: Message = {
        role: 'assistant',
        content: 'もちろんです！何でも気軽に話しかけてください。どんな営業の悩みでも一緒に考えます。',
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, msg])
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const formatContent = (text: string) => {
    // Simple markdown-like rendering
    return text.split('\n').map((line, i) => {
      if (line.startsWith('- ') || line.startsWith('・')) {
        return <li key={i} className="ml-3 list-disc">{line.replace(/^[-・]\s*/, '')}</li>
      }
      if (line.match(/^\d+\./)) {
        return <li key={i} className="ml-3 list-decimal">{line.replace(/^\d+\.\s*/, '')}</li>
      }
      if (line === '') return <br key={i} />
      return <p key={i}>{line}</p>
    })
  }

  return (
    <div className="h-screen flex flex-col max-w-3xl">
      {/* Header */}
      <div className="px-6 py-4 bg-white border-b shadow-sm flex-shrink-0">
        <div className="flex items-center gap-2 text-gray-500 text-xs mb-2">
          <Link href="/dashboard" className="hover:text-gray-700">ホーム</Link>
          <span>/</span>
          <span className="text-gray-800 font-medium">商談壁打ちチャット</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xl"
              style={{ background: 'linear-gradient(135deg,#0ea5e9,#0284c7)' }}>
              🤝
            </div>
            <div>
              <h1 className="text-base font-bold text-gray-900">商談壁打ちチャット</h1>
              <p className="text-xs text-gray-500">Sales Coach AI が営業をサポートします</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {selectedTopic && (
              <span className="text-xs px-2.5 py-1 rounded-full font-medium text-white"
                style={{ background: 'linear-gradient(135deg,#0ea5e9,#0284c7)' }}>
                {TOPICS.find(t => t.id === selectedTopic)?.emoji} {TOPICS.find(t => t.id === selectedTopic)?.label}
              </span>
            )}
            <button
              onClick={() => {
                setMessages([WELCOME_MESSAGE])
                setSelectedTopic(null)
                setShowTopics(true)
                setInput('')
              }}
              className="text-xs text-gray-400 hover:text-gray-600 border border-gray-200 px-3 py-1 rounded-full transition">
              リセット
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4" style={{ background: '#f8fafc' }}>
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm flex-shrink-0 mr-2 mt-1 font-bold"
                style={{ background: 'linear-gradient(135deg,#0ea5e9,#0284c7)' }}>
                AI
              </div>
            )}
            <div
              className={`max-w-lg px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'text-white rounded-br-sm'
                  : 'bg-white text-gray-800 shadow-sm rounded-bl-sm'
              }`}
              style={msg.role === 'user' ? { background: 'linear-gradient(135deg,#f97316,#ea580c)' } : {}}>
              <div className="space-y-1">
                {formatContent(msg.content)}
              </div>
            </div>
          </div>
        ))}

        {/* Topic selection */}
        {showTopics && (
          <div className="ml-10">
            <p className="text-xs text-gray-500 mb-2 font-medium">テーマを選ぶ</p>
            <div className="grid grid-cols-2 gap-2">
              {TOPICS.map(topic => (
                <button key={topic.id} onClick={() => handleTopicSelect(topic)}
                  className="bg-white border border-gray-200 rounded-xl p-3 text-left hover:border-sky-300 hover:bg-sky-50 transition text-sm">
                  <span className="text-base mr-1.5">{topic.emoji}</span>
                  <span className="font-medium text-gray-800">{topic.label}</span>
                  <p className="text-xs text-gray-400 mt-1 leading-relaxed">{topic.desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* AI typing indicator */}
        {isLoading && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
              style={{ background: 'linear-gradient(135deg,#0ea5e9,#0284c7)' }}>
              AI
            </div>
            <div className="bg-white px-4 py-2.5 rounded-2xl shadow-sm flex gap-1">
              {[0, 1, 2].map(i => (
                <div key={i} className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Suggested questions (only when showTopics is false and few messages) */}
      {!showTopics && messages.length <= 3 && !isLoading && (
        <div className="px-6 py-2 bg-white border-t flex gap-2 overflow-x-auto flex-shrink-0">
          {[
            'オープニングトークを教えて',
            'BANT確認の質問例は？',
            '価格交渉のコツは？',
          ].map(q => (
            <button key={q} onClick={() => sendMessage(q)}
              className="flex-shrink-0 text-xs border border-sky-200 text-sky-600 px-3 py-1.5 rounded-full hover:bg-sky-50 transition whitespace-nowrap">
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="px-6 py-4 bg-white border-t flex-shrink-0">
        <div className="flex gap-3 items-end">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="営業の相談を入力してください... (Shift+Enterで改行)"
            className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 bg-gray-50 resize-none"
            rows={2}
          />
          <button onClick={() => sendMessage()} disabled={!input.trim() || isLoading}
            className="px-5 py-2.5 rounded-xl text-white font-semibold text-sm transition disabled:opacity-50 flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,#0ea5e9,#0284c7)' }}>
            送信
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-1.5 text-center">
          Enterで送信 · Shift+Enterで改行 · 会話はリセットで最初から
        </p>
      </div>
    </div>
  )
}
