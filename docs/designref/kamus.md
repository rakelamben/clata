import { useEffect, useRef, useState } from "react"
import {
  RiArrowLeftLine,
  RiArrowDownSLine,
  RiBookOpenLine,
  RiCheckLine,
  RiCloseLine,
  RiInformationLine,
  RiSearchLine,
  RiVolumeMuteLine,
  RiVolumeUpLine,
} from "@remixicon/react"
import { readInstalledPackage, type Word } from "./local-package"
import {
  DICTIONARY_FILTERS,
  filterDictionary,
  type DictionaryFilter,
} from "./dictionary-data"

type AudioState = "loading" | "playing" | "stopped" | "unavailable"

function DictionarySkeleton() {
  return (
    <div
      className="dictionary-word-card dictionary-skeleton"
      aria-hidden="true"
    >
      <div className="dictionary-skeleton-top">
        <div className="skeleton dictionary-skeleton-lemma" />
        <div className="skeleton dictionary-skeleton-audio" />
      </div>
      <div className="skeleton dictionary-skeleton-pronunciation" />
      <div className="skeleton dictionary-skeleton-meaning" />
      <div className="skeleton dictionary-skeleton-register" />
    </div>
  )
}

export default function Dictionary({ onClose }: { onClose: () => void }) {
  const [words, setWords] = useState<Word[]>([])
  const [loading, setLoading] = useState(true)
  const [loadFailed, setLoadFailed] = useState(false)
  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState<DictionaryFilter>("Semua")
  const [closing, setClosing] = useState(false)
  const [activeWord, setActiveWord] = useState<string | null>(null)
  const [audioState, setAudioState] = useState<AudioState>("stopped")
  const headingRef = useRef<HTMLHeadingElement>(null)
  const drawerRef = useRef<HTMLElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const closeTimer = useRef<number | undefined>(undefined)
  const audioGeneration = useRef(0)
  const visibleWords = filterDictionary(words, query, filter)

  useEffect(() => {
    headingRef.current?.focus()
    let active = true
    const minimumLoading = new Promise<void>((resolve) =>
      window.setTimeout(resolve, 400),
    )
    void Promise.all([readInstalledPackage(), minimumLoading])
      .then(([installed]) => {
        if (active) {
          setWords(installed?.words ?? [])
          setLoading(false)
        }
      })
      .catch(() => {
        if (active) {
          setLoadFailed(true)
          setLoading(false)
        }
      })
    return () => {
      active = false
      window.clearTimeout(closeTimer.current)
      audioGeneration.current++
      window.speechSynthesis?.cancel()
    }
  }, [])

  useEffect(() => {
    function onVisibilityChange() {
      if (document.hidden) stopAudio()
    }
    document.addEventListener("visibilitychange", onVisibilityChange)
    return () =>
      document.removeEventListener("visibilitychange", onVisibilityChange)
  }, [])

  function stopAudio() {
    audioGeneration.current++
    window.speechSynthesis?.cancel()
    setAudioState("stopped")
  }

  function close() {
    if (closing) return
    stopAudio()
    setClosing(true)
    closeTimer.current = window.setTimeout(
      onClose,
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 200,
    )
  }

  function playAudio(word: Word) {
    if (
      activeWord === word.lemma &&
      (audioState === "playing" || audioState === "loading")
    ) {
      stopAudio()
      return
    }
    stopAudio()
    setActiveWord(word.lemma)
    if (!("speechSynthesis" in window)) {
      setAudioState("unavailable")
      return
    }
    const generation = audioGeneration.current
    const utterance = new SpeechSynthesisUtterance(word.lemma)
    utterance.lang = "id-ID"
    utterance.rate = 0.82
    setAudioState("loading")
    utterance.onstart = () => {
      if (generation === audioGeneration.current) setAudioState("playing")
    }
    utterance.onend = () => {
      if (generation === audioGeneration.current) setAudioState("stopped")
    }
    utterance.onerror = () => {
      if (generation === audioGeneration.current) setAudioState("unavailable")
    }
    try {
      window.speechSynthesis.speak(utterance)
    } catch {
      setAudioState("unavailable")
    }
  }

  function resetListPosition() {
    stopAudio()
    listRef.current?.scrollTo({ top: 0, behavior: "auto" })
  }

  return (
    <section
      ref={drawerRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="dictionary-heading"
      className={`app-shell dictionary-drawer ${closing ? "is-closing" : ""}`}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault()
          close()
        }
        if (event.key === "Tab") {
          const controls = drawerRef.current?.querySelectorAll<HTMLElement>(
            'button, input, summary, [tabindex="0"]',
          )
          if (!controls?.length) return
          const first = controls[0]
          const last = controls[controls.length - 1]
          if (
            event.shiftKey &&
            (document.activeElement === first ||
              document.activeElement === headingRef.current)
          ) {
            event.preventDefault()
            last.focus()
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault()
            first.focus()
          }
        }
      }}
    >
      <header className="dictionary-header">
        <button
          type="button"
          className="icon-button dictionary-back"
          aria-label="Kembali ke Kata"
          onClick={close}
        >
          <RiArrowLeftLine aria-hidden="true" />
        </button>
        <h1 ref={headingRef} id="dictionary-heading" tabIndex={-1}>
          Kamus
        </h1>
      </header>
      <div className="dictionary-controls">
        <div className="dictionary-search">
          <RiSearchLine aria-hidden="true" />
          <input
            ref={searchRef}
            type="search"
            aria-label="Cari kata atau arti"
            placeholder="Cari kata atau arti…"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              resetListPosition()
            }}
          />
          {query && (
            <button
              type="button"
              className="icon-button dictionary-clear"
              aria-label="Hapus pencarian"
              onClick={() => {
                setQuery("")
                resetListPosition()
                searchRef.current?.focus()
              }}
            >
              <RiCloseLine aria-hidden="true" />
            </button>
          )}
        </div>
        <div
          className="dictionary-filters"
          role="group"
          aria-label="Filter kata"
        >
          {DICTIONARY_FILTERS.map((item) => (
            <button
              type="button"
              className={`dictionary-filter ${
                filter === item ? "is-selected" : ""
              }`}
              key={item}
              aria-pressed={filter === item}
              onClick={() => {
                setFilter(item)
                resetListPosition()
              }}
            >
              {filter === item && <RiCheckLine aria-hidden="true" />}
              {item}
            </button>
          ))}
        </div>
      </div>
      <div
        className="dictionary-list"
        ref={listRef}
        role="region"
        aria-label="Daftar kata kamus, dapat digulir"
        tabIndex={0}
      >
        {loading ? (
          <>
            <p className="sr-only" role="status">
              Memuat kamus.
            </p>
            <div aria-busy="true" aria-label="Memuat daftar kata">
              <DictionarySkeleton />
              <DictionarySkeleton />
              <DictionarySkeleton />
            </div>
          </>
        ) : loadFailed ? (
          <div className="dictionary-empty-state" role="status">
            <RiBookOpenLine aria-hidden="true" />
            <h2>Kamus belum dapat dibuka.</h2>
            <p>
              Materi lokal belum siap. Silakan buka kembali Kamus sebentar lagi.
            </p>
          </div>
        ) : visibleWords.length === 0 ? (
          <div className="dictionary-empty-state" role="status">
            <RiSearchLine aria-hidden="true" />
            <h2>
              {words.length
                ? "Kata belum ditemukan."
                : "Belum ada kata di kamus."}
            </h2>
            <p>
              {words.length
                ? "Coba kata lain atau pilih filter yang berbeda."
                : "Materi kamus akan muncul setelah paket belajar terpasang."}
            </p>
          </div>
        ) : (
          <>
            {visibleWords.map((word) => {
              const state = activeWord === word.lemma ? audioState : "stopped"
              return (
                <article
                  className="dictionary-word-card"
                  key={word.lemma}
                  aria-labelledby={`dictionary-word-${word.lemma}`}
                >
                  <div className="dictionary-word-top">
                    <div>
                      <h2 id={`dictionary-word-${word.lemma}`}>{word.lemma}</h2>
                      <p className="dictionary-pronunciation">
                        {word.pronunciation}
                      </p>
                    </div>
                    <button
                      type="button"
                      className={`icon-button dictionary-audio ${
                        state === "playing" ? "is-playing" : ""
                      }`}
                      aria-label={`Audio kata ${word.lemma}. ${
                        state === "playing"
                          ? "Sedang diputar"
                          : state === "loading"
                            ? "Sedang dimuat"
                            : state === "unavailable"
                              ? "Tidak tersedia"
                              : "Berhenti"
                      }`}
                      aria-pressed={state === "playing"}
                      onClick={() => playAudio(word)}
                    >
                      {state === "unavailable" ? (
                        <RiVolumeMuteLine aria-hidden="true" />
                      ) : (
                        <RiVolumeUpLine
                          className={state === "loading" ? "is-loading" : ""}
                          aria-hidden="true"
                        />
                      )}
                    </button>
                  </div>
                  <div className="dictionary-definition">
                    <p className="dictionary-word-class">{word.wordClass}</p>
                    <p className="dictionary-meaning">{word.meaning}</p>
                  </div>
                  <details className="dictionary-register">
                    <summary>
                      <span>
                        <RiInformationLine aria-hidden="true" />
                        <span className="sr-only">Tingkat tutur: </span>
                        <span className="dictionary-register-label">
                          {word.register}
                        </span>
                      </span>
                      <RiArrowDownSLine
                        className="dictionary-register-affordance"
                        aria-hidden="true"
                      />
                    </summary>
                    <p>{word.registerNote}</p>
                  </details>
                  {state === "unavailable" && (
                    <p className="dictionary-audio-note" role="status">
                      Audio belum tersedia. Ejaan tetap dapat dibaca.
                    </p>
                  )}
                </article>
              )
            })}
          </>
        )}
      </div>
    </section>
  )
}
