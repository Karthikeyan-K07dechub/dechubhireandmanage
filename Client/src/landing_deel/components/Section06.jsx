import React, { useMemo, useState } from "react";

const stories = [
  {
    company: "Tanishq",
    summary: "Watch how Tanishq presents its customer story and brand experience through a polished video showcase.",
    href: "https://www.youtube.com/watch?v=I1ZoIkiNRQc",
    embedUrl: "https://www.youtube-nocookie.com/embed/I1ZoIkiNRQc",
  },
  {
    company: "Titan",
    summary: "Explore Titan's video story and how the brand communicates trust, scale, and customer connection.",
    href: "https://www.youtube.com/watch?v=pTgCCnCMb8w",
    embedUrl: "https://www.youtube-nocookie.com/embed/pTgCCnCMb8w",
  },
  {
    company: "Wildcraft",
    summary: "See Wildcraft's customer-facing video and the way the brand brings its product story to life on screen.",
    href: "https://www.youtube.com/watch?v=hZqaKCEIxUM",
    embedUrl: "https://www.youtube-nocookie.com/embed/hZqaKCEIxUM",
  },
  {
    company: "Fastrack",
    summary: "Watch Fastrack's energetic brand video and how it speaks to a modern, fast-moving customer audience.",
    href: "https://www.youtube.com/watch?v=EK63GyM8Dew",
    embedUrl: "https://www.youtube-nocookie.com/embed/EK63GyM8Dew",
  },
  {
    company: "Mia",
    summary: "Discover Mia's brand video and the visual storytelling approach used to connect with customers.",
    href: "https://www.youtube.com/watch?v=RLwzZ_vxUTw",
    embedUrl: "https://www.youtube-nocookie.com/embed/RLwzZ_vxUTw",
  },
];

function Section06() {
  const [activeIndex, setActiveIndex] = useState(0);

  const renderedStories = useMemo(
    () =>
      stories.map((story, index) => {
        const distance = Math.abs(index - activeIndex);
        const isActive = index === activeIndex;
        return {
          ...story,
          isActive,
          className: isActive
            ? "opacity-100 blur-0 scale-100"
            : distance === 1
              ? "opacity-50 blur-sm scale-[0.95]"
              : "opacity-20 blur-sm scale-[0.9]",
        };
      }),
    [activeIndex],
  );

  return (
    <div style={{ display: "contents" }}>
      <div className="video-carousel w-full bg-white" style={{ marginTop: "56px" }}>
        <div className="w-full mx-auto py-xl md:py-big">
          <div className="max-w-container mx-auto w-full px-xs md:px-lg flex flex-col gap-xxxs md:gap-xxs mb-sm md:mb-xxl items-start">
            <p className="m-0 text-tertiary overline-large-medium text-content-secondary">TESTIMONIALS</p>
            <div className="w-full flex flex-col md:flex-row gap-xxs md:gap-sm md:items-center justify-between">
              <h2 className="text-balance m-0 heading-h2 text-content-primary" style={{ marginBottom: "24px" }}>
                Our customers
              </h2>
              <p className="m-0 text-tertiary paragraph-large max-w-[444px] text-content-secondary" style={{ marginBottom: "24px" }}>
                Discover customer videos and brand stories from the companies we work with.
              </p>
            </div>
          </div>

          <div className="revamp-carousel w-full h-full flex flex-col gap-xxs md:gap-md relative [&_.items]:max-w-[888px] max-sm:[&_.items]:w-[90%]!">
            <div className="revamp-carousel-wrapper w-full h-full flex overflow-x-auto snap-x snap-mandatory [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              {renderedStories.map((story, index) => (
                <div
                  key={story.company}
                  className={`items flex-none shrink-0 relative snap-center transition-all duration-300 px-xxs md:px-sm ${index === 0 ? "sm-old:ml-[30%]" : ""} ${index === renderedStories.length - 1 ? "sm-old:mr-[30%]" : ""}`}
                  style={{ width: "80%", flexShrink: "0" }}
                  onClick={() => setActiveIndex(index)}
                >
                  <div className={`w-full h-full min-h-[350px] relative overflow-hidden transition-all duration-300 ${story.className}`}>
                    <div>
                      <div className="w-full flex flex-col gap-md">
                        <div className="relative w-full h-[250px] sm-old:h-[350px] md:h-[500px] bg-neutral-900 rounded-xl overflow-hidden">
                          <iframe
                            src={story.embedUrl}
                            title={`${story.company} customer video`}
                            className="w-full h-full rounded-b-none border-0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            referrerPolicy="strict-origin-when-cross-origin"
                            allowFullScreen
                          />
                        </div>

                        <div className="w-full flex flex-col gap-xxs">
                          <h3 className="m-0 heading-h5 text-content-primary">{story.company}</h3>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="w-full pagination-container">
              <div className="flex justify-center items-center gap-1 mt-md md:mt-xxl">
                {stories.map((story, index) => (
                  <button
                    key={story.company}
                    className="w-[24px] h-[24px] flex items-center justify-center p-0 m-0 bg-transparent hover:bg-transparent border-0 rounded-full transition-all duration-200"
                    aria-label={`Go to item ${index + 1}`}
                    aria-current={activeIndex === index}
                    type="button"
                    onClick={() => setActiveIndex(index)}
                  >
                    {activeIndex === index ? (
                      <div className="w-[12px] h-[12px] border border-purple-750 rounded-full p-[2px] flex items-center justify-center transition-all duration-200 shadow-[0px_16px_32px_0px_rgba(27,27,27,0.16),0px_2px_32px_0px_rgba(27,27,27,0.05)]">
                        <div className="w-full h-full rounded-full bg-surface-brand-purple-02" />
                      </div>
                    ) : (
                      <div className="w-[8px] h-[8px] border-0 bg-content-disabled rounded-full p-[2px] hover:scale-110 flex items-center justify-center transition-all duration-200 shadow-[0px_16px_32px_0px_rgba(27,27,27,0.16),0px_2px_32px_0px_rgba(27,27,27,0.05)]" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Section06;
