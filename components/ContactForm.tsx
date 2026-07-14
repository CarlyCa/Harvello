"use client";

import { useState } from "react";

const CONTACT_EMAIL = "carly@getharvello.com";

export function ContactForm() {
  const [status, setStatus] = useState("");

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const phone = String(formData.get("phone") ?? "").trim();
    const organization = String(formData.get("organization") ?? "").trim();
    const message = String(formData.get("message") ?? "").trim();

    if (!name || !email) {
      setStatus("Add your name and email before submitting.");
      return;
    }

    const subject = encodeURIComponent(`Harvello contact request${organization ? ` - ${organization}` : ""}`);
    const body = encodeURIComponent(
      [
        "Hi Carly,",
        "",
        "Someone submitted the Harvello contact form.",
        "",
        `Name: ${name}`,
        `Email: ${email}`,
        `Phone: ${phone || "Not provided"}`,
        `Organization: ${organization || "Not provided"}`,
        "",
        "Message:",
        message || "Not provided"
      ].join("\n")
    );

    setStatus("Opening your email app...");
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
  }

  return (
    <form onSubmit={submit} className="rounded-2xl bg-[#fbfbf6] p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <ContactField label="Name" name="name" placeholder="Jane Smith" required />
        <ContactField label="Email" name="email" placeholder="jane@parkdistrict.org" type="email" required />
        <ContactField label="Phone" name="phone" placeholder="(847) 555-0100" type="tel" />
        <ContactField label="Organization" name="organization" placeholder="Riverdale Park District" />
      </div>
      <label className="mt-4 block">
        <span className="text-sm font-bold text-[#073f32]">Message</span>
        <textarea
          name="message"
          rows={4}
          placeholder="How can we help?"
          className="focus-ring mt-2 w-full rounded-md border border-[#dce4dd] bg-white px-3 py-3 text-sm leading-6 text-[#073f32] placeholder:text-[#7b8b86]"
        />
      </label>
      <button
        type="submit"
        className="focus-ring mt-5 w-full rounded-md bg-[#0b8f4d] px-5 py-3 text-sm font-bold text-white hover:bg-[#076f3d]"
      >
        Submit request
      </button>
      {status ? <p className="mt-3 text-center text-xs font-bold text-[#0b6f43]">{status}</p> : null}
    </form>
  );
}

function ContactField({
  label,
  name,
  placeholder,
  type = "text",
  required = false
}: {
  label: string;
  name: string;
  placeholder: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-[#073f32]">{label}</span>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
        className="focus-ring mt-2 min-h-11 w-full rounded-md border border-[#dce4dd] bg-white px-3 text-sm text-[#073f32] placeholder:text-[#7b8b86]"
      />
    </label>
  );
}
