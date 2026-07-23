import { SectionShell } from "@/components/layout/section-shell";
import { ContactForm } from "@/components/contact/contact-form";

export const metadata = {
  title: "Contact | DS1",
  description: "Contacto profesional para colaboraciones y proyectos.",
};

export default function ContactPage() {
  return (
    <SectionShell id="contact-page" eyebrow="CONTACT" title="Communication Terminal">
      <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
        <div className="space-y-4 text-[var(--color-text-muted)]">
          <p>
            Available for freelance, product collaborations and technical consulting.
            Messages sent through this terminal are validated server-side.
          </p>
          <p>Email: hello@ds1.dev</p>
          <p>Location: Argentina</p>
        </div>
        <ContactForm />
      </div>
    </SectionShell>
  );
}
