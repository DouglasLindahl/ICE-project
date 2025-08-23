"use client"
import Image from "next/image";
import styles from "./page.module.css";
import styled from "styled-components";
import {theme } from "../../styles/theme";


const StyledPage = styled.div`
  background-color: ${theme.colors.background}; 
`;

const StyledHeader = styled.header`background-color: ${theme.colors.card};
height: 128px;  `;


export default function Home() {
  return (
    <StyledPage className={styles.page}>
<StyledHeader>asd</StyledHeader>

    </StyledPage>
  );
}
