import React from "react";
import { useEffect, useState } from "react";

const cards = [
  {
    title: "Dechub-Bridge Match",
    description: "AI skill matching for business-ready talent.",
    href: "/solutions/payroll/",
    image: "/deel-assets/images/website-media.deel.com/Go_live_quickly_with_US_payroll_cba17cce08-235ee26e.webp",
    alt: "Go live quickly with US payroll",
  },
  {
    title: "Dechub-Bridge Deploy",
    description: "Pre-vetted talent delivered in 60 minutes.",
    href: "/solutions/hr/",
    image: "/deel-assets/images/website-media.deel.com/HR_9158c8c5a0-514f2ca4.webp",
    alt: "Dechub-Bridge HR",
  },
  {
    title: "Dechub-Bridge Teams",
    description: "Hire one expert or launch a full delivery team.",
    href: "/solutions/it/",
    image: "/deel-assets/images/website-media.deel.com/dechub-bridge-team.png",
    alt: "Dechub-Bridge IT",
  },
  {
    title: "Dechub-Bridge Ops",
    description: "Payroll, compliance, and workforce operations in one place.",
    href: "/solutions/benefits/",
    image: "/deel-assets/images/website-media.deel.com/benefits.png",
    alt: "Dechub-Bridge Benefits",
  },
  {
    title: "Enterprise Scale",
    description: "Built for fast-moving teams and growing businesses.",
    href: "/solutions/hire/",
    image: "/deel-assets/images/website-media.deel.com/enterprise-scale.png",
    alt: "Dechub-Bridge Hire",
    compactSpacing: true,
  },
  {
    title: "Project Success",
    description: "Bridge stays involved beyond the hire.",
    href: "/solutions/mobility/",
    image: "/deel-assets/images/website-media.deel.com/project-success.png",
    alt: "Dechub-Bridge Mobility",
  },
];

function Section03() {
  const [columns, setColumns] = useState(3);

  useEffect(() => {
    const updateColumns = () => {
      if (window.innerWidth < 768) {
        setColumns(1);
        return;
      }

      if (window.innerWidth < 1024) {
        setColumns(2);
        return;
      }

      setColumns(3);
    };

    updateColumns();
    window.addEventListener("resize", updateColumns);
    return () => window.removeEventListener("resize", updateColumns);
  }, []);

  return (
    <section
      className="w-full bg-white"
      style={{
        paddingTop: "0px",
        paddingBottom: "64px",
        paddingLeft: "24px",
        paddingRight: "24px",
      }}
    >
      <div
        style={{
          maxWidth: "1312px",
          margin: "0 auto",
          width: "100%",
        }}
      >
        <div
          style={{
            maxWidth: "1312px",
            margin: "0 auto 48px",
            width: "100%",
          }}
        >
          <p
            className="text-tertiary overline-large-medium uppercase"
            style={{
              margin: "0 0 12px",
            }}
          >
            WHAT DECHUB-BRIDGE DOES
          </p>
          <h2
            className="heading-h2 text-wrap"
            style={{
              margin: "0 0 20px",
            }}
          >
            Deploy talent faster, smarter, and with confidence
          </h2>
        </div>

        <div
          style={{
            maxWidth: "1312px",
            margin: "0 auto",
            width: "100%",
            display: "grid",
            gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
            gap: "20px",
          }}
        >
          {cards.map((card) => (
            <a
              key={card.title}
              href={card.href}
              className="group"
              style={{
                position: "relative",
                display: "flex",
                flexDirection: "column",
                width: "100%",
                minHeight: "438px",
                padding: "28px",
                borderRadius: "16px",
                background: "#f7f5f2",
                textDecoration: "none",
              }}
            >
              <h3
                className="heading-h5 !text-primary"
                style={{
                  margin: "0 0 12px",
                }}
              >
                {card.title}
              </h3>
              <p
                className="text-tertiary paragraph-xxlarge"
                style={{
                  margin: card.compactSpacing ? "0" : "0 0 24px",
                }}
              >
                {card.description}
              </p>
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginTop: "auto",
                  paddingTop: card.compactSpacing ? "0" : "16px",
                }}
              >
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "center",
                  }}
                >
                  <img
                    src={card.image}
                    alt={card.alt}
                    loading="lazy"
                    style={{
                      width: "auto",
                      height: "auto",
                      maxWidth: "100%",
                      maxHeight: "310px",
                      objectFit: "contain",
                      display: "block",
                    }}
                  />
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Section03;
