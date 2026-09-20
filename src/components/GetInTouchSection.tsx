import { Mail, Phone, Clock, MapPin, Facebook, Instagram, MessageCircle } from "lucide-react";

const socials = [
  { icon: Mail, href: "mailto:varietieswatchshop@gmail.com", label: "Email" },
  { icon: Facebook, href: "https://www.facebook.com/share/1J8SDLh3zc/?mibextid=wwXIfr", label: "Facebook" },
  { icon: Instagram, href: "https://www.instagram.com/varieties_watch_shop?igsh=b29wMWgwZTdmajBx&utm_source=qr", label: "Instagram" },
  {
    icon: () => (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.75a8.18 8.18 0 0 0 4.76 1.52V6.84a4.84 4.84 0 0 1-1-.15z" />
      </svg>
    ),
    href: "https://www.tiktok.com/@varietieswatchshop__",
    label: "TikTok",
  },
  {
    icon: () => (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-[18px] h-[18px]">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
      </svg>
    ),
    href: "https://wa.me/+8801791635989",
    label: "WhatsApp",
  },
];

const hotlines = [
  { number: "01791635989", whatsapp: "8801791635989" },
];

const GetInTouchSection = () => {
  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-secondary">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
        {/* Social Icons */}
        <div className="flex justify-center gap-4 mb-10">
          {socials.map((s) => {
            const Icon = s.icon;
            return (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.label}
                onClick={(e) => {
                  // Fallback for sandboxed iframes (e.g. preview) that may block target="_blank"
                  e.preventDefault();
                  window.open(s.href, "_blank", "noopener,noreferrer");
                }}
                className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-accent transition-colors"
              >
                <Icon size={18} />
              </a>
            );
          })}
        </div>

        {/* Title */}
        <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-semibold text-center text-foreground mb-12">
          Get in Touch
        </h2>

        {/* Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-4xl mx-auto text-center">
          {/* Email */}
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Mail size={20} className="text-primary" />
            </div>
            <h4 className="font-body text-[11px] font-semibold tracking-[0.2em] uppercase text-foreground">Email</h4>
            <a
              href="mailto:varietieswatchshop@gmail.com"
              className="font-body text-[13px] text-muted-foreground hover:text-foreground transition-colors break-all"
            >
              varietieswatchshop@gmail.com
            </a>
          </div>

          {/* Hours */}
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Clock size={20} className="text-primary" />
            </div>
            <h4 className="font-body text-[11px] font-semibold tracking-[0.2em] uppercase text-foreground">Hours</h4>
            <p className="font-body text-[13px] text-muted-foreground">
              Sunday – Friday
              <br />
              9am – 11pm
            </p>
          </div>

          {/* Location */}
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <MapPin size={20} className="text-primary" />
            </div>
            <h4 className="font-body text-[11px] font-semibold tracking-[0.2em] uppercase text-foreground">Location</h4>
            <ul className="font-body text-[13px] text-muted-foreground space-y-3 text-left list-none">
              <li className="flex gap-2">
                <span aria-hidden="true" className="text-gold leading-tight">••</span>
                <span>
                  Shop no :- 108, Ground Floor,
                  <br />
                  Twin Tower Concord Shopping Complex,
                  <br />
                  Shantinagar, Dhaka.
                </span>
              </li>
              <li className="flex gap-2">
                <span aria-hidden="true" className="text-gold leading-tight">••</span>
                <span>
                  Shop no :- 5, C block, 1st floor,
                  <br />
                  Gulzar Tower, Chawkbazar,
                  <br />
                  Chattogram.
                </span>
              </li>
            </ul>
          </div>

          {/* Hotline */}
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Phone size={20} className="text-primary" />
            </div>
            <h4 className="font-body text-[11px] font-semibold tracking-[0.2em] uppercase text-foreground">Hotline</h4>
            <div className="space-y-2">
              {hotlines.map((h) => (
                <div key={h.number} className="flex items-center gap-2 justify-center">
                  <a
                    href={`tel:${h.number}`}
                    className="font-body text-[13px] text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {h.number}
                  </a>
                  <a
                    href={`tel:${h.number}`}
                    aria-label={`Call ${h.number}`}
                    className="text-primary hover:text-accent transition-colors"
                  >
                    <Phone size={14} />
                  </a>
                  <a
                    href={`https://wa.me/${h.whatsapp}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`WhatsApp ${h.number}`}
                    className="text-primary hover:text-accent transition-colors"
                  >
                    <MessageCircle size={14} />
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default GetInTouchSection;
