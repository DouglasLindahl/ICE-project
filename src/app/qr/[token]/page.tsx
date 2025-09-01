"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/browserClient";

type PubContact = {
  name: string;
  relationship: string | null;
  phone_e164: string;
  priority: number | null;
};

export default function QRPublicPage({
  params,
}: {
  params: { token: string };
}) {
  const supa = createClient();
  const [contacts, setContacts] = useState<PubContact[] | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data, error } = await supa.rpc("get_contacts_by_token", {
        p_token: params.token,
      });
      if (!mounted) return;
      if (error || !data || data.length === 0) {
        setNotFound(true);
      } else {
        setContacts(data);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [params.token, supa]);

  // minimal, no branding
  return (
    <html lang="en">
      <head>
        <title>Emergency Contacts</title>
        <meta name="robots" content="noindex,nofollow" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>{`
          body { margin:0; font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; background:#fff; color:#111; }
          main { max-width: 520px; margin: 24px auto; padding: 16px; }
          h1 { font-size: 22px; margin: 0 0 16px; }
          .card { border:1px solid #e5e7eb; border-radius:12px; padding:14px 16px; margin-bottom:12px; background:#fafafa; }
          .name { font-weight:600; margin:0 0 6px; }
          .rel { opacity:.7; font-size:14px; margin:0 0 8px; }
          .btn { display:block; width:100%; text-align:center; padding:12px 14px; border-radius:8px; border:1px solid #e5e7eb; text-decoration:none; color:inherit; font-weight:600; }
          .btn + .btn { margin-top:8px; }
        `}</style>
      </head>
      <body>
        <main>
          <h1>Emergency contacts</h1>
          {notFound && <p>No active contacts found.</p>}
          {contacts?.map((c, i) => (
            <div className="card" key={i}>
              <p className="name">{c.name}</p>
              <p className="rel">{c.relationship || "Contact"}</p>
              <a className="btn" href={`tel:${c.phone_e164}`}>
                Call {c.name} ({c.phone_e164})
              </a>
            </div>
          ))}
        </main>
      </body>
    </html>
  );
}
