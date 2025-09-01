"use client";
import Image from "next/image";
import styles from "./page.module.css";
import styled from "styled-components";
import { theme } from "../../styles/theme";
import { useRouter } from "next/navigation";
// --- Responsive helpers
const breakpoints = {
  lg: "1024px",
  md: "768px",
  sm: "480px",
};

const PagePad = "clamp(16px, 5vw, 128px)";

const StyledPage = styled.div``;

const StyledHeader = styled.header`
  background-color: ${theme.colors.card};
  padding: 14px ${PagePad};
  border-bottom: 1px solid ${theme.colors.border};
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;

  div {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 8px;

    img {
      background-color: ${theme.colors.accent};
      padding: 4px;
      width: 28px;
      height: 28px;
      border-radius: 8px;
      object-fit: contain;
    }
  }
`;

const StyledHeaderLogoText = styled.h1`
  font-weight: bold;
  font-size: clamp(16px, 3.8vw, 18px);
`;

const StyledSignInButton = styled.button`
  padding: 10px 16px;
  border-radius: 8px;
  border: 1px solid ${theme.colors.border};
  min-width: 44px;
  &:hover {
    cursor: pointer;
  }
`;

const StyledHero = styled.section`
  background-color: ${theme.colors.background};
  padding: 64px ${PagePad};
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 32px;

  @media (max-width: ${breakpoints.md}) {
    flex-direction: column;
    text-align: center;
    padding: 40px ${PagePad};
  }
`;

const StyledHeroInfo = styled.section`
  font-weight: bold;
  width: 45%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  gap: 24px;

  h2 {
    font-size: clamp(28px, 6vw, 48px);
    line-height: 1.1;
  }
  p {
    font-size: clamp(15px, 2.7vw, 18px);
    font-weight: 400;
  }

  @media (max-width: ${breakpoints.md}) {
    width: 100%;
    align-items: center;
  }
`;

const StyledCTAButton = styled.button`
  background-color: ${theme.colors.accent};
  padding: 12px 24px;
  border-radius: 12px;
  border: none;
  font-weight: 600;
  font-size: 18px;
  cursor: pointer;

  @media (max-width: ${breakpoints.sm}) {
    width: 100%;
    font-size: 16px;
  }
`;

const StyledHeroImage = styled.section`
  width: 45%;
  img {
    display: block;
    width: 100%;
    height: auto;
    border-radius: 10px;
    border: 1px solid ${theme.colors.border};
    box-shadow: 0px 10px 15px -3px #0000001a;
  }

  @media (max-width: ${breakpoints.md}) {
    width: 100%;
  }
`;

const SectionBase = styled.section`
  padding: 64px ${PagePad};
  text-align: center;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 16px;

  h3 {
    font-size: clamp(22px, 4.5vw, 28px);
  }
  p {
    font-size: clamp(14px, 3.5vw, 16px);
  }
`;

const StyledHowItWorks = styled(SectionBase)`
  background-color: ${theme.colors.card};
`;

const StyledHowItWorksCardSection = styled.div`
  /* Switch to responsive grid for cards */
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: clamp(16px, 5vw, 64px);
  width: 100%;
  margin-top: 32px;

  @media (max-width: ${breakpoints.lg}) {
    grid-template-columns: repeat(2, 1fr);
  }
  @media (max-width: ${breakpoints.md}) {
    grid-template-columns: 1fr;
  }
`;

const StyledHowItWorksCard = styled.div`
  border: 1px solid ${theme.colors.border};
  border-radius: 12px;
  padding: clamp(24px, 5vw, 48px);
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 18px;
  justify-content: center;
  align-items: center;

  h3 {
    font-size: clamp(18px, 4.5vw, 24px);
  }
  p {
    font-size: clamp(14px, 3.6vw, 16px);
  }
`;

const StyledHowItWorksCardImageWrapper = styled.div`
  padding: 16px;
  border-radius: 100%;
  background-color: ${theme.colors.accent};
  display: flex;
  justify-content: center;
  align-items: center;
  img {
    width: 32px;
    height: 32px;
    object-fit: contain;
  }
`;

const StyledTakeItWithYou = styled(SectionBase)`
  background-color: ${theme.colors.background};
`;

const StyledTakeItWithYouCardSection = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: clamp(16px, 5vw, 64px);
  width: 100%;
  margin-top: 32px;

  @media (max-width: ${breakpoints.lg}) {
    grid-template-columns: repeat(2, 1fr);
  }
  @media (max-width: ${breakpoints.md}) {
    grid-template-columns: 1fr;
  }
`;

const StyledTakeItWithYouCard = styled.div`
  border-radius: 12px;
  padding: clamp(24px, 5vw, 48px);
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 18px;
  justify-content: center;
  align-items: center;

  h3 {
    font-size: clamp(15px, 3.8vw, 16px);
  }
  p {
    font-size: clamp(12px, 3.2vw, 12px);
  }
`;

// --- Device badges
const DeviceBase = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${theme.colors.accent};
  border: 1px solid ${theme.colors.border};
  box-shadow: 0px 10px 15px -3px #0000001a;
  position: relative;
`;

const KeychainBadge = styled(DeviceBase)`
  width: 84px;
  aspect-ratio: 1 / 1; /* square */
  border-radius: 12px;

  @media (max-width: ${breakpoints.sm}) {
    width: 72px;
  }
`;

const WristbandBadge = styled(DeviceBase)`
  width: 200px;
  height: 56px; /* elongated band */
  border-radius: 9999px;

  @media (max-width: ${breakpoints.sm}) {
    width: 180px;
    height: 48px;
  }
`;

const CardBadge = styled(DeviceBase)`
  width: 160px;
  height: 100px; /* card rectangle */
  border-radius: 12px;

  @media (max-width: ${breakpoints.sm}) {
    width: 140px;
    height: 88px;
  }
`;

const QRImg = styled.img`
  width: 42px;
  aspect-ratio: 1 / 1;
  height: auto;
  object-fit: contain;
  background: ${theme.colors.accent};
  padding: 4px;
  border-radius: 6px;

  @media (max-width: ${breakpoints.sm}) {
    width: 36px;
  }
`;

const StyledFooter = styled.footer`
  background-color: ${theme.colors.primary};
  color: ${theme.colors.background};
  padding: 64px ${PagePad};
  text-align: center;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 16px;

  h4 {
    font-size: clamp(18px, 4.5vw, 24px);
  }
  p {
    font-size: clamp(14px, 3.5vw, 16px);
  }

  div {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 8px;

    img {
      background-color: ${theme.colors.accent};
      padding: 4px;
      width: 28px;
      height: 28px;
      border-radius: 8px;
      object-fit: contain;
    }
  }
`;

export default function Home() {
  const router = useRouter();
  return (
    <StyledPage className={styles.page}>
      <StyledHeader>
        <div>
          <img src="security.png" alt="Shield icon" />
          <StyledHeaderLogoText>Beacon</StyledHeaderLogoText>
        </div>
        <StyledSignInButton
          onClick={() => {
            router.push("/login");
          }}
        >
          Sign In
        </StyledSignInButton>
      </StyledHeader>

      <StyledHero>
        <StyledHeroInfo>
          <h2>Never stranded without your contacts.</h2>
          <p>
            Store your emergency contacts safely and access them from any
            device. Generate a QR code for keychains, wristbands, or cards so
            help is always within reach.
          </p>
          <StyledCTAButton
            onClick={() => {
              router.push("/register");
            }}
          >
            Get Started Free
          </StyledCTAButton>
        </StyledHeroInfo>

        <StyledHeroImage>
          {/* If you prefer next/image, swap the tag below to <Image fill ... /> with a wrapper */}
          <img src="heroImage.png" alt="App preview" />
        </StyledHeroImage>
      </StyledHero>

      <StyledHowItWorks>
        <h3>How It Works</h3>
        <p>
          Three simple steps to ensure you are never without your emergency
          contacts
        </p>

        <StyledHowItWorksCardSection>
          <StyledHowItWorksCard>
            <StyledHowItWorksCardImageWrapper>
              <img src="user.png" alt="User icon" />
            </StyledHowItWorksCardImageWrapper>
            <h3>Add Your Contacts</h3>
            <p>
              Sign up and add your emergency contacts with names, relationships,
              and phone numbers.
            </p>
          </StyledHowItWorksCard>

          <StyledHowItWorksCard>
            <StyledHowItWorksCardImageWrapper>
              <img src="qr-code.png" alt="QR code icon" />
            </StyledHowItWorksCardImageWrapper>
            <h3>Get Your QR Code</h3>
            <p>
              Generate your personal QR code that links to your emergency
              contact information.
            </p>
          </StyledHowItWorksCard>

          <StyledHowItWorksCard>
            <StyledHowItWorksCardImageWrapper>
              <img src="iphone.png" alt="Phone icon" />
            </StyledHowItWorksCardImageWrapper>
            <h3>Access Anytime</h3>
            <p>
              Access your contacts from any device or let others scan your QR
              code in emergencies.
            </p>
          </StyledHowItWorksCard>
        </StyledHowItWorksCardSection>
      </StyledHowItWorks>

      <StyledTakeItWithYou>
        <h3>Take It With You</h3>
        <p>Print your QR code on accessories that you always carry</p>

        <StyledTakeItWithYouCardSection>
          <StyledTakeItWithYouCard>
            <KeychainBadge>
              <QRImg src="qr-code.png" alt="QR code for keychain" />
            </KeychainBadge>
            <h3>Keychain</h3>
            <p>Attach to your keys for daily carry</p>
          </StyledTakeItWithYouCard>

          <StyledTakeItWithYouCard>
            <WristbandBadge>
              <QRImg src="qr-code.png" alt="QR code for wristband" />
            </WristbandBadge>
            <h3>Wristband</h3>
            <p>Wear it during activities or travel</p>
          </StyledTakeItWithYouCard>

          <StyledTakeItWithYouCard>
            <CardBadge>
              <QRImg src="qr-code.png" alt="QR code for wallet card" />
            </CardBadge>
            <h3>Wallet Card</h3>
            <p>Fits perfectly in your wallet</p>
          </StyledTakeItWithYouCard>
        </StyledTakeItWithYouCardSection>
      </StyledTakeItWithYou>

      <StyledFooter>
        <div>
          <img src="security.png" alt="Shield icon" />
          <h4>Beacon</h4>
        </div>
        <p>Your light in an emergency.</p>
      </StyledFooter>
    </StyledPage>
  );
}
