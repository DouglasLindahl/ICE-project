"use client";
import ContactForm from "@/components/ContactForm/page";
import { NexaButton } from "@/components/NexaButton/page";
import styled from "styled-components";
import { useRouter } from "next/navigation";

const StyledContactPage = styled.div`
  padding: 32px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: start;
  gap: 24px;
`;

export default function ContactPage() {
  const router = useRouter();
  return (
    <StyledContactPage className="px-6 py-10">
      <NexaButton
        noPadding
        variant="ghost"
        onClick={() => router.push("/dashboard")}
        aria-label="Back to Dashboard"
      >
        Back to Dashboard
      </NexaButton>

      <ContactForm />
    </StyledContactPage>
  );
}
