const dither = <span className="ascii-dither-overlay text-[10px]" aria-hidden="true" hidden />

export function Quests() {
  return (
    <section className="quests" aria-labelledby="quests-title">
      <div className="quests__layout">
        <h2 id="quests-title" className="quests__title" data-quest-line>
          <span data-quest-copy>My Quests</span>
          {dither}
        </h2>

        <article className="quest" aria-labelledby="hyperlocal-quest">
          {['tl', 'tr', 'bl', 'br'].map((corner) => (
            <svg key={corner} className={`quest__corner quest__corner--${corner}`} viewBox="0 0 32 32" aria-hidden="true">
              <path d="M1 31V14H5V10H9V6H13V2H31M6 25V16H10V12H14V8H25" fill="none" stroke="currentColor" />
              <path d="M5 2v6M2 5h6" stroke="currentColor" />
            </svg>
          ))}

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

          <div className="quest__meta" data-quest-line>
            <div className="quest__meta-copy" data-quest-copy>
              <a className="quest__details" href="#" onClick={(event) => {
                if (event.currentTarget.getAttribute('href') === '#') event.preventDefault()
              }}>Quest Details <span aria-hidden="true">↗</span></a>
              <dl className="quest__reward">
                <dt>Quest Rewards</dt>
                <dd>Lots of XP</dd>
              </dl>
            </div>
            {dither}
          </div>

          <div className="quest__choices" data-quest-line>
            <div className="quest__choices-copy" data-quest-copy aria-hidden="true">
              <span className="quest__choice quest__choice--accepted">
                <svg className="quest__checkbox" viewBox="0 0 16 16" fill="none">
                  <rect x="1.5" y="1.5" width="13" height="13" stroke="currentColor" />
                  <path className="quest__check" d="m4 8 3 3 5-6" pathLength="1" stroke="currentColor" strokeWidth="1.6" />
                </svg>
                Say no more
              </span>
              <span className="quest__choice">[ Huh? ]</span>
            </div>
            {dither}
          </div>
          <p className="sr-only">Quest accepted: Say no more.</p>
        </article>
      </div>
    </section>
  )
}
