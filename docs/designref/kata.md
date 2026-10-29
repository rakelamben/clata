import {
  RiArrowLeftLine,
  RiBookOpenLine,
  RiBookReadFill,
  RiBookReadLine,
  RiInformationLine,
  RiMedalLine,
  RiRefreshLine,
  RiSparklingLine,
  RiUser3Line,
  RiVolumeMuteLine,
  RiVolumeUpFill,
  RiVolumeUpLine,
} from "@remixicon/react"
import { useEffect, useRef, useState, type Ref } from "react"
import Onboarding from "./Onboarding"
import Practice from "./Practice"
import { clearLocalData, type Word } from "./local-package"

type AudioState = "loading" | "playing" | "stopped" | "unavailable"

const TABS = [
  { label: "Kata", icon: RiBookReadLine, activeIcon: RiBookReadFill },
  { label: "Latihan", icon: RiSparklingLine, activeIcon: RiSparklingLine },
  { label: "Tantangan", icon: RiMedalLine, activeIcon: RiMedalLine },
  { label: "Profil", icon: RiUser3Line, activeIcon: RiUser3Line },
]

function IconButton({
  label,
  className = "",
  children,
  onClick,
  pressed,
  buttonRef,
}: {
  label: string
  className?: string
  children: React.ReactNode
  onClick: () => void
  pressed?: boolean
  buttonRef?: Ref<HTMLButtonElement>
}) {
  return (
    <button
      ref={buttonRef}
      type="button"
      className={`icon-button ${className}`}
      aria-label={label}
      aria-pressed={pressed}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

function WordSkeleton() {
  return (
    <div className="word-card skeleton-card" aria-hidden="true">
      <div className="skeleton skeleton-kicker" />
      <div className="skeleton skeleton-word" />
      <div className="skeleton skeleton-meaning" />
      <div className="skeleton skeleton-meta" />
    </div>
  )
}

function KataFeed({
  words: WORDS,
  onReset,
}: {
  words: Word[]
  onReset: () => void
}) {
  const [screen, setScreen] = useState<"feed" | "dictionary" | "profile">(
    "feed",
  )
  const [resetConfirm, setResetConfirm] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [resetError, setResetError] = useState("")
  const [status, setStatus] = useState<"loading" | "content" | "error">(
    "loading",
  )
  const [visibleCount, setVisibleCount] = useState(4)
  const [loadingNext, setLoadingNext] = useState(false)
  const [tooltipIndex, setTooltipIndex] = useState<number | null>(null)
  const [audioIndex, setAudioIndex] = useState<number | null>(null)
  const [audioState, setAudioState] = useState<AudioState>("stopped")
  const [activeTab, setActiveTab] = useState("Kata")
  const [practiceSessionActive, setPracticeSessionActive] = useState(false)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const feedRef = useRef<HTMLDivElement>(null)
  const savedScrollPosition = useRef(0)
  const tooltipTriggerRef = useRef<HTMLButtonElement | null>(null)
  const viewedTimers = useRef(new Map<number, number>())
  const loadingLock = useRef(false)

  useEffect(() => {
    const timer = window.setTimeout(() => setStatus("content"), 650)
    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (status === "content" && screen === "feed" && activeTab === "Kata") {
      window.setTimeout(() => {
        feedRef.current?.scrollTo({
          top: savedScrollPosition.current,
          behavior: "auto",
        })
        headingRef.current?.focus()
      }, 40)
    }
  }, [screen, status, activeTab])

  useEffect(() => {
    return () => window.speechSynthesis?.cancel()
  }, [])

  useEffect(() => {
    if (status !== "content" || activeTab !== "Kata") return
    const cards =
      feedRef.current?.querySelectorAll<HTMLElement>("[data-feed-index]")
    if (!cards) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const item = entry.target as HTMLElement
          const feedIndex = Number(item.dataset.feedIndex)
          const wordIndex = Number(item.dataset.wordIndex)
          if (entry.isIntersecting && entry.intersectionRatio >= 0.65) {
            if (!viewedTimers.current.has(feedIndex)) {
              const timer = window.setTimeout(() => {
                if (document.visibilityState === "visible") {
                  const seen = new Set(
                    JSON.parse(
                      localStorage.getItem("clata-seen-words") ?? "[]",
                    ),
                  )
                  seen.add(wordIndex)
                  localStorage.setItem(
                    "clata-seen-words",
                    JSON.stringify([...seen]),
                  )
                }
              }, 1000)
              viewedTimers.current.set(feedIndex, timer)
            }
          } else {
            const timer = viewedTimers.current.get(feedIndex)
            if (timer) window.clearTimeout(timer)
            viewedTimers.current.delete(feedIndex)
          }
        })
      },
      { root: feedRef.current, threshold: 0.65 },
    )

    cards.forEach((card) => observer.observe(card))
    return () => {
      observer.disconnect()
      viewedTimers.current.forEach((timer) => window.clearTimeout(timer))
      viewedTimers.current.clear()
    }
  }, [status, visibleCount, activeTab, screen])

  const loadNextBatch = () => {
    if (loadingLock.current || status !== "content") return
    loadingLock.current = true
    setLoadingNext(true)

    window.setTimeout(() => {
      setVisibleCount((count) => count + 2)
      setLoadingNext(false)
      loadingLock.current = false
    }, 550)
  }

  const handleFeedScroll = () => {
    const feed = feedRef.current
    if (!feed) return
    if (feed.scrollHeight - feed.scrollTop - feed.clientHeight < 180)
      loadNextBatch()
  }

  const toggleAudio = (word: Word, index: number) => {
    if (!("speechSynthesis" in window)) {
      setAudioIndex(index)
      setAudioState("unavailable")
      return
    }

    if (audioIndex === index && audioState === "playing") {
      window.speechSynthesis.cancel()
      setAudioState("stopped")
      return
    }

    window.speechSynthesis.cancel()
    setAudioIndex(index)
    setAudioState("loading")
    const utterance = new SpeechSynthesisUtterance(word.lemma)
    utterance.lang = "id-ID"
    utterance.rate = 0.82
    utterance.onstart = () => setAudioState("playing")
    utterance.onend = () => setAudioState("stopped")
    utterance.onerror = () => setAudioState("unavailable")
    window.speechSynthesis.speak(utterance)
  }

  const closeTooltip = () => {
    setTooltipIndex(null)
    window.setTimeout(() => {
      tooltipTriggerRef.current?.focus()
    }, 20)
  }

  useEffect(() => {
    if (tooltipIndex === null) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeTooltip()
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [tooltipIndex])

  if (screen === "dictionary") {
    return (
      <main className="app-shell dictionary-screen">
        <header className="topbar">
          <IconButton label="Kembali ke Kata" onClick={() => setScreen("feed")}>
            <RiArrowLeftLine aria-hidden="true" />
          </IconButton>
          <p className="topbar-title">Kamus</p>
          <span className="topbar-spacer" aria-hidden="true" />
        </header>
        <section
          className="dictionary-empty"
          aria-labelledby="dictionary-title"
        >
          <div className="dictionary-mark">
            <RiBookOpenLine aria-hidden="true" />
          </div>
          <p className="eyebrow">Kamus Clata</p>
          <h1 id="dictionary-title">
            Semua kata,
            <br />
            satu tempat.
          </h1>
          <p>
            Kamus lengkap akan tersedia di sini. Kembali ke feed untuk
            melanjutkan belajar.
          </p>
          <button
            type="button"
            className="primary-button"
            onClick={() => setScreen("feed")}
          >
            <RiArrowLeftLine aria-hidden="true" />
            Kembali ke Kata
          </button>
        </section>
      </main>
    )
  }

  if (screen === "profile") {
    return (
      <main className="app-shell dictionary-screen">
        <header className="topbar">
          <IconButton
            label="Kembali ke Kata"
            onClick={() => {
              setActiveTab("Kata")
              setScreen("feed")
            }}
          >
            <RiArrowLeftLine aria-hidden="true" />
          </IconButton>
          <p className="topbar-title">Profil lokal</p>
          <span className="topbar-spacer" aria-hidden="true" />
        </header>
        <section className="dictionary-empty" aria-labelledby="profile-title">
          <div className="dictionary-mark">
            <RiUser3Line aria-hidden="true" />
          </div>
          <h1 id="profile-title">Ruang belajarmu.</h1>
          <p>
            Profil dan paket belajar tersimpan di perangkat ini. Kamu bisa
            belajar tanpa akun.
          </p>
          {resetConfirm ? (
            <div className="reset-confirmation">
              <h2>Hapus semua data?</h2>
              <p>
                Profil lokal, paket belajar, dan riwayat kata akan dihapus.
                Tindakan ini tidak bisa dibatalkan.
              </p>
              <button
                className="primary-button"
                disabled={resetting}
                onClick={async () => {
                  setResetting(true)
                  setResetError("")
                  try {
                    await clearLocalData()
                    onReset()
                  } catch {
                    setResetError("Data belum dapat dihapus. Coba lagi.")
                    setResetting(false)
                  }
                }}
              >
                {resetting ? "Menghapus…" : "Ya, hapus semua data"}
              </button>
              <button
                className="onboarding-skip"
                disabled={resetting}
                onClick={() => setResetConfirm(false)}
              >
                Batal
              </button>
              {resetError && (
                <p role="alert" className="age-error">
                  {resetError}
                </p>
              )}
            </div>
          ) : (
            <button
              className="primary-button"
              onClick={() => setResetConfirm(true)}
            >
              Hapus semua data
            </button>
          )}
        </section>
      </main>
    )
  }

  return (
    <main
      className={`app-shell ${
        practiceSessionActive ? "has-practice-session" : ""
      }`}
    >
      {activeTab === "Latihan" ? (
        <Practice onSessionActive={setPracticeSessionActive} />
      ) : (
        <>
          <h1 ref={headingRef} className="sr-only" tabIndex={-1}>
            Kata
          </h1>
          <div className="package-context">
            <span className="package-pill">Jawa - Mataraman</span>
          </div>
          <button
            type="button"
            className="dictionary-button floating-dictionary-button"
            onClick={() => {
              savedScrollPosition.current = feedRef.current?.scrollTop ?? 0
              setScreen("dictionary")
            }}
          >
            <RiBookOpenLine aria-hidden="true" />
            <span>Buka Kamus</span>
          </button>

          {status === "loading" ? (
            <section
              className="feed-region loading-region"
              aria-busy="true"
              aria-label="Memuat daftar kata"
            >
              <p className="sr-only" role="status">
                Memuat daftar kata.
              </p>
              <WordSkeleton />
              <WordSkeleton />
              <WordSkeleton />
            </section>
          ) : status === "error" ? (
            <section className="state-panel" aria-labelledby="feed-error-title">
              <div className="state-icon error-icon">
                <RiRefreshLine aria-hidden="true" />
              </div>
              <h2 id="feed-error-title" tabIndex={-1}>
                Daftar kata belum siap.
              </h2>
              <p>Terjadi kendala saat membuka koleksi di perangkat ini.</p>
              <button
                type="button"
                className="primary-button"
                onClick={() => setStatus("loading")}
              >
                <RiRefreshLine aria-hidden="true" />
                Coba lagi
              </button>
            </section>
          ) : (
            <div
              className="feed-region"
              ref={feedRef}
              onScroll={handleFeedScroll}
              role="region"
              aria-label="Feed kata, dapat digulir"
              tabIndex={0}
            >
              {Array.from({ length: visibleCount }, (_, index) => {
                const wordIndex = index % WORDS.length
                const word = WORDS[wordIndex]
                const isCurrentAudio = audioIndex === index
                const isPlaying = isCurrentAudio && audioState === "playing"
                const isLoadingAudio =
                  isCurrentAudio && audioState === "loading"
                const isUnavailable =
                  isCurrentAudio && audioState === "unavailable"

                return (
                  <article
                    className="word-card"
                    key={`${word.lemma}-${index}`}
                    data-feed-index={index}
                    data-word-index={wordIndex}
                    aria-label={`Kata, ${word.lemma}. ${word.meaning}.`}
                  >
                    <div className="word-content">
                      <div className="word-title-row">
                        <h2>{word.lemma}</h2>
                      </div>
                      <div className="pronunciation-row">
                        <span>{word.pronunciation}</span>
                        <IconButton
                          label={`Audio kata ${word.lemma}. ${
                            isPlaying
                              ? "Sedang diputar"
                              : isUnavailable
                                ? "Tidak tersedia"
                                : "Berhenti"
                          }`}
                          className={
                            isPlaying
                              ? "audio-button is-playing"
                              : "audio-button"
                          }
                          pressed={isPlaying}
                          onClick={() => toggleAudio(word, index)}
                        >
                          {isUnavailable ? (
                            <RiVolumeMuteLine aria-hidden="true" />
                          ) : isPlaying ? (
                            <RiVolumeUpFill aria-hidden="true" />
                          ) : (
                            <RiVolumeUpLine
                              className={isLoadingAudio ? "is-loading" : ""}
                              aria-hidden="true"
                            />
                          )}
                        </IconButton>
                      </div>
                      <p className="meaning">
                        <span>{word.wordClass}</span>
                        {word.meaning}
                      </p>
                      <div className="word-meta">
                        <IconButton
                          label={`Tingkat tutur kata: ${word.register}`}
                          className="info-button"
                          buttonRef={(element) => {
                            if (element) tooltipTriggerRef.current = element
                          }}
                          onClick={() => setTooltipIndex(wordIndex)}
                        >
                          <RiInformationLine aria-hidden="true" />
                        </IconButton>
                      </div>
                      {isUnavailable && (
                        <p className="audio-note" role="status">
                          Audio belum tersedia.
                        </p>
                      )}
                    </div>
                  </article>
                )
              })}

              {loadingNext && (
                <div
                  className="next-batch"
                  aria-live="polite"
                  aria-label="Memuat kata berikutnya"
                >
                  <WordSkeleton />
                </div>
              )}
              <div className="feed-end-mark" aria-hidden="true">
                <span />
              </div>
            </div>
          )}

          {tooltipIndex !== null && (
            <div
              className="tooltip-scrim"
              role="presentation"
              onMouseDown={closeTooltip}
            >
              <div
                className="tooltip-card"
                role="dialog"
                aria-modal="true"
                aria-labelledby="tooltip-title"
                onMouseDown={(event) => event.stopPropagation()}
              >
                <div className="tooltip-handle" aria-hidden="true" />
                <p className="eyebrow">Tingkat tutur</p>
                <h2 id="tooltip-title">{WORDS[tooltipIndex].register}</h2>
                <p>{WORDS[tooltipIndex].registerNote}</p>
                <button
                  type="button"
                  className="primary-button"
                  autoFocus
                  onClick={closeTooltip}
                >
                  Mengerti
                </button>
              </div>
            </div>
          )}
        </>
      )}
      {!practiceSessionActive && (
        <nav className="bottom-nav" aria-label="Navigasi utama">
          <div role="tablist" aria-label="Bagian aplikasi">
            {TABS.map((tab) => {
              const selected = activeTab === tab.label
              const TabIcon = selected ? tab.activeIcon : tab.icon
              return (
                <button
                  key={tab.label}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  className={selected ? "nav-tab is-selected" : "nav-tab"}
                  onClick={() => {
                    if (activeTab === "Kata") {
                      savedScrollPosition.current =
                        feedRef.current?.scrollTop ?? 0
                    }
                    window.speechSynthesis?.cancel()
                    setActiveTab(tab.label)
                    if (tab.label === "Profil") {
                      savedScrollPosition.current =
                        feedRef.current?.scrollTop ?? 0
                      setScreen("profile")
                      return
                    }
                    if (tab.label === "Tantangan")
                      window.setTimeout(() => setActiveTab("Kata"), 500)
                  }}
                >
                  <span className="nav-icon">
                    <TabIcon aria-hidden="true" />
                  </span>
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>
        </nav>
      )}
    </main>
  )
}

export default function App() {
  const [words, setWords] = useState<Word[] | null>(null)
  return words ? (
    <KataFeed words={words} onReset={() => setWords(null)} />
  ) : (
    <Onboarding onComplete={setWords} />
  )
}
