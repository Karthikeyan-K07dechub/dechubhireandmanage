import React from "react";
import heroBackground from "../../pages/assets/hero-image.png";
import paperRocket from "../../pages/assets/paper-rocket.png";

const PRIMARY_ACTIONS = [
  "Hire anywhere",
  "Run payroll",
];

const SECONDARY_ACTIONS = [
  "Secure\nvisas",
  "Manage\nHR & people",
  "Ship\nequipment",
];

function HeroOption({ label, ariaLabel }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked="false"
      aria-label={ariaLabel ?? label.replace("\n", " ")}
      className="deel-hero__option"
    >
      <span aria-hidden="true" className="deel-hero__option-check" />
      <span className="deel-hero__option-label">{label}</span>
    </button>
  );
}

function Section01() {
  return (
    <section className="deel-hero-section">
      <div className="deel-hero-shell">
        <div className="deel-hero">
          <img
            src={heroBackground}
            alt=""
            aria-hidden="true"
            className="deel-hero__bg"
          />
          <div className="deel-hero__overlay" />
          <div className="deel-hero__glow" />
          <div className="deel-hero__rocket-layer" aria-hidden="true">
            <div className="deel-hero__rocket-trail" />
            <img
              src={paperRocket}
              alt=""
              className="deel-hero__rocket"
            />
          </div>

          <div className="deel-hero__inner">
            <div className="deel-hero__content">
              <h1 className="deel-hero__title">
                Hire, manage, pay, & equip anyone, anywhere.
              </h1>

              <div className="deel-hero__panel">
                <p className="deel-hero__prompt">
                  What would you like to do with Dechub Bridge?
                </p>

                <div
                  role="group"
                  aria-label="What would you like to do with Deel?"
                  className="deel-hero__option-groups"
                >
                  <div className="deel-hero__option-grid deel-hero__option-grid--primary">
                    {PRIMARY_ACTIONS.map((label) => (
                      <HeroOption key={label} label={label} />
                    ))}
                  </div>

                  <div className="deel-hero__option-grid deel-hero__option-grid--secondary">
                    {SECONDARY_ACTIONS.map((label) => (
                      <HeroOption key={label} label={label} />
                    ))}
                  </div>
                </div>

                <div className="deel-hero__cta-wrap">
                  <button type="button" className="deel-hero__cta">
                    Book a demo
                  </button>
                </div>

                <div className="deel-hero__reviews">
                  <div className="deel-hero__reviews-row">
                    <div className="deel-hero__review-item">
                      <img
                        alt="G2 logo"
                        loading="lazy"
                        width="25"
                        height="25"
                        decoding="async"
                        sizes="25px"
                        srcSet="/deel-assets/images/website-media.deel.com/g2_logo.0a5793d3-1b608abd.svg 16w, /deel-assets/images/website-media.deel.com/g2_logo.0a5793d3-1b608abd.svg 32w, /deel-assets/images/website-media.deel.com/g2_logo.0a5793d3-1b608abd.svg 48w, /deel-assets/images/website-media.deel.com/g2_logo.0a5793d3-1b608abd.svg 64w, /deel-assets/images/website-media.deel.com/g2_logo.0a5793d3-1b608abd.svg 96w, /deel-assets/images/website-media.deel.com/g2_logo.0a5793d3-1b608abd.svg 128w, /deel-assets/images/website-media.deel.com/g2_logo.0a5793d3-1b608abd.svg 256w, /deel-assets/images/website-media.deel.com/g2_logo.0a5793d3-1b608abd.svg 384w, /deel-assets/images/website-media.deel.com/g2_logo.0a5793d3-1b608abd.svg 640w"
                        src="/deel-assets/images/website-media.deel.com/g2_logo.0a5793d3-1b608abd.svg"
                      />
                      <div className="deel-hero__review-copy">
                        <span className="deel-hero__review-strong">4.8/5</span>
                        <span className="deel-hero__review-divider">|</span>
                        <span>14K+ Reviews</span>
                      </div>
                    </div>

                    <div className="deel-hero__review-item deel-hero__review-item--trustpilot">
                      <img
                        alt=""
                        loading="lazy"
                        width="29"
                        height="28"
                        decoding="async"
                        sizes="29px"
                        srcSet="/deel-assets/images/website-media.deel.com/trustpilot-star.aadabb5b-db9b285e.svg 16w, /deel-assets/images/website-media.deel.com/trustpilot-star.aadabb5b-db9b285e.svg 32w, /deel-assets/images/website-media.deel.com/trustpilot-star.aadabb5b-db9b285e.svg 48w, /deel-assets/images/website-media.deel.com/trustpilot-star.aadabb5b-db9b285e.svg 64w, /deel-assets/images/website-media.deel.com/trustpilot-star.aadabb5b-db9b285e.svg 96w, /deel-assets/images/website-media.deel.com/trustpilot-star.aadabb5b-db9b285e.svg 128w, /deel-assets/images/website-media.deel.com/trustpilot-star.aadabb5b-db9b285e.svg 256w, /deel-assets/images/website-media.deel.com/trustpilot-star.aadabb5b-db9b285e.svg 384w, /deel-assets/images/website-media.deel.com/trustpilot-star.aadabb5b-db9b285e.svg 640w"
                        src="/deel-assets/images/website-media.deel.com/trustpilot-star.aadabb5b-db9b285e.svg"
                      />
                      <span className="deel-hero__review-strong">4.8/5</span>
                      <span className="deel-hero__review-divider">|</span>
                      <span>8K+ Reviews</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Section01;
