import styled from "styled-components";
import { theme } from "../../../styles/theme";
import NexaLogo from "../NexaLogo/page";

const PagePad = "clamp(16px, 5vw, 128px)";
const StyledFooter = styled.footer`
  width: 100%;
  background-color: ${theme.colors.primary};

  padding: 64px ${PagePad};
  text-align: center;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 16px;
  p {
    color: ${theme.colors.background};
  }
`;
export default function NexaFooter() {
  return (
    <StyledFooter>
      <NexaLogo></NexaLogo>
      <p>Your light in an emergency.</p>
    </StyledFooter>
  );
}
