import React from "react";

const logoRows = [
  [
    "/deel-assets/images/website-media.deel.com/logo_investor_neo_fd6a4b0bf1-56add72b.svg",
    "/deel-assets/images/website-media.deel.com/logo_investor_emerson_collective_e323c76cee-365ebe97.svg",
    "/deel-assets/images/website-media.deel.com/logo_investor_spark_capital_857a9a1fac-475b4913.svg",
    "/deel-assets/images/website-media.deel.com/muji_a588e76130-79c99911.svg",
    "/deel-assets/images/website-media.deel.com/Logoki_ba7b794e12-19a34463.svg",
    "/deel-assets/images/website-media.deel.com/Balenciaga_Logo_3c70c251ee-4716d7d1.svg",
    "/deel-assets/images/website-media.deel.com/Canva_Logo_1_90c23958f7-58831325.svg",
    "/deel-assets/images/website-media.deel.com/hm_f015e3fc5e-df43edbf.svg",
    "/deel-assets/images/website-media.deel.com/Ericsson_logo_2_15f0a199be-afc8b63f.svg",
  ],
  [
    "/deel-assets/images/website-media.deel.com/re_logo_b11ff3c938-a965a859.svg",
    "/deel-assets/images/website-media.deel.com/Door_Dash_Logo_e52471ae77-3e414f35.svg",
    "/deel-assets/images/website-media.deel.com/logo_KLM_2dcf79f5c9-ac109213.svg",
    "/deel-assets/images/website-media.deel.com/Lucid_Motors_logo_289a758b49-01664677.svg",
    "/deel-assets/images/website-media.deel.com/puma_logo_8574e3d454-a88b84ed.svg",
    "/deel-assets/images/website-media.deel.com/lockhead_logo_aac9270f83-5a48a4b4.svg",
    "/deel-assets/images/website-media.deel.com/Zillow_logo_1_5c75d27ffc-66b46f3e.svg",
    "/deel-assets/images/website-media.deel.com/linkedin_logo_4a30bc2ea7-c6addbce.svg",
    "/deel-assets/images/website-media.deel.com/rol_8afbc30081-d2317192.svg",
  ],
];

function LogoMarquee({ logos, duration, reverse = false }) {
  const marqueeLogos = [...logos, ...logos];

  return (
    <div className="w-full overflow-hidden">
      <div
        className="flex w-max items-center gap-x-[34px] md:gap-x-[64px]"
        style={{
          animation: `${reverse ? "deel-logo-scroll-reverse" : "logo-scroll"} ${duration}s linear infinite`,
        }}
      >
        {marqueeLogos.map((src, index) => (
          <img
            key={`${src}-${index}`}
            src={src}
            alt=""
            loading="lazy"
            className="h-[26px] w-auto shrink-0 object-contain opacity-55 grayscale md:h-[42px]"
          />
        ))}
      </div>
    </div>
  );
}

function Section02() {
  return (
    <section className="logo-stripe-standard-wrapper w-full bg-surface-white px-4 pt-[42px] pb-[78px] md:px-8 md:pt-[64px] md:pb-[104px]">
      <div className="mx-auto flex max-w-[1704px] flex-col items-center">
        <p
          className="m-0 text-center font-inter text-[14px] font-semibold uppercase tracking-[0.08em] text-[#5f6470] md:text-[17px]"
          style={{ marginBottom: "40px" }}
        >
          Trusted by 40,000+ companies from startups to enterprise
        </p>

        <div className="flex w-full flex-col gap-[28px] md:gap-[36px]">
          <LogoMarquee logos={logoRows[0]} duration={34} />
          <LogoMarquee logos={logoRows[1]} duration={38} reverse />
        </div>
      </div>
    </section>
  );
}

export default Section02;
