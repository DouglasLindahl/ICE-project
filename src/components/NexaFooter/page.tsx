import styled from "styled-components";
import { theme } from "../../../styles/theme";
import NexaLogo from "../NexaLogo/page";

const PagePad = "clamp(16px, 5vw, 128px)";
// replace your StyledFooter
const StyledFooter = styled.footer`
  width: 100%;
  background-color: ${theme.colors.primary};
  /* Remove absolute positioning */
  position: static;
  /* Stick to bottom when page is short */
  margin-top: auto;

  padding: 32px 0 0 0;
  text-align: center;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 16px;

  /* safe-area padding for iOS home indicator */
  padding-bottom: max(12px, env(safe-area-inset-bottom));
  box-shadow: 0 -1px 0 ${theme.colors.border};
`;

const StyledFooterInfoSection = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  flex-direction: column;
`;
const StyledFooterInfoHeader = styled.h5`
  color: ${theme.colors.background};
  font-size: 18px;
`;
const StyledFooterInfo = styled.p`
  color: ${theme.colors.background};
`;
// optional: give the bottom strip its own safe-area room
const BottomBar = styled.div`
  width: 100%;

  padding: 10px clamp(16px, 5vw, 128px) max(12px, env(safe-area-inset-bottom));
  font-size: 0.85rem;
  letter-spacing: 0.02em;
  color: ${theme.colors.background};
`;

const Muted = styled.span`
  opacity: 0.9;
`;
export default function NexaFooter() {
  return (
    <StyledFooter>
      <NexaLogo></NexaLogo>

      <StyledFooterInfoSection>
        <StyledFooterInfo>support@nexaqr.com</StyledFooterInfo>
      </StyledFooterInfoSection>

      <BottomBar>
        <Muted>Copyright ©{new Date().getFullYear()} • Designed by </Muted>
        <strong>INVICOM</strong>
      </BottomBar>
    </StyledFooter>
  );
}
