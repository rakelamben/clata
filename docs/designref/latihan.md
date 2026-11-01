// @refresh reset
import { useEffect, useRef, useState } from "react"
import ConversationTopics from "./ConversationTopics"
import {
  RiArrowLeftLine,
  RiArrowRightLine,
  RiBookOpenLine,
  RiChat3Line,
  RiCheckboxCircleLine,
  RiCheckDoubleLine,
  RiCheckLine,
  RiCloseCircleLine,
  RiCloseLine,
  RiErrorWarningLine,
  RiFileList3Line,
  RiHistoryLine,
  RiInformationLine,
  RiPuzzleLine,
  RiRefreshLine,
  RiSendPlane2Line,
  RiTranslate2,
  RiTimeLine,
  RiVolumeUpLine,
  RiVolumeMuteLine,
} from "@remixicon/react"
import {
  DIALOGUES,
  MODES,
  SESSION_KEY,
  questionBank,
  recordAnswer,
  sessionQuestions,
  validBank,
  validSession,
  type Mode,
  type Session,
} from "./practice-data"
import {
  installPackage,
  readInstalledPackage,
  readLocalProfile,
} from "./local-package"

type View = "home" | "setup" | "loading" | "question" | "summary"
type AudioState = "loading" | "playing" | "stopped" | "unavailable"
type ConversationPhase = "idle" | "partner-typing" | "awaiting-response" | "user-typing" | "user-sent"

const DIALOG_AVATARS: Record<string, string> = {
  visit:
    "https://images.unsplash.com/photo-1516011362164-3095a82b0af9?crop=faces&fit=crop&h=160&w=160&q=80",
  learn:
    "https://images.unsplash.com/photo-1585917170055-e40d30c73414?crop=faces&fit=crop&h=160&w=160&q=80",
}

export default function Practice({
  onSessionActive,
}: {
  onSessionActive: (active: boolean) => void
}) {
  const [view, setView] = useState<View>("loading")
  const [mode, setMode] = useState<Mode>("guess")
  const [packageReady, setPackageReady] = useState(false)
  const [pending, setPending] = useState<Session | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [dialogId, setDialogId] = useState(DIALOGUES[0].id)
  const [index, setIndex] = useState(0)
  const [choice, setChoice] = useState<number | null>(null)
  const [feedback, setFeedback] = useState(false)
  const [repair, setRepair] = useState(false)
  const [translation, setTranslation] = useState(false)
  const [audioState, setAudioState] = useState<AudioState>("stopped")
  const [audioText, setAudioText] = useState<string | null>(null)
  const [conversationPhase, setConversationPhase] =
    useState<ConversationPhase>("idle")
  const [conversationMistakes, setConversationMistakes] =
    useState<Record<string, number[]>>({})
  const [loadError, setLoadError] = useState("")
  const [saveError, setSaveError] = useState("")
  const [unsaved, setUnsaved] = useState<Session | null>(null)
  const [confirm, setConfirm] = useState<"exit" | "replace" | null>(null)
  const [storageBlocked, setStorageBlocked] = useState(false)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const feedbackRef = useRef<HTMLDivElement>(null)
  const nextRef = useRef<HTMLButtonElement>(null)
  const modalRef = useRef<HTMLDialogElement>(null)
  const conversationBodyRef = useRef<HTMLElement>(null)
  const audioGeneration = useRef(0)
  const conversationTimer = useRef<number | null>(null)
  const config = MODES.find((item) => item.id === mode)!
  const questions = session ? sessionQuestions(session) : []
  const question = questions[index]
  const guessQuestion =
    session?.mode === "guess" ? questionBank("guess")[index] : null
  const gapQuestion =
    session?.mode === "gap" ? questionBank("gap")[index] : null
  const [gapSentence = "", gapTranslation = ""] =
    gapQuestion?.prompt.split("\n") ?? []
  const [gapBefore = "", gapAfter = ""] = gapSentence.split("___")
  const gapAudioText = gapQuestion
    ? gapSentence.replace("___", gapQuestion.choices[gapQuestion.correct])
    : ""
  const dialog = DIALOGUES.find((item) => item.id === session?.dialogId)
  const dialogNode =
    session?.mode === "dialog" ? dialog?.nodes[index] : undefined
  const dialogAvatar = dialog ? DIALOG_AVATARS[dialog.id] : ""
  const correct = question && choice === question.correct
  const isLastQuestion = index === questions.length - 1
  const showQuestionFeedbackSheet =
    Boolean(feedback) &&
    !unsaved &&
    (session?.mode === "guess" || session?.mode === "gap")
  const correctAnswerCount =
    session?.answers.reduce(
      (total, answer, answerIndex) =>
        total + (answer.choice === questions[answerIndex]?.correct ? 1 : 0),
      0,
    ) ?? 0
  const incorrectAnswerCount =
    (session?.answers.length ?? 0) - correctAnswerCount
  const sessionSetup = view === "setup"
  const sessionActive =
    view === "question" || view === "summary" || sessionSetup

  async function load() {
    setView("loading")
    setLoadError("")
    setStorageBlocked(false)
    setPending(null)
    try {
      const installed = await readInstalledPackage()
      setPackageReady(Boolean(installed?.words.length))
      const saved = localStorage.getItem(SESSION_KEY)
      if (saved) {
        const parsed: unknown = JSON.parse(saved)
        if (!validSession(parsed)) {
          setStorageBlocked(true)
          setLoadError("Sesi tersimpan belum dapat dibaca.")
        } else if (!parsed.completed) {
          setPending(parsed)
        }
      }
      setView("home")
    } catch {
      setLoadError("Soal belum siap. Coba lagi.")
      setView("home")
    }
  }

  async function install() {
    setView("loading")
    try {
      const profile = await readLocalProfile()
      if (!profile) throw new Error("Profil belum siap.")
      await installPackage(profile)
      setPackageReady(true)
      setLoadError("")
      setView("home")
    } catch {
      setLoadError("Paket belum dapat dipasang. Coba lagi.")
      setView("home")
    }
  }

  useEffect(() => {
    void load()
  }, [])
  useEffect(() => {
    onSessionActive(sessionActive)
    return () => onSessionActive(false)
  }, [sessionActive, onSessionActive])
  useEffect(() => {
    if (view !== "question" || !feedback) headingRef.current?.focus()
  }, [view, index, feedback])
  useEffect(() => {
    if (feedback) feedbackRef.current?.focus()
  }, [feedback])
  useEffect(() => {
    if (confirm) modalRef.current?.showModal()
    else modalRef.current?.close()
  }, [confirm])
  useEffect(
    () => () => {
      audioGeneration.current++
      window.speechSynthesis?.cancel()
    },
    [],
  )
  useEffect(() => {
    const stop = () => {
      if (document.hidden) stopAudio()
    }
    document.addEventListener("visibilitychange", stop)
    return () => document.removeEventListener("visibilitychange", stop)
  }, [])
  useEffect(() => {
    if (conversationTimer.current)
      window.clearTimeout(conversationTimer.current)
    if (view === "question" && session?.mode === "dialog" && dialogNode) {
      setConversationPhase("partner-typing")
      setTranslation(false)
      conversationTimer.current = window.setTimeout(
        () => setConversationPhase("awaiting-response"),
        900,
      )
    } else {
      setConversationPhase("idle")
    }
    return () => {
      if (conversationTimer.current)
        window.clearTimeout(conversationTimer.current)
    }
  }, [view, index, session?.mode, dialogNode?.id])
  useEffect(() => {
    setConversationMistakes({})
  }, [session?.id])
  useEffect(() => {
    if (
      view !== "question" ||
      session?.mode !== "dialog" ||
      conversationPhase === "idle"
    )
      return
    const frame = window.requestAnimationFrame(() => {
      const body = conversationBodyRef.current
      if (!body) return
      body.scrollTo({
        top: body.scrollHeight,
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
      })
    })
    return () => window.cancelAnimationFrame(frame)
  }, [view, index, session?.mode, conversationPhase, translation])

  function stopAudio() {
    audioGeneration.current++
    window.speechSynthesis?.cancel()
    setAudioState("stopped")
  }
  function playAudio(text: string, language = "id-ID") {
    if (
      audioText === text &&
      (audioState === "playing" || audioState === "loading")
    ) {
      stopAudio()
      return
    }
    stopAudio()
    setAudioText(text)
    if (!("speechSynthesis" in window)) {
      setAudioState("unavailable")
      return
    }
    const generation = audioGeneration.current
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = language
    utterance.rate = 0.85
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
  function save(value: Session): boolean {
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(value))
      setSaveError("")
      setUnsaved(null)
      return true
    } catch {
      setSaveError(
        "Jawaban belum tersimpan. Coba simpan lagi sebelum melanjutkan.",
      )
      setUnsaved(value)
      return false
    }
  }
  function start() {
    const value: Session = {
      version: 1,
      bankVersion: 1,
      id: crypto.randomUUID(),
      mode,
      answers: [],
      completed: false,
      ...(mode === "dialog" ? { dialogId } : {}),
    }
    if (!save(value)) return
    setPending(null)
    setSession(value)
    setIndex(0)
    setChoice(null)
    setFeedback(false)
    setRepair(false)
    setTranslation(false)
    setView("question")
  }
  function resume() {
    if (!pending) return
    setMode(pending.mode)
    setSession(pending)
    const last = Math.min(
      pending.answers.length,
      sessionQuestions(pending).length - 1,
    )
    setIndex(last)
    const answered = pending.answers.length === sessionQuestions(pending).length
    setChoice(answered ? pending.answers[last].choice : null)
    setFeedback(answered)
    setRepair(false)
    setTranslation(false)
    setView("question")
  }
  function check() {
    if (choice === null || !session || feedback) return
    stopAudio()
    if (session.mode === "dialog" && !correct) {
      setRepair(true)
      setFeedback(true)
      return
    }
    const updated = recordAnswer(session, choice)
    setSession(updated)
    save(updated)
    setFeedback(true)
  }
  function next() {
    if (!session || unsaved) return
    stopAudio()
    if (repair) {
      setChoice(null)
      setFeedback(false)
      setRepair(false)
      return
    }
    if (index + 1 === questions.length) {
      const finished = { ...session, completed: true }
      if (!save(finished)) return
      setSession(finished)
      setPending(null)
      setView("summary")
    } else {
      setIndex((current) => current + 1)
      setChoice(null)
      setFeedback(false)
      setTranslation(false)
    }
  }
  function sendDialogResponse() {
    if (
      choice === null ||
      !session ||
      !dialogNode ||
      conversationPhase !== "awaiting-response"
    )
      return
    stopAudio()
    setConversationPhase("user-typing")
    conversationTimer.current = window.setTimeout(() => {
      setConversationPhase("user-sent")
      if (choice !== dialogNode.correct) {
        conversationTimer.current = window.setTimeout(() => {
          setConversationMistakes((current) => ({
            ...current,
            [dialogNode.id]: [...(current[dialogNode.id] ?? []), choice],
          }))
          setChoice(null)
          setConversationPhase("awaiting-response")
        }, 1400)
        return
      }
      const updated = recordAnswer(session, choice)
      setSession(updated)
      if (!save(updated)) return
      conversationTimer.current = window.setTimeout(() => {
        if (index + 1 === questions.length) {
          const finished = { ...updated, completed: true }
          if (!save(finished)) return
          setSession(finished)
          setPending(null)
          setView("summary")
        } else {
          setIndex((current) => current + 1)
          setChoice(null)
          setTranslation(false)
        }
      }, 800)
    }, 650)
  }
  function leave() {
    stopAudio()
    setConfirm(null)
    if (session && !session.completed) setPending(session)
    setView("home")
  }
  const audioButton = (
    text: string,
    extraClassName = "",
    language = "id-ID",
    accessibleLabel = `Audio ${text}`,
  ) => {
    const state = audioText === text ? audioState : "stopped"
    return (
      <button
        type="button"
        className={`icon-button practice-audio ${
          state === "playing" ? "is-playing" : ""
        } ${extraClassName}`}
        aria-label={`${accessibleLabel}. ${
          state === "playing"
            ? "sedang diputar"
            : state === "loading"
              ? "sedang dimuat"
              : state === "unavailable"
                ? "tidak tersedia"
                : "berhenti"
        }`}
        aria-pressed={state === "playing"}
        onClick={() => playAudio(text, language)}
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
    )
  }

  return (
    <div
      className={`practice-screen ${
        view === "question" ? "practice-session" : ""
      } ${sessionSetup ? "guess-setup-screen" : ""} ${
        sessionSetup && mode === "dialog" ? "conversation-setup-screen" : ""
      } ${
        view === "question" &&
        (session?.mode === "guess" || session?.mode === "gap")
          ? "structured-question-screen"
          : ""
      } ${
        view === "question" && session?.mode === "guess"
          ? "guess-question-screen"
          : ""
      } ${
        view === "question" && session?.mode === "gap"
          ? "gap-question-screen"
          : ""
      } ${
        view === "question" && session?.mode === "dialog"
          ? "conversation-question-screen"
          : ""
      } ${view === "summary" ? "practice-summary-screen" : ""}`}
    >
      {view === "loading" ? (
        <div className="practice-loading" role="status">
          <span className="prep-spinner" aria-hidden="true" />
          Menyiapkan latihan…
        </div>
      ) : view === "home" ? (
        <>
          <header className="practice-header">
            <h1 ref={headingRef} tabIndex={-1}>
              Latihan
            </h1>
          </header>
          <div className="practice-home-body">
            {pending && (
              <button
                type="button"
                className="practice-recovery"
                aria-labelledby="recovery-title"
                aria-describedby="recovery-description"
                onClick={resume}
              >
                <span id="recovery-title" className="practice-recovery-title">
                  Lanjutkan sesi terakhir
                </span>
                <span
                  id="recovery-description"
                  className="practice-recovery-description"
                >
                  {MODES.find((item) => item.id === pending.mode)?.title} ·{" "}
                  {Math.round(
                    (pending.answers.length /
                      sessionQuestions(pending).length) *
                      100,
                  )}
                  % selesai
                </span>
                <RiHistoryLine
                  className="practice-recovery-history"
                  aria-hidden="true"
                />
              </button>
            )}
            {loadError ? (
              <section className="practice-empty">
                <RiErrorWarningLine aria-hidden="true" />
                <h2>
                  {storageBlocked
                    ? "Sesi tersimpan belum dapat dibaca."
                    : loadError}
                </h2>
                <p>
                  {storageBlocked
                    ? "Data lama tidak dihapus. Coba buka ulang sebelum memulai sesi baru."
                    : "Periksa penyimpanan perangkat, lalu coba lagi."}
                </p>
                <button className="primary-button" onClick={load}>
                  Coba lagi
                </button>
              </section>
            ) : !packageReady ? (
              <section className="practice-empty">
                <RiBookOpenLine aria-hidden="true" />
                <h2>Paket belajar belum tersedia.</h2>
                <button className="primary-button" onClick={install}>
                  Pasang paket
                </button>
              </section>
            ) : (
              <div
                className="practice-cards"
                role="group"
                aria-labelledby="practice-mode-label"
              >
                <h2 id="practice-mode-label" className="practice-mode-label">
                  MODE
                </h2>
                {MODES.map((item, i) => {
                  const Icon = [RiTranslate2, RiPuzzleLine, RiChat3Line][i]
                  return (
                    <button
                      key={item.id}
                      type="button"
                      className={`practice-mode-card practice-mode-${item.id}`}
                      aria-labelledby={`mode-title-${item.id}`}
                      aria-describedby={`mode-description-${item.id}`}
                      onClick={() => {
                        setMode(item.id)
                        setView("setup")
                      }}
                    >
                      <span className="practice-card-copy">
                        <span
                          className="practice-card-title"
                          id={`mode-title-${item.id}`}
                        >
                          {item.title}
                        </span>
                        <span
                          className="practice-card-description"
                          id={`mode-description-${item.id}`}
                        >
                          {item.description}
                        </span>
                      </span>
                      <span className="practice-card-icon">
                        <Icon aria-hidden="true" />
                      </span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </>
      ) : sessionSetup ? (
        <>
          <header className="guess-setup-topbar">
            <button
              type="button"
              className="icon-button"
              aria-label="Kembali ke Latihan"
              onClick={() => setView("home")}
            >
              <RiArrowLeftLine aria-hidden="true" />
            </button>
            <h1 ref={headingRef} tabIndex={-1}>
              {config.title}
            </h1>
            <span aria-hidden="true" />
          </header>
          <div className="guess-setup-body">
            <div className="guess-setup-context" aria-label="Paket sesi">
              <span className="package-pill">Bahasa: Jawa</span>
              <span className="package-pill">Dialek: Mataraman</span>
            </div>
            <section
              className="guess-setup-main"
              aria-labelledby="guess-setup-instruction"
            >
              {mode === "dialog" ? (
                <svg
                  className="guess-setup-illustration conversation-setup-illustration"
                  viewBox="0 0 320 220"
                  aria-hidden="true"
                  focusable="false"
                >
                  <g transform="rotate(-8 126 91)">
                    <path
                      className="guess-art-paper"
                      d="M58 30h143a14 14 0 0 1 14 14v75a14 14 0 0 1-14 14h-89l-30 23v-23H58a14 14 0 0 1-14-14V44a14 14 0 0 1 14-14Z"
                    />
                    <rect
                      className="guess-art-rule"
                      x="67"
                      y="56"
                      width="105"
                      height="6"
                      rx="3"
                    />
                    <rect
                      className="guess-art-rule"
                      x="67"
                      y="75"
                      width="73"
                      height="6"
                      rx="3"
                    />
                  </g>
                  <g transform="rotate(7 201 144)">
                    <path
                      className="guess-art-front"
                      d="M128 89h136a14 14 0 0 1 14 14v65a14 14 0 0 1-14 14h-12v24l-31-24h-93a14 14 0 0 1-14-14v-65a14 14 0 0 1 14-14Z"
                    />
                    <path
                      className="guess-art-rule-light"
                      d="M138 117h113m-113 20h80"
                    />
                    <rect
                      className="guess-art-choice-selected"
                      x="138"
                      y="151"
                      width="49"
                      height="9"
                      rx="4"
                    />
                  </g>
                </svg>
              ) : (
                <svg
                  className="guess-setup-illustration"
                  viewBox="0 0 320 260"
                  aria-hidden="true"
                  focusable="false"
                >
                  <g transform="rotate(-12 126 122)">
                    <rect
                      className="guess-art-paper"
                      x="52"
                      y="24"
                      width="160"
                      height="196"
                      rx="14"
                    />
                    <rect
                      className="guess-art-rule"
                      x="72"
                      y="48"
                      width="76"
                      height="6"
                      rx="3"
                    />
                    <rect
                      className="guess-art-rule"
                      x="72"
                      y="63"
                      width="112"
                      height="6"
                      rx="3"
                    />
                  </g>
                  <g transform="rotate(8 176 136)">
                    <rect
                      className="guess-art-front"
                      x="92"
                      y="42"
                      width="160"
                      height="196"
                      rx="14"
                    />
                    {mode === "guess" ? (
                      <path
                        className="guess-art-question"
                        d="M158 86c0-9 7-15 16-15s16 6 16 14c0 13-16 12-16 24m0 13v1"
                      />
                    ) : (
                      <g>
                        <path
                          className="guess-art-rule-light"
                          d="M113 86h35m-35 28h89"
                        />
                        <rect
                          className="gap-art-blank"
                          x="160"
                          y="73"
                          width="62"
                          height="26"
                          rx="5"
                        />
                      </g>
                    )}
                    <rect
                      className="guess-art-choice"
                      x="111"
                      y="145"
                      width="122"
                      height="23"
                      rx="6"
                    />
                    <rect
                      className="guess-art-choice-selected"
                      x="111"
                      y="178"
                      width="122"
                      height="23"
                      rx="6"
                    />
                    <path className="guess-art-rule-light" d="M124 157h61" />
                    <path className="guess-art-rule-light" d="M124 190h61" />
                    <path className="guess-art-tick" d="m207 189 4 4 7-8" />
                  </g>
                  {mode === "guess" ? (
                    <g transform="rotate(-12 253 193)">
                      <circle
                        className="guess-art-lens"
                        cx="252"
                        cy="181"
                        r="26"
                      />
                      <path className="guess-art-handle" d="m271 201 22 22" />
                      <path
                        className="guess-art-lens-tick"
                        d="m242 181 7 7 13-14"
                      />
                    </g>
                  ) : (
                    <g transform="rotate(-12 254 199)">
                      <rect
                        className="guess-art-choice-selected"
                        x="222"
                        y="183"
                        width="66"
                        height="34"
                        rx="8"
                      />
                      <path className="guess-art-tick" d="m244 200 7 7 14-16" />
                    </g>
                  )}
                </svg>
              )}
              {validBank(mode) ? (
                <>
                  <p
                    id="guess-setup-instruction"
                    className="guess-setup-instruction"
                  >
                    {mode === "dialog"
                      ? "Pilih topik percakapanmu."
                      : mode === "guess"
                        ? "Pilih kata yang sesuai dengan artinya."
                        : "Lengkapi kalimat dengan kata yang tepat."}
                  </p>
                  {mode === "dialog" ? (
                    <ConversationTopics
                      selectedId={dialogId}
                      onSelect={setDialogId}
                    />
                  ) : (
                    <div className="guess-setup-details">
                      <span>
                        <RiFileList3Line aria-hidden="true" />
                        {questionBank(mode).length} soal
                      </span>
                      <span>
                        <RiTimeLine aria-hidden="true" />
                        Tanpa batas waktu
                      </span>
                    </div>
                  )}
                </>
              ) : (
                <p
                  id="guess-setup-instruction"
                  className="guess-setup-instruction"
                >
                  Belum ada materi untuk sesi ini.
                </p>
              )}
            </section>
          </div>
          <footer className="guess-setup-footer">
            <button
              type="button"
              className="primary-button practice-full-button"
              disabled={!validBank(mode) || Boolean(unsaved)}
              onClick={() => (pending ? setConfirm("replace") : start())}
            >
              Mulai latihan
            </button>
          </footer>
        </>
      ) : view === "question" && session && question ? (
        <>
          <header
            className={`practice-topbar ${
              session.mode === "dialog" ? "conversation-topbar" : ""
            }`}
          >
            {session.mode === "dialog" ? (
              <div className="conversation-contact">
                <img
                  className="conversation-contact-avatar"
                  src={dialogAvatar}
                  alt=""
                />
                <span className="conversation-contact-copy">
                  <h1 ref={headingRef} tabIndex={-1}>
                    {dialogNode?.speaker}
                  </h1>
                </span>
              </div>
            ) : (
              <h1 ref={headingRef} tabIndex={-1}>
                {session.mode === "guess" ? "Tebak kata" : "Kalimat rumpang"}
              </h1>
            )}
            <button
              className="icon-button"
              aria-label="Keluar dari sesi"
              onClick={() => setConfirm("exit")}
            >
              <RiCloseLine aria-hidden="true" />
            </button>
          </header>
          {session.mode !== "dialog" && (
            <div className="practice-question-progress" aria-hidden="true">
              {questions.map((item, i) => (
                <span key={item.id} className={i <= index ? "is-filled" : ""} />
              ))}
            </div>
          )}
          <section
            ref={session.mode === "dialog" ? conversationBodyRef : undefined}
            className="practice-question-body"
          >
            {dialogNode ? (
              <>
                <div
                  className="conversation-thread"
                  aria-label="Transkrip percakapan"
                >
                  {dialog?.nodes.slice(0, index).map((node, i) => (
                    <div className="conversation-message-pair" key={node.id}>
                      <div className="conversation-message is-incoming">
                        <img
                          className="conversation-message-avatar"
                          src={dialogAvatar}
                          alt=""
                        />
                        <div className="conversation-message-content">
                          <div className="conversation-bubble">
                            <p>{node.text}</p>
                          </div>
                        </div>
                      </div>
                      {(conversationMistakes[node.id] ?? []).map(
                        (mistakeChoice, mistakeIndex) => (
                          <div
                            className="conversation-message is-outgoing is-mistake"
                            key={`${node.id}-mistake-${mistakeIndex}`}
                          >
                            <div className="conversation-message-content">
                              <span className="sr-only">Kamu</span>
                              <div className="conversation-bubble">
                                <p>{node.choices[mistakeChoice]}</p>
                                <RiCheckDoubleLine
                                  className="conversation-delivery"
                                  aria-label="Terkirim"
                                />
                              </div>
                              <p
                                className="conversation-repair-note"
                                role="status"
                              >
                                {node.repair}
                              </p>
                            </div>
                          </div>
                        ),
                      )}
                      <div className="conversation-message is-outgoing">
                        <div className="conversation-message-content">
                          <span className="sr-only">Kamu</span>
                          <div className="conversation-bubble">
                            <p>{node.choices[session.answers[i].choice]}</p>
                            <RiCheckDoubleLine
                              className="conversation-delivery"
                              aria-label="Terkirim"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="conversation-message is-incoming is-current">
                    <img
                      className="conversation-message-avatar"
                      src={dialogAvatar}
                      alt=""
                    />
                    <div className="conversation-message-content">
                      <div className="conversation-bubble">
                        {conversationPhase === "partner-typing" ? (
                          <span
                            className="conversation-typing"
                            role="status"
                            aria-label={`${dialogNode.speaker} sedang mengetik`}
                          >
                            <i />
                            <i />
                            <i />
                          </span>
                        ) : (
                          <p>{dialogNode.text}</p>
                        )}
                      </div>
                      {conversationPhase !== "partner-typing" && (
                        <>
                          <div className="conversation-message-tools">
                            {audioButton(
                              dialogNode.text,
                              "conversation-audio",
                              "jv-ID",
                            )}
                            <button
                              className="conversation-translation-toggle"
                              aria-expanded={translation}
                              onClick={() => setTranslation((value) => !value)}
                            >
                              <RiTranslate2 aria-hidden="true" />
                              {translation
                                ? "Sembunyikan terjemahan"
                                : "Lihat terjemahan"}
                            </button>
                          </div>
                          {translation && (
                            <p className="conversation-translation">
                              {dialogNode.translation}
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                  {(conversationMistakes[dialogNode.id] ?? []).map(
                    (mistakeChoice, mistakeIndex) => (
                      <div
                        className="conversation-message is-outgoing is-mistake"
                        key={`${dialogNode.id}-mistake-${mistakeIndex}`}
                      >
                        <div className="conversation-message-content">
                          <span className="sr-only">Kamu</span>
                          <div className="conversation-bubble">
                            <p>{dialogNode.choices[mistakeChoice]}</p>
                            <RiCheckDoubleLine
                              className="conversation-delivery"
                              aria-label="Terkirim"
                            />
                          </div>
                          <p className="conversation-repair-note" role="status">
                            {dialogNode.repair}
                          </p>
                        </div>
                      </div>
                    ),
                  )}
                  {(conversationPhase === "user-typing" ||
                    conversationPhase === "user-sent") &&
                    choice !== null && (
                      <div className="conversation-message is-outgoing is-current">
                        <div className="conversation-message-content">
                          <span className="sr-only">Kamu</span>
                          <div className="conversation-bubble">
                            {conversationPhase === "user-typing" ? (
                              <span
                                className="conversation-typing"
                                role="status"
                                aria-label="Kamu sedang mengetik"
                              >
                                <i />
                                <i />
                                <i />
                              </span>
                            ) : (
                              <>
                                <p>{dialogNode.choices[choice]}</p>
                                <RiCheckDoubleLine
                                  className="conversation-delivery"
                                  aria-label="Terkirim"
                                />
                              </>
                            )}
                          </div>
                          {conversationPhase === "user-sent" &&
                            choice !== dialogNode.correct && (
                              <p
                                className="conversation-repair-note"
                                role="status"
                              >
                                {dialogNode.repair}
                              </p>
                            )}
                        </div>
                      </div>
                    )}
                </div>
              </>
            ) : guessQuestion ? (
              <div className="guess-word-stage">
                <div className="guess-word-prompt">
                  <h2 lang={guessQuestion.promptLanguage}>
                    {guessQuestion.prompt}
                  </h2>
                </div>
                {guessQuestion.promptLanguage === "jv" && (
                  <div className="guess-word-audio-row">
                    {audioButton(
                      guessQuestion.prompt,
                      "guess-question-audio",
                      "jv-ID",
                    )}
                  </div>
                )}
              </div>
            ) : gapQuestion ? (
              <div className="gap-question-stage">
                <div className="gap-question-prompt">
                  <h2 lang="jv">
                    {gapBefore}
                    <span className="gap-question-blank">
                      <span className="sr-only">
                        bagian yang perlu dilengkapi
                      </span>
                    </span>
                    {gapAfter}
                  </h2>
                  <p lang="id">{gapTranslation}</p>
                </div>
                <div className="gap-question-audio-row">
                  {audioButton(
                    gapAudioText,
                    "guess-question-audio",
                    "jv-ID",
                    "Audio kalimat lengkap",
                  )}
                </div>
              </div>
            ) : (
              <div className="practice-prompt">
                <h2>{questionBank(session.mode)[index].prompt}</h2>
              </div>
            )}
            {audioState === "unavailable" && (
              <p className="practice-audio-note" role="status">
                Audio belum tersedia. Kamu tetap bisa membaca teksnya.
              </p>
            )}
            {!dialogNode && (
              <div
                className="practice-answers"
                role="group"
                aria-label="Pilihan jawaban"
              >
                {question.choices.map((answer, i) =>
                  guessQuestion ? (
                    <div key={answer} className="guess-answer-row">
                      <button
                        type="button"
                        className={`practice-answer ${
                          choice === i ? "is-selected" : ""
                        } ${
                          feedback && i === question.correct ? "is-correct" : ""
                        }`}
                        aria-pressed={choice === i}
                        disabled={feedback}
                        onClick={() => setChoice(i)}
                      >
                        <span
                          className="practice-answer-letter"
                          aria-hidden="true"
                        >
                          {String.fromCharCode(65 + i)}
                        </span>
                        <span
                          lang={
                            guessQuestion.promptLanguage === "id" ? "jv" : "id"
                          }
                        >
                          {answer}
                        </span>
                        {choice === i && <RiCheckLine aria-hidden="true" />}
                      </button>
                      {guessQuestion.promptLanguage === "id" &&
                        audioButton(answer, "guess-question-audio", "jv-ID")}
                    </div>
                  ) : gapQuestion ? (
                    <div key={answer} className="guess-answer-row">
                      <button
                        type="button"
                        className={`practice-answer ${
                          choice === i ? "is-selected" : ""
                        } ${
                          feedback && i === question.correct ? "is-correct" : ""
                        }`}
                        aria-pressed={choice === i}
                        disabled={feedback}
                        onClick={() => setChoice(i)}
                      >
                        <span
                          className="practice-answer-letter"
                          aria-hidden="true"
                        >
                          {String.fromCharCode(65 + i)}
                        </span>
                        <span lang="jv">{answer}</span>
                        {choice === i && <RiCheckLine aria-hidden="true" />}
                      </button>
                      {audioButton(answer, "guess-question-audio", "jv-ID")}
                    </div>
                  ) : (
                    <button
                      type="button"
                      key={answer}
                      className={`practice-answer ${
                        choice === i ? "is-selected" : ""
                      } ${
                        feedback && i === question.correct && !repair
                          ? "is-correct"
                          : ""
                      }`}
                      aria-pressed={choice === i}
                      disabled={feedback}
                      onClick={() => setChoice(i)}
                    >
                      <span
                        className="practice-answer-letter"
                        aria-hidden="true"
                      >
                        {String.fromCharCode(65 + i)}
                      </span>
                      <span>{answer}</span>
                      {choice === i && <RiCheckLine aria-hidden="true" />}
                    </button>
                  ),
                )}
              </div>
            )}
            <div className="practice-feedback-slot">
              {feedback && !showQuestionFeedbackSheet && (
                <div
                  ref={feedbackRef}
                  tabIndex={-1}
                  role="status"
                  aria-live="polite"
                  className={`practice-feedback ${
                    correct ? "feedback-correct" : "feedback-incorrect"
                  }`}
                >
                  <div>
                    {correct ? (
                      <RiCheckboxCircleLine aria-hidden="true" />
                    ) : (
                      <RiInformationLine aria-hidden="true" />
                    )}
                    <strong>
                      {repair
                        ? "Coba respons lain."
                        : correct
                          ? "Benar. Lihat contoh penggunaannya."
                          : `Belum tepat. Jawaban yang benar: ${question.choices[question.correct]}.`}
                    </strong>
                  </div>
                  <p>{repair ? dialogNode?.repair : question.explanation}</p>
                  {!dialogNode && !repair && (
                    <p className="practice-example">
                      {questionBank(session.mode)[index].example}
                    </p>
                  )}
                </div>
              )}
            </div>
          </section>
          {dialogNode && conversationPhase === "awaiting-response" && (
            <footer className="practice-question-footer conversation-composer">
              <h2 className="conversation-response-heading">Pilih balasanmu</h2>
              <div
                className="practice-answers"
                role="group"
                aria-label="Pilihan balasan"
              >
                {question.choices.map((answer, i) => (
                  <button
                    type="button"
                    key={answer}
                    className={`conversation-reply ${
                      choice === i ? "is-selected" : ""
                    }`}
                    aria-pressed={choice === i}
                    onClick={() => setChoice(i)}
                  >
                    <span
                      className="conversation-reply-letter"
                      aria-hidden="true"
                    >
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span className="conversation-reply-text">{answer}</span>
                    {choice === i ? <RiCheckLine aria-hidden="true" /> : null}
                  </button>
                ))}
              </div>
              <button
                className="primary-button practice-full-button"
                disabled={choice === null}
                onClick={sendDialogResponse}
              >
                Kirim jawaban
                <RiSendPlane2Line aria-hidden="true" />
              </button>
            </footer>
          )}
          {!dialogNode && !showQuestionFeedbackSheet && (
            <footer className="practice-question-footer">
              {feedback ? (
                <button
                  ref={nextRef}
                  className="primary-button practice-full-button"
                  disabled={Boolean(unsaved)}
                  onClick={next}
                >
                  {repair ? "Coba respons lain" : "Lanjut"}
                  <RiArrowRightLine aria-hidden="true" />
                </button>
              ) : (
                <button
                  className="primary-button practice-full-button"
                  disabled={choice === null}
                  onClick={check}
                >
                  Periksa jawaban
                </button>
              )}
            </footer>
          )}
          {showQuestionFeedbackSheet && (
            <div className="guess-feedback-overlay">
              <div className="guess-feedback-backdrop" aria-hidden="true" />
              <div
                ref={feedbackRef}
                className={`guess-feedback-sheet ${
                  correct ? "is-correct" : "is-incorrect"
                }`}
                role="dialog"
                aria-modal="true"
                aria-labelledby="guess-feedback-title"
                aria-describedby="guess-feedback-description"
                tabIndex={-1}
              >
                <div className="guess-feedback-icon" aria-hidden="true">
                  {correct ? <RiCheckboxCircleLine /> : <RiCloseCircleLine />}
                </div>
                <h2 id="guess-feedback-title">
                  {correct ? "Jawaban benar" : "Jawaban kurang tepat"}
                </h2>
                <p id="guess-feedback-description">
                  {!correct && (
                    <>
                      Jawaban yang benar adalah{" "}
                      <strong>{question.choices[question.correct]}</strong>.{" "}
                    </>
                  )}
                  {question.explanation}
                </p>
                <button
                  ref={nextRef}
                  type="button"
                  className="primary-button practice-full-button"
                  disabled={Boolean(unsaved)}
                  onClick={next}
                >
                  {isLastQuestion ? "Selesai" : "Lanjut"}
                  <RiArrowRightLine aria-hidden="true" />
                </button>
              </div>
            </div>
          )}
        </>
      ) : view === "summary" && session ? (
        <section className="practice-summary">
          <div className="practice-summary-body">
            <div className="practice-summary-main">
              <svg
                className="practice-summary-illustration"
                viewBox="0 0 320 220"
                aria-hidden="true"
                focusable="false"
              >
                <circle className="summary-art-halo" cx="160" cy="112" r="86" />
                <path
                  className="summary-art-confetti summary-art-confetti-teal"
                  d="m63 55 9 9m-1-19 3-12m177 25 10-8m-3 21 13 2"
                />
                <path
                  className="summary-art-confetti summary-art-confetti-orange"
                  d="m99 31-4-13m128 24 5-12M49 109l-13 3m246 5 12 5"
                />
                <g transform="rotate(-7 143 119)">
                  <rect
                    className="summary-art-paper"
                    x="82"
                    y="52"
                    width="132"
                    height="142"
                    rx="16"
                  />
                  <rect
                    className="summary-art-rule"
                    x="103"
                    y="76"
                    width="72"
                    height="7"
                    rx="3.5"
                  />
                  <rect
                    className="summary-art-rule"
                    x="103"
                    y="94"
                    width="90"
                    height="7"
                    rx="3.5"
                  />
                  <rect
                    className="summary-art-result"
                    x="103"
                    y="124"
                    width="90"
                    height="42"
                    rx="9"
                  />
                </g>
                <g className="summary-art-badge">
                  <circle cx="225" cy="151" r="39" />
                  <path d="m207 151 12 12 24-27" />
                </g>
              </svg>
              <h1 ref={headingRef} tabIndex={-1}>
                {session.mode === "guess"
                  ? "Tebak kata selesai"
                  : `${config.title} selesai`}
              </h1>
              <p>Kamu telah menyelesaikan seluruh soal latihan.</p>
              <div
                className="practice-summary-results"
                aria-label="Hasil latihan"
              >
                <div className="practice-result-card is-correct">
                  <RiCheckboxCircleLine aria-hidden="true" />
                  <strong>{correctAnswerCount}</strong>
                  <span>Soal terjawab benar</span>
                </div>
                <div className="practice-result-card is-incorrect">
                  <RiCloseCircleLine aria-hidden="true" />
                  <strong>{incorrectAnswerCount}</strong>
                  <span>Soal terjawab salah</span>
                </div>
              </div>
            </div>
          </div>
          <footer className="practice-summary-footer">
            <button
              className="primary-button practice-full-button"
              onClick={() => {
                setView("home")
                setSession(null)
              }}
            >
              Kembali ke Latihan
            </button>
          </footer>
        </section>
      ) : null}
      {saveError && (
        <div className="practice-save-error" role="alert">
          <p>{saveError}</p>
          <button
            className="practice-text-button"
            onClick={() => {
              if (unsaved && save(unsaved)) {
                setSession(unsaved)
                if (unsaved.completed) {
                  setPending(null)
                  setView("summary")
                } else if (view === "setup") {
                  setIndex(0)
                  setChoice(null)
                  setFeedback(false)
                  setRepair(false)
                  setTranslation(false)
                  setPending(null)
                  setView("question")
                }
              }
            }}
          >
            Coba simpan lagi
          </button>
        </div>
      )}
      <dialog
        ref={modalRef}
        className="practice-confirm"
        onCancel={() => setConfirm(null)}
        aria-labelledby="practice-confirm-title"
      >
        <h2 id="practice-confirm-title">
          {confirm === "replace" ? "Mulai sesi baru?" : "Keluar dari sesi?"}
        </h2>
        <p>
          {confirm === "replace"
            ? "Sesi yang belum selesai akan diganti. Jawaban sesi lama akan dihapus setelah kamu mengonfirmasi."
            : unsaved
              ? "Jawaban terbaru belum tersimpan. Simpan kembali sebelum keluar."
              : "Jawaban yang sudah tersimpan tetap aman."}
        </p>
        <button
          className="primary-button practice-full-button"
          disabled={Boolean(unsaved)}
          onClick={() => {
            if (confirm === "replace") {
              setConfirm(null)
              start()
            } else leave()
          }}
        >
          {confirm === "replace" ? "Ya, mulai baru" : "Keluar dari sesi"}
        </button>
        <button
          className="practice-text-button"
          onClick={() => setConfirm(null)}
        >
          Batal
        </button>
      </dialog>
    </div>
  )
}
