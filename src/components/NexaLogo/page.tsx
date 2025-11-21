import styled, { keyframes, css } from "styled-components";
import { theme } from "../../../styles/theme";
import React from "react";

type Mode = "light" | "dark" | "accent";

interface StyledProps {
  $mode: Mode;
  $shimmer: boolean;
}

interface NexaLogoProps {
  mode?: Mode;
  shimmer?: boolean;
}

const shimmerAnim = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

const StyledLogo = styled.div<StyledProps>`
  text-align: center;
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  gap: 8px;
  font-size: clamp(18px, 4.5vw, 24px);
  font-weight: bold;
  line-height: 1;
  letter-spacing: 0.2px;
  margin: 0;

  /* choose text color based on mode */
  color: ${({ $mode }) => {
    switch ($mode) {
      case "dark":
        return theme.colors.primary;
      case "accent":
        return theme.colors.accent;
      default:
        return theme.colors.background;
    }
  }};

  img {
    width: 36px;
    height: 36px;

    object-fit: contain;

    ${({ $shimmer }) =>
      $shimmer &&
      css`
        background-image: linear-gradient(
          90deg,
          rgba(255, 255, 255, 0.15),
          transparent 40%,
          rgba(255, 255, 255, 0.15)
        );
        background-size: 200% 100%;
        animation: ${shimmerAnim} 2.5s linear infinite;
      `}
  }

  @media (prefers-reduced-motion: reduce) {
    img {
      animation: none;
    }
  }
`;

const NexaLogo: React.FC<NexaLogoProps> = ({
  mode = "light",
  shimmer = false,
}) => {
  return (
    <StyledLogo $mode={mode} $shimmer={shimmer}>
      <img src="logo/nexaqr-logo-mark-accent.png" alt="icon" />
      NexaQR
    </StyledLogo>
  );
};

export default NexaLogo;
