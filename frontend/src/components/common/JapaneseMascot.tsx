"use client";

interface JapaneseMascotProps {
  type?: "shiba-lost" | "cat-repair" | "cat-lucky";
  className?: string;
  size?: number;
}

export function JapaneseMascot({
  type = "shiba-lost",
  className = "",
  size = 180,
}: JapaneseMascotProps) {
  if (type === "cat-repair") {
    // Kawaii Maneki Neko with bowing / repair ribbon and sakura
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`select-none ${className}`}
      >
        {/* Soft Background Glow */}
        <circle cx="100" cy="100" r="90" fill="currentColor" className="text-rose-500/10 dark:text-rose-500/15" />

        {/* Falling Sakura Petals */}
        <path d="M40 50 C45 40, 55 45, 50 55 C45 60, 35 55, 40 50 Z" fill="#FDA4AF" opacity="0.8" />
        <path d="M160 60 C165 52, 175 58, 170 66 C164 72, 155 68, 160 60 Z" fill="#FB7185" opacity="0.7" />
        <path d="M35 140 C40 132, 50 138, 45 146 C39 152, 30 148, 35 140 Z" fill="#FDA4AF" opacity="0.7" />

        {/* Cat Ears */}
        <path d="M55 80 L35 40 L80 62 Z" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="3" strokeLinejoin="round" />
        <path d="M52 74 L42 48 L70 63 Z" fill="#FECDD3" />
        <path d="M145 80 L165 40 L120 62 Z" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="3" strokeLinejoin="round" />
        <path d="M148 74 L158 48 L130 63 Z" fill="#FECDD3" />

        {/* Head */}
        <ellipse cx="100" cy="98" rx="55" ry="48" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="3" />

        {/* Calico Spot */}
        <path d="M65 65 C75 60, 95 62, 90 80 C85 92, 60 85, 65 65 Z" fill="#FB923C" opacity="0.9" />

        {/* Cheeks */}
        <ellipse cx="68" cy="108" rx="8" ry="5" fill="#FDA4AF" opacity="0.8" />
        <ellipse cx="132" cy="108" rx="8" ry="5" fill="#FDA4AF" opacity="0.8" />

        {/* Eyes (Apologetic / Soft blinking closed eyes) */}
        <path d="M72 96 Q82 104 90 96" stroke="#334155" strokeWidth="3.5" strokeLinecap="round" fill="none" />
        <path d="M110 96 Q118 104 128 96" stroke="#334155" strokeWidth="3.5" strokeLinecap="round" fill="none" />

        {/* Cute Triangular Nose */}
        <polygon points="97,105 103,105 100,109" fill="#FB7185" />

        {/* Mouth */}
        <path d="M95 111 Q100 115 105 111" stroke="#334155" strokeWidth="2.5" strokeLinecap="round" fill="none" />

        {/* Whiskers */}
        <line x1="42" y1="102" x2="60" y2="105" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
        <line x1="40" y1="112" x2="58" y2="111" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
        <line x1="158" y1="102" x2="140" y2="105" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
        <line x1="160" y1="112" x2="142" y2="111" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />

        {/* Red Collar & Golden Bell */}
        <path d="M65 138 Q100 148 135 138" stroke="#E11D48" strokeWidth="9" strokeLinecap="round" />
        <circle cx="100" cy="148" r="10" fill="#FBBF24" stroke="#D97706" strokeWidth="2" />
        <circle cx="100" cy="148" r="2.5" fill="#78350F" />
        <line x1="100" y1="150.5" x2="100" y2="157" stroke="#78350F" strokeWidth="2" strokeLinecap="round" />

        {/* Body & Paws Holding a Small Wrench */}
        <path d="M70 144 C65 170, 75 185, 100 185 C125 185, 135 170, 130 144 Z" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="3" />
        <ellipse cx="80" cy="160" rx="10" ry="8" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="2.5" />
        <ellipse cx="120" cy="160" rx="10" ry="8" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="2.5" />

        {/* Cute Japanese Headband (Hachimaki) with Rising Sun Heart */}
        <path d="M50 78 Q100 64 150 78" stroke="#F43F5E" strokeWidth="7" strokeLinecap="round" />
        <circle cx="100" cy="71" r="5" fill="#FFFFFF" />
        <circle cx="100" cy="71" r="3" fill="#E11D48" />
      </svg>
    );
  }

  // Default: Kawaii Shiba Inu Explorer with Japanese Headband (Lost map / 404)
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`select-none ${className}`}
    >
      {/* Background Zen Halo */}
      <circle cx="100" cy="100" r="92" fill="currentColor" className="text-amber-500/10 dark:text-amber-500/15" />

      {/* Floating Sakura Petals */}
      <path d="M38 48 C43 38, 53 43, 48 53 C43 58, 33 53, 38 48 Z" fill="#FDA4AF" opacity="0.85" />
      <path d="M162 45 C168 38, 178 44, 172 52 C166 58, 158 54, 162 45 Z" fill="#FB7185" opacity="0.75" />
      <path d="M165 145 C170 137, 180 143, 175 151 C169 157, 160 153, 165 145 Z" fill="#FDA4AF" opacity="0.8" />

      {/* Pointy Shiba Ears */}
      <path d="M52 75 L38 30 L85 52 Z" fill="#E08338" stroke="#C26A25" strokeWidth="3" strokeLinejoin="round" />
      <path d="M52 68 L44 40 L75 54 Z" fill="#FED7AA" />
      <path d="M148 75 L162 30 L115 52 Z" fill="#E08338" stroke="#C26A25" strokeWidth="3" strokeLinejoin="round" />
      <path d="M148 68 L156 40 L125 54 Z" fill="#FED7AA" />

      {/* Shiba Head Base */}
      <ellipse cx="100" cy="98" rx="56" ry="50" fill="#F59E0B" stroke="#D97706" strokeWidth="3" />

      {/* White Cheek / Muzzle Fluff (Urajiro) */}
      <path
        d="M60 92 C55 125, 78 140, 100 140 C122 140, 145 125, 140 92 C132 108, 118 116, 100 116 C82 116, 68 108, 60 92 Z"
        fill="#FFFBEB"
        stroke="#FEF3C7"
        strokeWidth="2"
      />

      {/* Shiba Eyebrow Dots (Maro-mayu) */}
      <ellipse cx="78" cy="74" rx="5" ry="4" fill="#FFFBEB" />
      <ellipse cx="122" cy="74" rx="5" ry="4" fill="#FFFBEB" />

      {/* Inquisitive / Puzzled Eyes */}
      <ellipse cx="76" cy="89" rx="6.5" ry="7.5" fill="#1E293B" />
      <circle cx="74" cy="86" r="2.5" fill="#FFFFFF" />
      <ellipse cx="124" cy="89" rx="6.5" ry="7.5" fill="#1E293B" />
      <circle cx="122" cy="86" r="2.5" fill="#FFFFFF" />

      {/* Rosy Cheeks */}
      <ellipse cx="64" cy="108" rx="7" ry="4.5" fill="#FDA4AF" opacity="0.8" />
      <ellipse cx="136" cy="108" rx="7" ry="4.5" fill="#FDA4AF" opacity="0.8" />

      {/* Shiba Nose */}
      <polygon points="95,104 105,104 100,110" fill="#1E293B" />

      {/* Happy Little W-Mouth with cute tongue */}
      <path d="M93 112 Q97 116 100 112 Q103 116 107 112" stroke="#1E293B" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <path d="M97 115 Q100 124 103 115 Z" fill="#FB7185" />

      {/* Green Japanese Arabesque Bandana (Furoshiki with swirls) */}
      <path d="M60 138 Q100 152 140 138 Q100 162 60 138 Z" fill="#10B981" stroke="#059669" strokeWidth="2" />
      <circle cx="85" cy="144" r="2" fill="#ECFDF5" />
      <circle cx="100" cy="147" r="2.5" fill="#ECFDF5" />
      <circle cx="115" cy="144" r="2" fill="#ECFDF5" />

      {/* Shiba Paws Poking Out */}
      <ellipse cx="78" cy="164" rx="11" ry="8" fill="#FFFBEB" stroke="#D97706" strokeWidth="2" />
      <ellipse cx="122" cy="164" rx="11" ry="8" fill="#FFFBEB" stroke="#D97706" strokeWidth="2" />

      {/* Japanese Traditional Lantern / Torii Marker Badge */}
      <circle cx="152" cy="120" r="14" fill="#E11D48" stroke="#FFFFFF" strokeWidth="2.5" />
      <text x="152" y="125" textAnchor="middle" fill="#FFFFFF" fontSize="12" fontWeight="bold" fontFamily="sans-serif">
        404
      </text>
    </svg>
  );
}
