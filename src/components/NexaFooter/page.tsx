import styled from "styled-components";
import { theme } from "../../../styles/theme";
import NexaLogo from "../NexaLogo/page";

const StyledFooter = styled.footer`
  width: 100%;
  background-color: ${theme.colors.primary};

  position: static;
  padding: 32px;
  margin-top: auto;
  text-align: center;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 16px;

  box-shadow: 0 -1px 0 ${theme.colors.border};
`;

const StyledFooterInfoSection = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  flex-direction: column;
`;

const StyledFooterInfo = styled.p`
  color: ${theme.colors.background};
`;

export default function NexaFooter() {
  return (
    <StyledFooter>
      <NexaLogo></NexaLogo>

      <StyledFooterInfoSection>
        <StyledFooterInfo>support@nexaqr.com</StyledFooterInfo>
      </StyledFooterInfoSection>
    </StyledFooter>
  );
}
