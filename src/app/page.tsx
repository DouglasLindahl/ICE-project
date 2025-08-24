"use client";
import Image from "next/image";
import styles from "./page.module.css";
import styled from "styled-components";
import { theme } from "../../styles/theme";

const StyledPage = styled.div``;

const StyledHeader = styled.header`
  background-color: ${theme.colors.card};
  padding: 14px 128px 14px 128px;
  border-bottom: 1px solid ${theme.colors.border};
  display: flex;
  justify-content: space-between;
  align-items: center;
  div {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 6px;
    img {
      background-color: ${theme.colors.accent};
      padding: 4px;
      width: 28px;
      border-radius: 8px;
    }
  }
`;

const StyledHeaderLogoText = styled.h1`
  font-weight: bold;
  font-size: 18px;
`;

const StyledSignInButton = styled.button`
  padding: 8px 16px 8px 16px;
  border-radius: 8px;
  border: 1px solid ${theme.colors.border};
`;

const StyledHero = styled.section`
  background-color: ${theme.colors.background};
  padding: 64px 128px 64px 128px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const StyledHeroInfo = styled.section`
  font-weight: bold;
  width: 45%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: start;
  gap: 24px;
  h2 {
    font-size: 48px;
  }
  p {
    font-size: 18px;
    font-weight: 100;
  }
`;

const StyledCTAButton = styled.button`
  background-color: ${theme.colors.accent};
  padding: 12px 24px 12px 24px;
  border-radius: 12px;
  border: none;
  font-weight: 500;
  font-size: 18px;
`;

const StyledHeroImage = styled.section`
  font-size: 32px;
  font-weight: bold;
  width: 45%;
  height: 100%;
  img {
    border-radius: 10px;
    border: 1px solid ${theme.colors.border};
    box-shadow: 0px 10px 15px -3px #0000001a;
  }
`;

const StyledHowItWorks = styled.section`
  background-color: ${theme.colors.card};
  padding: 64px 128px 64px 128px;
  text-align: center;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 16px;
  h3 {
    font-size: 28px;
  }
  p {
    font-size: 16px;
  }
`;
const StyledHowItWorksCardSection = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 64px;
  margin-top: 32px;
`;
const StyledHowItWorksCard = styled.div`
  border: 1px solid ${theme.colors.border};
  border-radius: 12px;
  padding: 48px;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 18px;
  justify-content: center;
  align-items: center;
  h3 {
    font-size: 24px;
  }
  p {
    font-size: 16px;
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
  }
`;

const StyledTakeItWithYou = styled.section`
  background-color: ${theme.colors.background};
  padding: 64px 128px 64px 128px;
  text-align: center;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 16px;
  h3 {
    font-size: 28px;
  }
  p {
    font-size: 16px;
  }
`;

const StyledTakeItWithYouCardSection = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 64px;
  margin-top: 32px;
`;
const StyledTakeItWithYouCard = styled.div`
  border-radius: 12px;
  padding: 48px;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 18px;
  justify-content: center;
  align-items: center;

  h3 {
    font-size: 16px;
  }
  p {
    font-size: 12px;
  }
`;

// add below your other styled components
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
`;

const WristbandBadge = styled(DeviceBase)`
  width: 200px;
  height: 56px; /* elongated band */
  border-radius: 9999px;
`;

const CardBadge = styled(DeviceBase)`
  width: 160px;
  height: 100px; /* card rectangle */
  border-radius: 12px;
`;

const QRImg = styled.img`
  width: 42px;
  aspect-ratio: 1 / 1;
  height: auto;
  object-fit: contain;
  background: ${theme.colors.accent};
  padding: 4px;
  border-radius: 6px;
`;

const StyledFooter = styled.footer`
  background-color: ${theme.colors.primary};
  color: ${theme.colors.background};
  padding: 64px 128px 64px 128px;
  text-align: center;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 16px;
  h4 {
    font-size: 24px;
  }
  p {
    font-size: 16px;
  }
  div {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 6px;
    img {
      background-color: ${theme.colors.accent};
      padding: 4px;
      width: 28px;
      border-radius: 8px;
    }
  }
`;

export default function Home() {
  return (
    <StyledPage className={styles.page}>
      <StyledHeader>
        <div>
          <img src="security.png" alt="" />
          <StyledHeaderLogoText>Beacon</StyledHeaderLogoText>
        </div>
        <StyledSignInButton>Sign In</StyledSignInButton>
      </StyledHeader>
      <StyledHero>
        <StyledHeroInfo>
          <h2>Never stranded without your contacts.</h2>
          <p>
            Store your emergency contacts safely and access them from any
            device. Generate a QR code for keychains, wristbands, or cards so
            help is always within reach.
          </p>
          <StyledCTAButton>Get Started Free</StyledCTAButton>
        </StyledHeroInfo>
        <StyledHeroImage>
          <img src="heroImage.png" alt="" />
        </StyledHeroImage>
      </StyledHero>
      <StyledHowItWorks>
        <h3>How It Works</h3>
        <p>
          Three simple steps to ensure you're never without your emergency
          contacts
        </p>
        <StyledHowItWorksCardSection>
          <StyledHowItWorksCard>
            <StyledHowItWorksCardImageWrapper>
              <img src="user.png" alt="" />
            </StyledHowItWorksCardImageWrapper>
            <h3>Add Your Contacts</h3>
            <p>
              Sign up and add your emergency contacts with names, relationships,
              and phone numbers.
            </p>
          </StyledHowItWorksCard>
          <StyledHowItWorksCard>
            {" "}
            <StyledHowItWorksCardImageWrapper>
              <img src="qr-code.png" alt="" />
            </StyledHowItWorksCardImageWrapper>
            <h3>Get Your QR Code</h3>
            <p>
              Generate your personal QR code that links to your emergency
              contact information.
            </p>
          </StyledHowItWorksCard>
          <StyledHowItWorksCard>
            <StyledHowItWorksCardImageWrapper>
              <img src="iphone.png" alt="" />
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
          <img src="security.png" alt="" />
          <h4>Beacon</h4>
        </div>
        <p>Your light in an emergency.</p>
      </StyledFooter>
    </StyledPage>
  );
}
