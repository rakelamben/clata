import { useEffect, useRef, useState, type FormEvent } from "react"
import {
  RiArrowLeftLine,
  RiArrowRightLine,
  RiBookOpenLine,
  RiCheckLine,
  RiDatabase2Line,
  RiDownload2Line,
  RiRefreshLine,
  RiShieldCheckLine,
} from "@remixicon/react"
import {
  BUNDLED_WORDS,
  installPackage,
  makeProfile,
  readInstalledPackage,
  type LocalProfile,
  type Word,
} from "./local-package"

type Step = 1 | 2 | 3 | 4
type Phase = "checking" | "year" | "packages" | "preparing" | "ready" | "failed"
const RECOVERY_KEY = "clata-onboarding-pending"

export default function Onboarding({
  onComplete,
}: {
  onComplete: (words: Word[]) => void
}) {
  const [step, setStep] = useState<Step>(1)
  const [phase, setPhase] = useState<Phase>("checking")
  const [year, setYear] = useState("")
  const [error, setError] = useState("")
  const [blocked, setBlocked] = useState(false)
  const [stage, setStage] = useState(0)
  const [profile, setProfile] = useState<LocalProfile | null>(null)
  const [installedWords, setInstalledWords] = useState<Word[]>([])
  const headingRef = useRef<HTMLHeadingElement>(null)
  const inputRef = useRef<HTMLSelectElement>(null)

  useEffect(() => {
    let active = true
    async function restore() {
      try {
        const installed = await readInstalledPackage()
        if (!active) return
        if (installed) {
          onComplete(installed.words)
          return
        }
        const pending = localStorage.getItem(RECOVERY_KEY)
        if (pending) {
          const value: unknown = JSON.parse(pending)
          if (
            typeof value === "number" &&
            Number.isInteger(value) &&
            value >= new Date().getFullYear() - 120 &&
            value <= new Date().getFullYear() - 10
          ) {
            setYear(String(value))
            setProfile(makeProfile(value))
            setStep(4)
            setPhase("preparing")
            return
          }
        }
      } catch {
        // A storage failure must not prevent the user from reading the introduction.
      }
      if (active) setPhase("year")
    }
    void restore()
    return () => {
      active = false
    }
  }, [onComplete])

  useEffect(() => {
    headingRef.current?.focus()
  }, [step, phase, blocked])

  useEffect(() => {
    if (phase !== "preparing" || !profile) return
    let active = true
    const timers: number[] = []
    const pause = () =>
      new Promise<void>((resolve) => {
        timers.push(window.setTimeout(resolve, 550))
      })
    async function prepare() {
      try {
        setStage(0)
        localStorage.setItem(RECOVERY_KEY, String(profile!.birthYear))
        await pause()
        if (!active) return
        setStage(1)
        if (
          !BUNDLED_WORDS.length ||
          BUNDLED_WORDS.some(
            (word) => !word.lemma || !word.meaning || word.language !== "Jawa",
          )
        )
          throw new Error("Paket tidak valid.")
        await pause()
        if (!active) return
        setStage(2)
        const installed = await installPackage(profile!)
        if (!active) return
        localStorage.removeItem(RECOVERY_KEY)
        setInstalledWords(installed.words)
        setStage(3)
        setPhase("ready")
      } catch {
        if (active) setPhase("failed")
      }
    }
    void prepare()
    return () => {
      active = false
      timers.forEach(window.clearTimeout)
    }
  }, [phase, profile])

  useEffect(() => {
    if (phase !== "ready") return
    const timer = window.setTimeout(() => onComplete(installedWords), 1500)
    return () => window.clearTimeout(timer)
  }, [phase, installedWords, onComplete])

  function submit(event: FormEvent) {
    event.preventDefault()
    const currentYear = new Date().getFullYear()
    const birthYear = Number(year)
    if (
      !/^\d{4}$/.test(year) ||
      birthYear < currentYear - 120 ||
      birthYear > currentYear
    ) {
      setError("Pilih tahun lahirmu terlebih dahulu.")
      inputRef.current?.focus()
      return
    }
    setError("")
    if (currentYear - birthYear < 10) {
      setBlocked(true)
      return
    }
    setProfile(makeProfile(birthYear))
    setStep(4)
    setPhase("packages")
  }

  if (phase === "checking")
    return (
      <main className="app-shell onboarding-check">
        <p role="status">Menyiapkan Clata…</p>
      </main>
    )

  const preparing =
    step === 4 && ["preparing", "ready", "failed"].includes(phase)
  const title = blocked
    ? "Kita bertemu lagi nanti, ya."
    : step === 1
      ? "Belajar bahasa daerah dengan percaya diri."
      : step === 2
        ? "Siapkan profil lokal."
        : step === 3
          ? "Berapa tahun lahirmu?"
          : phase === "ready"
            ? "Paket belajar siap"
            : preparing
              ? "Menyiapkan ruang belajarmu."
              : "Siapkan paket belajarmu."
  const stages = [
    "Pemasangan database lokal",
    "Validasi materi belajar",
    "Paket bundel Jawa–Mataraman",
  ]

  return (
    <main
      className={`app-shell onboarding-shell ${
        step === 4 ? "onboarding-package-screen" : ""
      }`}
    >
      <header className="onboarding-top">
        <div className="onboarding-brand">
          {step > 1 && phase !== "preparing" && phase !== "ready" && (
            <button
              type="button"
              className="icon-button"
              aria-label="Kembali ke langkah sebelumnya"
              onClick={() => {
                if (step === 4 && phase === "failed") {
                  try {
                    localStorage.removeItem(RECOVERY_KEY)
                  } catch {
                    /* Recovery remains safe if storage is unavailable. */
                  }
                }
                setStep(step === 4 ? 3 : step === 3 ? 2 : 1)
                setBlocked(false)
                setError("")
                setPhase("year")
              }}
            >
              <RiArrowLeftLine aria-hidden="true" />
            </button>
          )}
          <span className="clata-wordmark">
            clata<span>.</span>
          </span>
        </div>
        {step === 1 && (
          <button className="onboarding-skip" onClick={() => setStep(2)}>
            Lewati <RiArrowRightLine aria-hidden="true" />
          </button>
        )}
      </header>
      <div className="onboarding-body">
        {step !== 4 && (
          <div className={`onboarding-art art-step-${step}`} aria-hidden="true">
            {step === 1 ? (
              <div className="editorial-word-stack">
                <div className="paper-word paper-word-back">
                  <span>JAWA · MATARAMAN</span>
                  <strong>monggo</strong>
                  <em>silakan</em>
                </div>
                <div className="paper-word paper-word-front">
                  <RiBookOpenLine />
                  <span>KATA PERTAMAMU</span>
                  <strong>sugeng</strong>
                  <em>selamat</em>
                </div>
              </div>
            ) : (
              <div className="local-art">
                <div className="local-art-ring">
                  <div className="local-art-symbol">
                    {preparing ? (
                      <RiBookOpenLine />
                    ) : step === 2 ? (
                      <RiDatabase2Line />
                    ) : (
                      <RiShieldCheckLine />
                    )}
                  </div>
                  <span className="local-art-check">
                    <RiCheckLine />
                  </span>
                </div>
                <span className="local-art-caption">
                  {step === 2
                    ? "Tersimpan dekat. Di perangkatmu."
                    : "Ruang belajar yang aman untukmu."}
                </span>
              </div>
            )}
          </div>
        )}
        <section
          className="onboarding-copy"
          aria-labelledby="onboarding-heading"
        >
          <h1 id="onboarding-heading" ref={headingRef} tabIndex={-1}>
            {title}
          </h1>
          {(blocked || step !== 3 || preparing) && (
            <p className="onboarding-description">
              {blocked
                ? "Clata ditujukan untuk usia 10 tahun ke atas. Kamu bisa kembali ketika sudah cukup umur."
                : step === 1
                  ? "Pelajari kata dan percakapan untuk digunakan sehari-hari."
                  : step === 2
                    ? "Aplikasi berjalan 100% offline dan data anda tersimpan dipenyimpanan perangkat anda"
                    : phase === "ready"
                      ? "Materi belajar telah diverifikasi di perangkatmu."
                      : preparing
                        ? "Kami menyiapkan materi agar kamu bisa belajar tanpa koneksi internet."
                        : step === 4
                          ? "Paket berikut akan dipasang untuk mulai belajar. Semua materi tersedia tanpa koneksi internet."
                          : ""}
            </p>
          )}
          {step === 3 && !preparing && !blocked && (
            <form
              id="age-form"
              className="age-form"
              onSubmit={submit}
              noValidate
            >
              <select
                ref={inputRef}
                id="birth-year"
                autoComplete="bday-year"
                aria-label="Pilih tahun lahir"
                value={year}
                onChange={(event) => {
                  setYear(event.target.value)
                  setError("")
                }}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? "year-error" : undefined}
              >
                <option value="" disabled>
                  Pilih tahun lahir
                </option>
                {Array.from({ length: 121 }, (_, index) => {
                  const birthYear = new Date().getFullYear() - index
                  return (
                    <option key={birthYear} value={birthYear}>
                      {birthYear}
                    </option>
                  )
                })}
              </select>
              {error && (
                <p id="year-error" className="age-error" role="alert">
                  {error}
                </p>
              )}
            </form>
          )}
          {step === 4 && (
            <div className="onboarding-package-area">
              <ul
                className={`onboarding-package-list ${
                  preparing ? "is-installing" : ""
                }`}
                aria-label="Paket belajar yang akan dipasang"
                aria-hidden={preparing || undefined}
                aria-busy={phase === "preparing"}
              >
                <li className="onboarding-package-card">
                  <div className="onboarding-package-icon">
                    <RiBookOpenLine aria-hidden="true" />
                  </div>
                  <div className="onboarding-package-details">
                    <h2>Jawa – Mataraman</h2>
                    <p>Kata dan percakapan untuk keseharian.</p>
                    <div className="onboarding-package-content">
                      <span>Kata</span>
                      <span>Latihan</span>
                      <span>Dialog</span>
                    </div>
                    <p className="onboarding-package-bundled">
                      Paket bawaan · Tersedia offline
                    </p>
                  </div>
                  <RiCheckLine
                    className="onboarding-package-selected"
                    aria-label="Termasuk dalam pemasangan"
                    role="img"
                  />
                </li>
              </ul>
              {preparing && (
                <div className="onboarding-install-overlay">
                  <div
                    className={`onboarding-install-symbol ${
                      phase === "ready" ? "is-ready" : ""
                    }`}
                    aria-hidden="true"
                  >
                    {phase === "preparing" ? (
                      <span className="prep-spinner" />
                    ) : phase === "ready" ? (
                      <RiCheckLine />
                    ) : (
                      <RiRefreshLine />
                    )}
                  </div>
                  <h2>
                    {phase === "ready"
                      ? "Siap dipakai"
                      : phase === "failed"
                        ? "Pemasangan belum selesai"
                        : "Memasang paket belajar"}
                  </h2>
                  <div className="preparation-list">
                    <p role="status" className="sr-only">
                      {phase === "failed"
                        ? "Persiapan belum selesai. Coba lagi."
                        : phase === "ready"
                          ? "Paket siap. Membuka feed kata."
                          : stages[stage]}
                    </p>
                    {stages.map((label, index) => (
                      <div
                        className={`preparation-row ${
                          stage > index ? "is-done" : ""
                        }`}
                        key={label}
                      >
                        <span
                          className={
                            phase === "preparing" && stage === index
                              ? "prep-spinner"
                              : "prep-status"
                          }
                          aria-hidden="true"
                        >
                          {stage > index ? <RiCheckLine /> : index + 1}
                        </span>
                        <span>{label}</span>
                      </div>
                    ))}
                    {phase === "failed" && (
                      <p className="age-error">
                        Paket belum terpasang. Pastikan penyimpanan perangkat
                        tersedia, lalu coba lagi.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      </div>
      <footer className="onboarding-footer">
        {!blocked &&
          !preparing &&
          (step === 4 ? (
            <button
              type="button"
              className="primary-button onboarding-next"
              onClick={() => setPhase("preparing")}
            >
              Mulai <RiDownload2Line aria-hidden="true" />
            </button>
          ) : step === 3 ? (
            <button
              type="submit"
              form="age-form"
              className="primary-button onboarding-next"
            >
              Lanjut <RiArrowRightLine aria-hidden="true" />
            </button>
          ) : (
            <button
              type="button"
              className="primary-button onboarding-next"
              onClick={() => setStep(step === 1 ? 2 : 3)}
            >
              Lanjut <RiArrowRightLine aria-hidden="true" />
            </button>
          ))}
        {phase === "failed" && (
          <button
            type="button"
            className="primary-button onboarding-next"
            onClick={() => setPhase("preparing")}
          >
            <RiRefreshLine aria-hidden="true" />
            Coba lagi
          </button>
        )}
        {phase === "preparing" && (
          <p className="preparation-footer">Semua disiapkan di perangkatmu.</p>
        )}
        {phase === "ready" && (
          <p className="preparation-footer">Membuka Kata…</p>
        )}
      </footer>
    </main>
  )
}
