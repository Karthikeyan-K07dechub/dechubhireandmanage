import React from "react";
import { useEffect, useState } from "react";

const cards = [
  {
    title: "Deel Payroll",
    description: "Local and global payroll, your way.",
    href: "/solutions/payroll/",
    image: "/deel-assets/images/website-media.deel.com/Go_live_quickly_with_US_payroll_cba17cce08-235ee26e.webp",
    alt: "Go live quickly with US payroll",
  },
  {
    title: "Deel HR",
    description: "One HR system for every worker.",
    href: "/solutions/hr/",
    image: "/deel-assets/images/website-media.deel.com/HR_9158c8c5a0-514f2ca4.webp",
    alt: "Deel HR",
  },
  {
    title: "Deel IT",
    description: "Devices and support, anywhere.",
    href: "/solutions/it/",
    image: "/deel-assets/images/website-media.deel.com/Screenshot_2026_07_07_at_10_38_29_a_m_0091974c43-d0d00c13.png",
    alt: "Deel IT",
  },
  {
    title: "Deel Benefits",
    description: "Easily set up plans, handle enrollment, sync deductions, and more.",
    href: "/solutions/benefits/",
    image: "/deel-assets/images/website-media.deel.com/Benefits_5f8ee9bbeb-e54fb98b.webp",
    alt: "Deel Benefits",
  },
  {
    title: "Deel Hire",
    description: "Hire anywhere in days, fully compliant.",
    href: "/solutions/hire/",
    image: "/deel-assets/images/website-media.deel.com/1_66074e871e-8a936a5d.webp",
    alt: "Deel Hire",
  },
  {
    title: "Deel Mobility",
    description: "Visas handled in-house, end to end.",
    href: "/solutions/mobility/",
    image: "/deel-assets/images/website-media.deel.com/Mobility_0d0fdddfac-ccc45f15.webp",
    alt: "Deel Mobility",
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
        paddingTop: "64px",
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
            WHAT DEEL DOES
          </p>
          <h2
            className="heading-h2 text-wrap"
            style={{
              margin: "0 0 20px",
            }}
          >
            The global people platform
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
                  margin: "0 0 24px",
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
                  paddingTop: "16px",
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
