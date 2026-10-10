import React from 'react';

interface ElDoradoLogoProps {
  size?: number;
  className?: string;
}

/**
 * Exact high-resolution SVG replica of the official seal of
 * এল ডরাডো মডেল স্কুল (El Dorado Model School)
 * জ্ঞানই আলো | স্থাপিতঃ ২০০৯ খ্রীঃ | পড় তোমার প্রভুর নামে
 * বুড়িরপাড়া, জিরাবো, আশুলিয়া, সাভার, ঢাকা
 */
export const ElDoradoLogo: React.FC<ElDoradoLogoProps> = ({ size = 52, className = '' }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 300 300"
      className={`shrink-0 select-none ${className}`}
      role="img"
      aria-label="এল ডরাডো মডেল স্কুল লোগো - El Dorado Model School Official Seal"
    >
      <defs>
        {/* Top outer curved path for school name */}
        <path id="topArc" d="M 42,150 A 108,108 0 1,1 258,150" fill="none" />
        {/* Bottom outer curved path for address */}
        <path id="bottomArc" d="M 36,156 A 114,114 0 0,0 264,156" fill="none" />
        {/* Inner bottom curved path for motto */}
        <path id="innerBottomArc" d="M 78,162 A 74,74 0 0,0 222,162" fill="none" />
      </defs>

      {/* Outer white circular seal base */}
      <circle cx="150" cy="150" r="144" fill="#ffffff" stroke="#c81e1e" strokeWidth="6" />
      {/* Inner circle border */}
      <circle cx="150" cy="150" r="90" fill="#ffffff" stroke="#c81e1e" strokeWidth="4.5" />

      {/* Top Curved School Title */}
      <text
        fill="#111827"
        fontSize="25"
        fontWeight="700"
        letterSpacing="1"
        style={{ fontFamily: "'Anek Bangla', 'Noto Sans Bengali', sans-serif" }}
      >
        <textPath href="#topArc" startOffset="50%" textAnchor="middle">
          এল্ ডরাডো মডেল স্কুল
        </textPath>
      </text>

      {/* Bottom Curved Address */}
      <text
        fill="#111827"
        fontSize="19"
        fontWeight="700"
        style={{ fontFamily: "'Anek Bangla', 'Noto Sans Bengali', sans-serif" }}
      >
        <textPath href="#bottomArc" startOffset="50%" textAnchor="middle">
          বুড়িরপাড়া, জিরাবো, আশুলিয়া, সাভার, ঢাকা
        </textPath>
      </text>

      {/* Left & Right Red Stars */}
      <polygon
        points="38,142 42,152 52,152 44,158 47,168 38,162 29,168 32,158 24,152 34,152"
        fill="#b91c1c"
      />
      <polygon
        points="262,142 266,152 276,152 268,158 271,168 262,162 253,168 256,158 248,152 258,152"
        fill="#b91c1c"
      />

      {/* Rising Red Sun above Open Book */}
      <path d="M 131,94 A 19,19 0 0,1 169,94 Z" fill="#b91c1c" />
      <g stroke="#b91c1c" strokeWidth="2.5" strokeLinecap="round">
        <line x1="150" y1="67" x2="150" y2="73" />
        <line x1="138" y1="69" x2="140" y2="75" />
        <line x1="162" y1="69" x2="160" y2="75" />
        <line x1="126" y1="76" x2="131" y2="80" />
        <line x1="174" y1="76" x2="169" y2="80" />
        <line x1="119" y1="86" x2="125" y2="88" />
        <line x1="181" y1="86" x2="175" y2="88" />
      </g>

      {/* Open Book with 1 / ১ and অ / A */}
      <g>
        <rect
          x="122"
          y="94"
          width="28"
          height="34"
          rx="1"
          fill="#ffffff"
          stroke="#111827"
          strokeWidth="3"
        />
        <rect
          x="150"
          y="94"
          width="28"
          height="34"
          rx="1"
          fill="#ffffff"
          stroke="#111827"
          strokeWidth="3"
        />
        <text
          x="136"
          y="108"
          fontSize="11"
          fontWeight="800"
          textAnchor="middle"
          fill="#111827"
        >
          1
        </text>
        <text
          x="136"
          y="123"
          fontSize="12"
          fontWeight="800"
          textAnchor="middle"
          fill="#111827"
        >
          ১
        </text>
        <text
          x="164"
          y="108"
          fontSize="12"
          fontWeight="800"
          textAnchor="middle"
          fill="#111827"
        >
          অ
        </text>
        <text
          x="164"
          y="123"
          fontSize="11"
          fontWeight="800"
          textAnchor="middle"
          fill="#111827"
        >
          A
        </text>
      </g>

      {/* Left Green Water Lily (শাপলা) & Waves */}
      <g fill="none" stroke="#15803d" strokeWidth="2.2" strokeLinecap="round">
        <path d="M 96,150 C 96,132 96,126 96,124 C 96,126 96,132 96,150" fill="#15803d" />
        <path d="M 96,150 C 89,136 91,126 96,123 C 101,126 103,136 96,150 Z" fill="#dcfce7" />
        <path d="M 96,150 C 82,138 83,128 89,126 C 92,132 93,140 96,150 Z" fill="#dcfce7" />
        <path d="M 96,150 C 110,138 109,128 103,126 C 100,132 99,140 96,150 Z" fill="#dcfce7" />
        <path d="M 96,150 C 75,144 76,135 83,134 C 87,139 91,145 96,150 Z" fill="#dcfce7" />
        <path d="M 96,150 C 117,144 116,135 109,134 C 105,139 101,145 96,150 Z" fill="#dcfce7" />
        <path d="M 76,155 Q 86,151 96,155 T 116,155" />
        <path d="M 78,160 Q 87,156 96,160 T 114,160" />
      </g>

      {/* Right Green Water Lily (শাপলা) & Waves */}
      <g fill="none" stroke="#15803d" strokeWidth="2.2" strokeLinecap="round">
        <path d="M 204,150 C 197,136 199,126 204,123 C 209,126 211,136 204,150 Z" fill="#dcfce7" />
        <path d="M 204,150 C 190,138 191,128 197,126 C 200,132 201,140 204,150 Z" fill="#dcfce7" />
        <path d="M 204,150 C 218,138 217,128 211,126 C 208,132 207,140 204,150 Z" fill="#dcfce7" />
        <path d="M 204,150 C 183,144 184,135 191,134 C 195,139 199,145 204,150 Z" fill="#dcfce7" />
        <path d="M 204,150 C 225,144 224,135 217,134 C 213,139 209,145 204,150 Z" fill="#dcfce7" />
        <path d="M 184,155 Q 194,151 204,155 T 224,155" />
        <path d="M 186,160 Q 195,156 204,160 T 222,160" />
      </g>

      {/* Center Motto: জ্ঞানই আলো */}
      <text
        x="150"
        y="148"
        fontSize="16"
        fontWeight="800"
        textAnchor="middle"
        fill="#111827"
        style={{ fontFamily: "'Hind Siliguri', sans-serif" }}
      >
        জ্ঞানই
      </text>
      <text
        x="150"
        y="165"
        fontSize="16"
        fontWeight="800"
        textAnchor="middle"
        fill="#111827"
        style={{ fontFamily: "'Hind Siliguri', sans-serif" }}
      >
        আলো
      </text>

      {/* Established Year */}
      <text
        x="150"
        y="186"
        fontSize="14.5"
        fontWeight="800"
        textAnchor="middle"
        fill="#111827"
        style={{ fontFamily: "'Hind Siliguri', sans-serif" }}
      >
        স্থাপিতঃ ২০০৯ খ্রীঃ
      </text>

      {/* Inner Bottom Motto: পড় তোমার প্রভুর নামে */}
      <text
        fill="#111827"
        fontSize="13.5"
        fontWeight="800"
        style={{ fontFamily: "'Hind Siliguri', sans-serif" }}
      >
        <textPath href="#innerBottomArc" startOffset="50%" textAnchor="middle">
          পড় তোমার প্রভুর নামে
        </textPath>
      </text>
    </svg>
  );
};
