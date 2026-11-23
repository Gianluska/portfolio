const dither = <span className="ascii-dither-overlay text-[10px]" aria-hidden="true" hidden />

const corners = ['tl', 'tr', 'bl', 'br'] as const

function QuestFrame() {
  return (
    <div className="quest__frame" aria-hidden="true">
      {corners.map((corner) => (
        <svg key={corner} className={`quest__corner quest__corner--${corner}`} viewBox="0 0 48 48" fill="none">
          <path d="M2 48V22H6V17H11V12H16V7H21V2H48M7 48V24H11V19H16V14H21V9H24V7H48" stroke="currentColor" />
          <path d="M9 1v4L5 9H1M13 2v5L7 13H2M4 0v4H0" stroke="currentColor" />
        </svg>
      ))}
      {(['left', 'right'] as const).map((side) => (
        <svg key={side} className={`quest__vine quest__vine--${side}`} viewBox="0 0 100 100" fill="none">
          <path d="M4 92c-4-18 4-32 15-34 11-2 19 7 16 17-2 6-12 6-12-1 0-4 5-5 6-2M19 58C3 47 8 29 21 26c15-4 23 12 15 20-6 6-14 0-11-5 2-3 7-2 6 2M11 36C16 18 32 10 49 13s31 10 46 0" stroke="currentColor" />
          <path d="M48 13c-1 10 3 15 10 17 1-9-3-14-10-17ZM68 17c2 7 8 9 15 8-3-6-8-9-15-8ZM77 17c4-7 11-9 17-8-3 5-9 8-17 8ZM5 86c7-2 13 2 13 8-7-1-11-3-13-8Z" fill="currentColor" />
        </svg>
      ))}
    </div>
  )
}

export function Quests() {
  return (
    <section className="quests" aria-labelledby="quests-title">
      <article className="quest" aria-labelledby="hyperlocal-quest">
        <QuestFrame />
        <div className="quests__plaque quest__plate">
          <h2 id="quests-title" className="quests__title" data-quest-line>
            <span data-quest-copy>My Quests</span>
            {dither}
          </h2>
        </div>

        <div className="quest__issuer" data-quest-line>
          <div data-quest-copy>
            <img className="quest__logo" src="/art/hyperlocal.svg" width="32" height="32" alt="" />
            <p>Hyperlocal</p>
          </div>
          {dither}
        </div>

        <h3 id="hyperlocal-quest" className="quest__prompt" data-quest-line>
          <span data-quest-copy>Hey dude! Do you want to build a digital bank from scratch?</span>
          {dither}
        </h3>

        <div className="quest__rule" aria-hidden="true"><span>◇</span></div>

        <div className="quest__details-row" data-quest-line>
          <div data-quest-copy>
            <a className="quest__details quest__plate" href="#" onClick={(event) => {
              if (event.currentTarget.getAttribute('href') === '#') event.preventDefault()
            }}><span className="quest__flanked">Quest Details</span></a>
          </div>
          {dither}
        </div>

        <div className="quest__rewards" data-quest-line>
          <dl className="quest__reward" data-quest-copy>
            <dt><span className="quest__flanked">Quest Rewards</span></dt>
            <dd className="quest__plate"><span>Lots of XP</span></dd>
          </dl>
          {dither}
        </div>

        <div className="quest__choices" data-quest-line>
          <div className="quest__choices-copy" data-quest-copy aria-hidden="true">
            <span className="quest__choice quest__choice--accepted quest__plate">
              <span className="quest__reply">
                <svg className="quest__checkbox" viewBox="0 0 16 16" fill="none">
                  <rect x="1.5" y="1.5" width="13" height="13" stroke="currentColor" />
                  <path className="quest__check" d="m4 8 3 3 5-6" pathLength="1" stroke="currentColor" strokeWidth="1.6" />
                </svg>
                Say no more
              </span>
            </span>
            <span className="quest__choice quest__plate"><span className="quest__reply">Huh?</span></span>
          </div>
          {dither}
        </div>
        <p className="sr-only">Quest accepted: Say no more.</p>
      </article>
    </section>
  )
}
